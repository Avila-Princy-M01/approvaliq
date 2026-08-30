"""Document pre-validation and dry-run endpoints."""

from __future__ import annotations

import base64
import binascii

from fastapi import APIRouter

from app.documents.contradictions import detect_contradictions
from app.documents.fixtures import load_pack, load_pack_documents
from app.documents.queries import predict_queries
from app.documents.readiness import calculate_readiness, derive_status

router = APIRouter(prefix="/api/v1", tags=["validation"])

# Expected fields per requirement-id.
# Populated with real field lists — not an empty dict.
_EXPECTED_FIELDS: dict[str, list[str]] = {
    "factory-license": [
        "companyName",
        "registrationNumber",
        "factoryAddress",
        "factoryAreaSqFt",
        "employeeCount",
        "hasBoiler",
    ],
    "mpcb-cte": [
        "companyName",
        "factoryAddress",
        "factoryAreaSqFt",
        "investmentCrore",
    ],
    "boiler-registration": [
        "companyName",
        "boilerCapacityLitres",
    ],
}


# ---------------------------------------------------------------------------
# POST /api/v1/validate  (fixed)
# ---------------------------------------------------------------------------


@router.post("/validate")
def validate_document(payload: dict) -> dict:
    """Validate an uploaded document against a requirement's expected fields.

    Extraction is fixture-backed in this prototype — OCR is not implemented.
    The endpoint checks structural integrity (base64 decodable) and field
    presence inside the document's own ``fields`` dict.

    Fixes vs original:
    - _EXPECTED_FIELDS is now populated (was empty dict → always valid).
    - Checks ``document["fields"]``, not the outer payload keys.
    """
    requirement_id: str | None = payload.get("requirement_id")
    document: dict = payload.get("document", {})
    content_b64: str = document.get("content_base64", "")

    if not content_b64:
        return {
            "valid": False,
            "missing_fields": ["document_content"],
            "notes": "No document content was provided.",
        }

    try:
        base64.b64decode(content_b64, validate=True)
    except (binascii.Error, ValueError):
        return {
            "valid": False,
            "missing_fields": [],
            "notes": "Document content could not be decoded. Please re-upload.",
        }

    # BUG FIX: inspect document["fields"], not the outer payload
    document_fields: dict = document.get("fields", {})
    expected_fields: list[str] = _EXPECTED_FIELDS.get(requirement_id or "", [])
    missing = [f for f in expected_fields if f not in document_fields]

    return {
        "valid": len(missing) == 0,
        "missing_fields": missing,
        "notes": (
            "Document received and passed structural checks."
            if not missing
            else f"Missing required fields: {', '.join(missing)}"
        ),
        "extraction_mode": "fixture — OCR not enabled",
    }


# ---------------------------------------------------------------------------
# POST /api/v1/dry-run
# ---------------------------------------------------------------------------


@router.post("/dry-run")
def dry_run(payload: dict) -> dict:
    """Application dry-run — checks a document pack for contradictions,
    missing documents, and readiness.

    Request body:
        {
            "document_pack": "demo-mismatch" | "demo-corrected",
            "application_id": "A10293"          (optional)
        }

    Response:
        DryRunResult with readiness_score, status, contradictions,
        missing_documents, and predicted_queries.

    ``demo-mismatch``  → readiness ~76, status "blocked"
    ``demo-corrected`` → readiness ~98, status "ready"

    Extraction is fixture-backed. Label shown in UI:
        "Demo fixture extraction — OCR not enabled."
    """
    pack_id: str = payload.get("document_pack", "demo-mismatch")
    application_id: str = payload.get("application_id", "A10293")

    # Load pack metadata and documents
    try:
        pack_meta = load_pack(pack_id)
    except KeyError:
        return {
            "error": f"Unknown document_pack: {pack_id!r}. Use 'demo-mismatch' or 'demo-corrected'."
        }

    documents = load_pack_documents(pack_id)
    uploaded_doc_ids: list[str] = pack_meta["documents"]
    mandatory_required: list[str] = pack_meta["mandatory_required"]

    # Missing mandatory documents
    uploaded_set = {d.strip().lower() for d in uploaded_doc_ids}
    missing_mandatory = [d for d in mandatory_required if d.strip().lower() not in uploaded_set]

    # Contradiction detection
    contradictions = detect_contradictions(documents)

    # Flattened extracted fields with confidence and verification status
    extracted_fields: list[dict] = []
    low_conf: list[dict] = []
    for doc in documents:
        doc_id = doc.get("document_id", "unknown")
        doc_label = doc.get("label", doc_id)
        for field_name, field_data in doc.get("fields", {}).items():
            conf = field_data.get("confidence", 1.0)
            extracted_fields.append(
                {
                    "field": field_name,
                    "label": field_data.get("label", field_name),
                    "value": field_data.get("value"),
                    "source_document": doc_id,
                    "source_label": doc_label,
                    "confidence": conf,
                    "verified": field_data.get("verified", False),
                }
            )
            if conf < 0.80:
                low_conf.append(
                    {
                        "field": field_name,
                        "doc_id": doc_id,
                        "confidence": conf,
                    }
                )

    # Readiness score
    readiness = calculate_readiness(
        documents=documents,
        contradictions=contradictions,
        mandatory_required=mandatory_required,
        uploaded=uploaded_doc_ids,
    )

    # Status (blocking override — score doesn't matter)
    status = derive_status(contradictions, missing_mandatory)

    # Predicted officer queries
    predicted_queries = predict_queries(contradictions, missing_mandatory, low_conf)

    return {
        "application_id": application_id,
        "document_pack": pack_id,
        "extraction_mode": "fixture",
        "extraction_note": "Demo fixture extraction — OCR not enabled.",
        "documents_expected": len(set(mandatory_required)),
        "documents_found": len(set(mandatory_required)) - len(missing_mandatory),
        "missing_documents": missing_mandatory,
        "extracted_fields": extracted_fields,
        "contradictions": contradictions,
        "readiness": readiness,
        "readiness_score": readiness["overall"],
        "status": status,
        "predicted_queries": predicted_queries,
    }

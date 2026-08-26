"""Document pre-validation endpoint."""

from __future__ import annotations

import base64

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["validation"])

# Placeholder expected-field sets per requirement. In a full implementation
# this would be derived from the ingested requirement's own metadata
# rather than hardcoded here.
_EXPECTED_FIELDS: dict[str, list[str]] = {}


@router.post("/validate")
def validate_document(payload: dict) -> dict:
    """Validate an uploaded document against a requirement's expected fields.

    This is a structural placeholder: real field-level validation (e.g.
    OCR + form-field extraction) is a downstream implementation detail.
    The contract — returning `valid`, `missing_fields`, and a human-
    readable `notes` string — is what the frontend and reviewers depend
    on, and should remain stable as the underlying validation logic
    evolves.
    """
    requirement_id = payload.get("requirement_id")
    document = payload.get("document", {})
    content_b64 = document.get("content_base64", "")

    if not content_b64:
        return {
            "valid": False,
            "missing_fields": ["document_content"],
            "notes": "No document content was provided.",
        }

    try:
        base64.b64decode(content_b64, validate=True)
    except Exception:
        return {
            "valid": False,
            "missing_fields": [],
            "notes": "Document content could not be decoded. Please re-upload.",
        }

    expected = _EXPECTED_FIELDS.get(requirement_id, [])
    # Real field-presence checking would run here against extracted document
    # content. Left as an explicit extension point.
    missing = []

    return {
        "valid": len(missing) == 0,
        "missing_fields": missing,
        "notes": "Document received and passed basic structural checks."
        if not missing
        else f"Missing required fields: {', '.join(missing)}",
    }

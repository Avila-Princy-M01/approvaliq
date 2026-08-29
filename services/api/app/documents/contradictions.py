"""Cross-document contradiction detector.

Groups extracted fields by name across all documents in a pack, then
applies field-appropriate comparison rules. Returns a sorted list of
Contradiction dicts (blocking → warning → informational).

No LLM, no OCR. Deterministic and offline-safe.
"""

from __future__ import annotations

from typing import Any, Literal

Severity = Literal["blocking", "warning", "informational"]

_SEVERITY_ORDER: dict[Severity, int] = {
    "blocking": 0,
    "warning": 1,
    "informational": 2,
}

# ---------------------------------------------------------------------------
# Field comparison rules
# ---------------------------------------------------------------------------

def _normalise_company_name(v: Any) -> str:
    import re
    s = str(v).lower()
    s = re.sub(r"private limited|pvt\.? ltd\.?|pvt limited", "pvtltd", s)
    s = re.sub(r"limited|ltd\.?", "ltd", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s


def _normalise_address(v: Any) -> str:
    import re
    s = str(v).lower()
    s = re.sub(r"\b(plot|survey|s\.?no\.?|gat)\b", "", s)
    s = re.sub(r"\b(road|rd|street|st|estate)\b", "", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s


# Each rule: (compare_mode, tolerance_pct_or_None, severity, normalise_fn_or_None)
_FIELD_RULES: dict[str, dict] = {
    "factoryAreaSqFt":    {"mode": "numeric",     "tolerance": 2.0,  "severity": "blocking",      "normalise": None},
    "investmentCrore":    {"mode": "numeric",     "tolerance": 5.0,  "severity": "warning",       "normalise": None},
    "employeeCount":      {"mode": "numeric",     "tolerance": 10.0, "severity": "warning",       "normalise": None},
    "companyName":        {"mode": "text",        "tolerance": None, "severity": "informational", "normalise": _normalise_company_name},
    "factoryAddress":     {"mode": "text",        "tolerance": None, "severity": "warning",       "normalise": _normalise_address},
    "registrationNumber": {"mode": "identifier",  "tolerance": None, "severity": "blocking",      "normalise": None},
    "hasBoiler":          {"mode": "boolean",     "tolerance": None, "severity": "blocking",      "normalise": None},
}

_LOW_CONFIDENCE_THRESHOLD = 0.80


# ---------------------------------------------------------------------------
# Comparison helpers
# ---------------------------------------------------------------------------

def _values_conflict(rule: dict, a: Any, b: Any) -> bool:
    mode = rule["mode"]
    if mode == "numeric":
        try:
            na, nb = float(a), float(b)
        except (TypeError, ValueError):
            return False
        base = max(abs(na), abs(nb))
        if base == 0:
            return False
        return (abs(na - nb) / base * 100) > rule["tolerance"]
    if mode == "text":
        norm = rule["normalise"] or (lambda x: str(x).lower().strip())
        return norm(a) != norm(b)
    if mode == "identifier":
        return str(a).replace(" ", "").lower() != str(b).replace(" ", "").lower()
    if mode == "boolean":
        return bool(a) != bool(b)
    return False


def _recommended_action(field: str, label: str) -> str:
    actions = {
        "factoryAreaSqFt":    "Verify the declared factory area and resubmit the corrected plan.",
        "factoryAddress":     "Confirm the correct factory address across all submitted documents.",
        "registrationNumber": "Ensure the company registration number is identical on all documents.",
        "hasBoiler":          "Clarify boiler installation status — declaration and plan must agree.",
    }
    return actions.get(field, f"Verify the {label.lower()} across all submitted documents.")


def _predicted_query(field: str, label: str, doc_a: str, doc_b: str, val_a: Any, val_b: Any) -> str:
    doc_a_r = doc_a.replace("-", " ")
    doc_b_r = doc_b.replace("-", " ")
    if field == "factoryAreaSqFt":
        return (
            f"Please clarify the difference in declared factory area between the "
            f"{doc_a_r} ({val_a} sq ft) and the submitted {doc_b_r} ({val_b} sq ft)."
        )
    if field == "factoryAddress":
        return (
            f"Please clarify the discrepancy in factory address between the "
            f'{doc_a_r} ("{val_a}") and the {doc_b_r} ("{val_b}").'
        )
    if field == "registrationNumber":
        return (
            f"Please confirm the company registration number — a mismatch was found "
            f"between the {doc_a_r} and the {doc_b_r}."
        )
    return (
        f"Please clarify the difference in {label.lower()} between the "
        f"{doc_a_r} ({val_a}) and the {doc_b_r} ({val_b})."
    )


# ---------------------------------------------------------------------------
# Main export
# ---------------------------------------------------------------------------

def detect_contradictions(documents: list[dict]) -> list[dict]:
    """Detect contradictions across extracted fields from multiple documents.

    Args:
        documents: list of loaded fixture dicts (each has a ``fields`` dict).

    Returns:
        List of contradiction dicts sorted blocking → warning → informational.
    """
    contradictions: list[dict] = []
    seen: set[str] = set()

    # --- Mismatch detection -------------------------------------------------
    # Collect all (field_name, value, confidence, doc_id) tuples
    entries: dict[str, list[dict]] = {}
    for doc in documents:
        doc_id = doc.get("document_id", "unknown")
        for field_name, field_data in doc.get("fields", {}).items():
            # Skip non-dict entries (e.g. metadata strings accidentally in fields)
            if not isinstance(field_data, dict):
                continue
            entries.setdefault(field_name, []).append({
                "doc_id": doc_id,
                "label": field_name,  # will use field_name as label fallback
                "value": field_data.get("value"),
                "confidence": field_data.get("confidence", 1.0),
            })

    for field_name, field_entries in entries.items():
        rule = _FIELD_RULES.get(field_name)
        if not rule:
            continue
        # Compare every pair; emit first mismatch per field
        for i in range(len(field_entries)):
            for j in range(i + 1, len(field_entries)):
                a = field_entries[i]
                b = field_entries[j]
                if not _values_conflict(rule, a["value"], b["value"]):
                    continue
                cid = f"contradiction-{field_name}"
                if cid in seen:
                    continue
                seen.add(cid)
                contradictions.append({
                    "id": cid,
                    "field": field_name,
                    "label": field_name,
                    "documents": [a["doc_id"], b["doc_id"]],
                    "values": [a["value"], b["value"]],
                    "severity": rule["severity"],
                    "recommended_action": _recommended_action(field_name, field_name),
                    "predicted_query": _predicted_query(
                        field_name, field_name,
                        a["doc_id"], b["doc_id"],
                        a["value"], b["value"],
                    ),
                })

    # --- Low-confidence warnings --------------------------------------------
    for doc in documents:
        doc_id = doc.get("document_id", "unknown")
        for field_name, field_data in doc.get("fields", {}).items():
            if not isinstance(field_data, dict):
                continue
            conf = field_data.get("confidence", 1.0)
            if conf < _LOW_CONFIDENCE_THRESHOLD:
                cid = f"low-confidence-{field_name}-{doc_id}"
                if cid in seen:
                    continue
                seen.add(cid)
                contradictions.append({
                    "id": cid,
                    "field": field_name,
                    "label": field_name,
                    "documents": [doc_id],
                    "values": [field_data.get("value")],
                    "severity": "warning",
                    "recommended_action": (
                        f"Verify the {field_name} in the {doc_id.replace('-', ' ')} "
                        f"— extraction confidence was low ({round(conf * 100)}%)."
                    ),
                    "predicted_query": (
                        f"Please confirm the {field_name} recorded in the "
                        f"{doc_id.replace('-', ' ')}; the submitted copy was difficult to read."
                    ),
                })

    contradictions.sort(key=lambda c: _SEVERITY_ORDER.get(c["severity"], 99))
    return contradictions

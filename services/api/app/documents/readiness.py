"""Readiness score calculator and status deriver.

Weights:
    Documents   35%  found / expected
    Information 25%  present required fields / total
    Consistency 25%  100 - (blocking*25 + warning*10 + info*2), floor 0
    Regulatory  15%  proportional to present required fields

Critical override: any blocking contradiction OR missing mandatory doc
forces status = "blocked" regardless of the numeric score.
"""

from __future__ import annotations

_REQUIRED_FIELDS = [
    "companyName",
    "registrationNumber",
    "factoryAddress",
    "factoryAreaSqFt",
    "employeeCount",
    "investmentCrore",
    "hasBoiler",
]

_W_DOCUMENTS    = 0.35
_W_INFORMATION  = 0.25
_W_CONSISTENCY  = 0.25
_W_REGULATORY   = 0.15


def calculate_readiness(
    documents: list[dict],
    contradictions: list[dict],
    mandatory_required: list[str],
    uploaded: list[str],
) -> dict:
    """Return a ReadinessBreakdown dict and overall score.

    Args:
        documents: loaded fixture dicts.
        contradictions: output of detect_contradictions().
        mandatory_required: doc ids that must be present.
        uploaded: doc ids actually present in the pack.
    """
    # ---- Documents ----------------------------------------------------------
    uploaded_set = {d.strip().lower() for d in uploaded}
    deduped_required = list(dict.fromkeys(mandatory_required))  # preserve order, dedupe
    expected = len(deduped_required)
    found = sum(1 for d in deduped_required if d.strip().lower() in uploaded_set)
    doc_score = round((found / expected * 100)) if expected else 100

    # ---- Information --------------------------------------------------------
    present_fields: set[str] = set()
    for doc in documents:
        present_fields.update(doc.get("fields", {}).keys())
    present_count = sum(1 for f in _REQUIRED_FIELDS if f in present_fields)
    info_score = round(present_count / len(_REQUIRED_FIELDS) * 100) if _REQUIRED_FIELDS else 100

    # ---- Consistency --------------------------------------------------------
    blocking = sum(1 for c in contradictions if c["severity"] == "blocking")
    warning  = sum(1 for c in contradictions if c["severity"] == "warning")
    info_c   = sum(1 for c in contradictions if c["severity"] == "informational")
    consistency_score = max(0, 100 - (blocking * 25 + warning * 10 + info_c * 2))

    # ---- Regulatory ---------------------------------------------------------
    regulatory_score = (
        100 if (blocking == 0 and present_count == len(_REQUIRED_FIELDS))
        else round(present_count / len(_REQUIRED_FIELDS) * 100)
    )

    overall = round(
        _W_DOCUMENTS   * doc_score
        + _W_INFORMATION * info_score
        + _W_CONSISTENCY * consistency_score
        + _W_REGULATORY  * regulatory_score
    )

    return {
        "documents":             doc_score,
        "information":           info_score,
        "consistency":           consistency_score,
        "regulatory_conditions": regulatory_score,
        "overall":               overall,
    }


def derive_status(contradictions: list[dict], missing_mandatory: list[str]) -> str:
    """Derive "blocked" | "needs-review" | "ready".

    Blocking contradiction or any missing mandatory doc → "blocked".
    Warning contradiction → "needs-review".
    Otherwise → "ready".
    """
    if any(c["severity"] == "blocking" for c in contradictions):
        return "blocked"
    if missing_mandatory:
        return "blocked"
    if any(c["severity"] == "warning" for c in contradictions):
        return "needs-review"
    return "ready"

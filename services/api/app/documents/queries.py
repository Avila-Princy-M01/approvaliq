"""Deterministic officer query predictor.

No LLM. Plain if-statements off detected contradictions.
Offline-safe, instant, and every string is reviewable in advance.
Written in the voice of an actual officer — formal and specific.
"""

from __future__ import annotations


def predict_queries(
    contradictions: list[dict],
    missing_docs: list[str],
    low_confidence_fields: list[dict] | None = None,
) -> list[str]:
    """Return a deduplicated list of predicted officer queries.

    Args:
        contradictions: output of detect_contradictions().
        missing_docs: list of mandatory document ids that are absent.
        low_confidence_fields: list of {field, doc_id, confidence} dicts (optional).
    """
    queries: list[str] = []

    # Contradictions (blocking + warning only — not informational)
    for c in contradictions:
        if c["severity"] == "informational":
            continue
        queries.append(c["predicted_query"])

    # Missing mandatory documents
    for doc_id in missing_docs:
        label = doc_id.replace("-", " ")
        queries.append(
            f"Please upload the {label}, which is mandatory for the "
            "approvals applicable to your project."
        )

    # Low-confidence fields
    for entry in low_confidence_fields or []:
        field = entry.get("field", "")
        doc_id = entry.get("doc_id", "")
        conf = entry.get("confidence", 0)
        queries.append(
            f"Please confirm the {field} recorded in the "
            f"{doc_id.replace('-', ' ')}; the submitted copy was difficult "
            f"to read (confidence {round(conf * 100)}%)."
        )

    # Dedupe while preserving order
    seen: set[str] = set()
    result: list[str] = []
    for q in queries:
        if q not in seen:
            seen.add(q)
            result.append(q)
    return result

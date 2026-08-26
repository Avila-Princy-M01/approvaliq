"""Extraction of structured applicability conditions from clause text.

This is intentionally a starting point using simple pattern matching for
common threshold phrasing found in regulatory text (e.g. area, headcount,
investment thresholds). Extend the pattern set as real source documents
surface additional phrasing patterns during ingestion.
"""

from __future__ import annotations

import re

from .schema import ApplicabilityCondition

_AREA_PATTERN = re.compile(
    r"(built[- ]up area|plot area)\s*(exceeding|greater than|more than|over)\s*(\d+(?:\.\d+)?)\s*(sq\.?\s?m|square met(?:er|re)s?)",
    re.IGNORECASE,
)

_EMPLOYEE_PATTERN = re.compile(
    r"(employ(?:ing|s)?|workers?|employees?)\s*(exceeding|greater than|more than|over)\s*(\d+)",
    re.IGNORECASE,
)


def extract_conditions(clause_text: str) -> list[ApplicabilityCondition]:
    """Best-effort extraction of structured conditions from clause text.

    Returns an empty list if no recognizable threshold pattern is found —
    callers should not assume every clause yields a condition; many
    clauses are unconditional obligations rather than threshold-gated ones.
    """
    conditions: list[ApplicabilityCondition] = []

    area_match = _AREA_PATTERN.search(clause_text)
    if area_match:
        conditions.append(
            ApplicabilityCondition(
                field="scale.built_up_area_sq_m",
                operator="gt",
                value=float(area_match.group(3)),
            )
        )

    employee_match = _EMPLOYEE_PATTERN.search(clause_text)
    if employee_match:
        conditions.append(
            ApplicabilityCondition(
                field="scale.employee_count",
                operator="gt",
                value=int(employee_match.group(3)),
            )
        )

    return conditions

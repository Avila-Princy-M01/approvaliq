"""Candidate retrieval: embedding similarity combined with structured
applicability-condition filtering.

Similarity alone can surface plausible-but-incorrect matches; structured
conditions alone miss nuance captured only in free text. Combining both
is the retrieval strategy this service relies on.
"""

from __future__ import annotations

import operator
from typing import Any

import numpy as np

from .schema import ApplicantProfile

_OPS = {
    "eq": operator.eq,
    "neq": operator.ne,
    "gt": operator.gt,
    "gte": operator.ge,
    "lt": operator.lt,
    "lte": operator.le,
    "in": lambda a, b: a in b,
}

_SIMILARITY_THRESHOLD = 0.35
_TOP_K = 15


def _resolve_field(profile: ApplicantProfile, dotted_field: str) -> Any:
    value: Any = profile.model_dump()
    for part in dotted_field.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def _conditions_satisfied(profile: ApplicantProfile, conditions: list[dict]) -> bool:
    """A requirement with no conditions is treated as unconditionally applicable
    (subject to semantic relevance). A requirement with conditions must have
    ALL of them satisfied against the applicant profile.
    """
    for condition in conditions:
        actual = _resolve_field(profile, condition["field"])
        if actual is None:
            # Missing data: cannot confirm the condition holds. Treated as not
            # satisfied rather than assumed true, to avoid false positives.
            return False
        op_fn = _OPS[condition["operator"]]
        if not op_fn(actual, condition["value"]):
            return False
    return True


def retrieve_candidates(
    profile: ApplicantProfile,
    requirements: list[dict],
    profile_embedding: np.ndarray,
) -> list[dict]:
    """Return requirements that are structurally applicable.

    Explicit applicability conditions are sufficient for seeded/demo
    requirements. Unconditional requirements still use semantic similarity.
    """
    eligible = [
        r
        for r in requirements
        if _conditions_satisfied(
            profile,
            r.get("applicability_conditions", []),
        )
    ]

    if not eligible:
        return []

    scored: list[tuple[float, dict]] = []

    for requirement in eligible:
        conditions = requirement.get("applicability_conditions", [])
        embedding = requirement.get("embedding")

        # Structured applicability is already explicit and deterministic.
        if conditions:
            scored.append((1.0, requirement))
            continue

        # Unconditional requirements still require semantic relevance.
        if not embedding:
            continue

        similarity = _cosine_similarity(
            profile_embedding,
            np.array(embedding),
        )

        if similarity >= _SIMILARITY_THRESHOLD:
            scored.append((similarity, requirement))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [requirement for _, requirement in scored[:_TOP_K]]


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

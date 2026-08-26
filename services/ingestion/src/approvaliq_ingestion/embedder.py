"""Embedding generation for structured requirements."""

from __future__ import annotations

from functools import lru_cache

from .schema import RegulatoryRequirement

_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(_MODEL_NAME)


def embed_requirements(
    requirements: list[RegulatoryRequirement],
) -> list[RegulatoryRequirement]:
    """Populate the `embedding` field on each requirement in place and return them."""
    if not requirements:
        return requirements

    model = _get_model()
    texts = [r.clause_text for r in requirements]
    vectors = model.encode(texts, show_progress_bar=False)

    for requirement, vector in zip(requirements, vectors):
        requirement.embedding = vector.tolist()

    return requirements

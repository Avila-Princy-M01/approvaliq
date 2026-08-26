"""Data models for structured regulatory requirements.

These models define the contract produced by the ingestion pipeline and
consumed by the matching service. Any change here must be reflected in
docs/API.md at the repository root.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

Operator = Literal["eq", "neq", "gt", "gte", "lt", "lte", "in"]


class ApplicabilityCondition(BaseModel):
    """A single structured condition under which a requirement applies.

    Example: {"field": "scale.built_up_area_sq_m", "operator": "gt", "value": 500}
    """

    field: str
    operator: Operator
    value: Any


class RegulatoryRequirement(BaseModel):
    """A single, individually citable unit extracted from a source document."""

    id: str = Field(..., description="Stable identifier, unique across the corpus.")
    source_document: str = Field(..., description="Human-readable name of the source document.")
    source_citation: str = Field(
        ..., description="Precise reference within the source document, e.g. 'Clause 4.2(b)'."
    )
    department: str
    clause_text: str = Field(..., description="The extracted, unmodified clause text.")
    applicability_conditions: list[ApplicabilityCondition] = Field(default_factory=list)
    embedding: list[float] | None = Field(
        default=None, description="Populated after embedding generation."
    )

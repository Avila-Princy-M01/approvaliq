"""Segments extracted text blocks into individually citable requirement units."""

from __future__ import annotations

from .conditions import extract_conditions
from .extractor import ExtractedBlock
from .schema import RegulatoryRequirement


def segment(
    blocks: list[ExtractedBlock],
    *,
    source_document: str,
    department: str,
    id_prefix: str,
) -> list[RegulatoryRequirement]:
    """Convert extracted blocks into RegulatoryRequirement units.

    Each block at depth >= 1 (i.e. a numbered clause or sub-clause) becomes
    its own requirement, with a citation derived from its numbering prefix.
    Blocks at depth 0 (unnumbered prose, headers) are skipped — they carry
    no independently citable obligation.
    """
    requirements: list[RegulatoryRequirement] = []
    counter = 0

    for block in blocks:
        if block.depth < 1:
            continue

        counter += 1
        citation_prefix = block.text.split(" ", 1)[0].rstrip(".")
        requirements.append(
            RegulatoryRequirement(
                id=f"{id_prefix}-{counter:04d}",
                source_document=source_document,
                source_citation=f"Clause {citation_prefix}",
                department=department,
                clause_text=block.text,
                applicability_conditions=extract_conditions(block.text),
            )
        )

    return requirements

"""Layout-aware text extraction from source documents.

Preserves clause / sub-clause structure so downstream segmentation can
operate on real document hierarchy rather than a flattened text blob.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF


@dataclass
class ExtractedBlock:
    """A single text block with its approximate structural depth.

    `depth` is a heuristic based on indentation/numbering pattern and is
    refined further during segmentation.
    """

    text: str
    page_number: int
    depth: int


def extract_blocks(pdf_path: Path) -> list[ExtractedBlock]:
    """Extract text blocks from a PDF, preserving page and layout order.

    Raises:
        FileNotFoundError: if pdf_path does not exist.
    """
    if not pdf_path.exists():
        raise FileNotFoundError(f"Source document not found: {pdf_path}")

    blocks: list[ExtractedBlock] = []
    with fitz.open(pdf_path) as doc:
        for page_number, page in enumerate(doc, start=1):
            for block in page.get_text("blocks"):
                text = block[4].strip()
                if not text:
                    continue
                depth = _estimate_depth(text)
                blocks.append(ExtractedBlock(text=text, page_number=page_number, depth=depth))
    return blocks


def _estimate_depth(text: str) -> int:
    """Rough structural depth estimate based on leading numbering pattern.

    E.g. "4." -> depth 1, "4.2" -> depth 2, "4.2(b)" -> depth 3.
    This is intentionally simple; refine per document family as real
    source documents are ingested and edge cases are discovered.
    """
    stripped = text.strip()
    if not stripped:
        return 0
    prefix = stripped.split(" ", 1)[0]
    depth = prefix.count(".") + prefix.count("(")
    return max(depth, 1) if prefix[0].isdigit() else 0

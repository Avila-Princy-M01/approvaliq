"""Command-line entry point for the ingestion pipeline."""

from __future__ import annotations

import json
from pathlib import Path

import click

from .embedder import embed_requirements
from .extractor import extract_blocks
from .segmenter import segment


@click.group()
def cli() -> None:
    """ApprovalIQ ingestion pipeline."""


@cli.command()
@click.option(
    "--source-dir",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    required=True,
    help="Directory containing source PDF documents. See data/sources/README.md for expected layout.",
)
@click.option(
    "--out",
    type=click.Path(path_type=Path),
    required=True,
    help="Output path for the generated requirements JSON file.",
)
@click.option(
    "--department",
    default="Unspecified",
    help="Department label applied to requirements from this source directory.",
)
def ingest(source_dir: Path, out: Path, department: str) -> None:
    """Run the full ingestion pipeline over all PDFs in --source-dir."""
    all_requirements = []

    pdf_paths = sorted(source_dir.glob("*.pdf"))
    if not pdf_paths:
        click.echo(f"No PDF files found in {source_dir}. Nothing to ingest.")
        return

    for pdf_path in pdf_paths:
        click.echo(f"Extracting: {pdf_path.name}")
        blocks = extract_blocks(pdf_path)
        requirements = segment(
            blocks,
            source_document=pdf_path.stem,
            department=department,
            id_prefix=pdf_path.stem.upper().replace(" ", "-")[:12],
        )
        click.echo(f"  -> {len(requirements)} requirement(s) segmented")
        all_requirements.extend(requirements)

    click.echo("Generating embeddings...")
    all_requirements = embed_requirements(all_requirements)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps([r.model_dump() for r in all_requirements], indent=2),
        encoding="utf-8",
    )
    click.echo(f"Wrote {len(all_requirements)} requirement(s) to {out}")


if __name__ == "__main__":
    cli()

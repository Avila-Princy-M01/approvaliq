# Ingestion Service

Parses regulatory source documents into structured, individually citable
`RegulatoryRequirement` objects and generates vector embeddings for
semantic retrieval by the matching service.

## Responsibilities

- Layout-aware text extraction from source documents (preserving
  clause / sub-clause structure).
- Segmentation into individually addressable requirement units, each
  with a stable ID and traceable source citation.
- Extraction of explicit applicability conditions where stated in the
  source text (e.g. scale or category thresholds).
- Embedding generation and indexing.

## Usage

```bash
pip install -r requirements.txt -r requirements-dev.txt
python -m approvaliq_ingestion.cli ingest \
  --source-dir ../../data/sources \
  --out ../../data/seed/requirements.json
```

## Layout

```
src/approvaliq_ingestion/
├── cli.py            # Command-line entry point
├── extractor.py       # Text extraction with layout awareness
├── segmenter.py        # Clause segmentation into requirement units
├── conditions.py         # Applicability condition extraction
├── embedder.py             # Embedding generation
└── schema.py                # RegulatoryRequirement data model
```

## Testing

```bash
pytest -q
```

Tests should include at least one fixture with a cross-referenced clause
and one with an exception embedded in a sub-clause — these are the
extraction cases most likely to silently fail on real regulatory text.

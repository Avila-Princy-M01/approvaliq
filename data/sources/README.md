# Source Documents

This directory holds the raw regulatory source documents (PDFs) that
`services/ingestion` parses into structured requirements.

**This directory's contents are gitignored.** Regulatory source documents
are typically public government publications, but are kept out of version
control here as a matter of repository hygiene — file size, licensing
terms that vary by jurisdiction, and the fact that source documents are
an input artifact, not project source code. Only this README is tracked.

## Expected layout

```
data/sources/
├── mpcb_consent_to_establish.pdf
├── fire_noc.pdf
├── factory_license.pdf
├── shops_and_establishment.pdf
└── electricity_connection_noa.pdf
```

Each PDF's filename (without extension) is used as the `source_document`
label and ID prefix for requirements extracted from it — see
`services/ingestion/src/approvaliq_ingestion/cli.py`.

## Adding a new source document

1. Place the PDF in this directory.
2. Run the ingestion CLI (see `services/ingestion/README.md`).
3. Spot-check a sample of the output against the source PDF — in
   particular, confirm that clauses with cross-references or embedded
   exceptions were segmented correctly. Layout-based extraction is a
   heuristic, not a guarantee, and real regulatory text has enough
   structural variation that manual review of new sources is expected,
   not optional.
4. Record where the document was obtained (publishing authority, date,
   version/edition) somewhere durable — e.g. a `SOURCES.md` in this
   directory once real documents are added — so provenance is traceable.

## Why this matters

Every claim ApprovalIQ makes to an applicant is expected to be traceable
back to a specific clause in a specific source document. That guarantee
is only as strong as the discipline applied here: know exactly which
document, which version, and which authority every ingested requirement
came from.

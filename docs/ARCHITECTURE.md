# Architecture

## Overview

ApprovalIQ is composed of three backend services and one frontend
application, designed to be independently developed, tested, and deployed.

| Service | Responsibility |
|---|---|
| `services/ingestion` | Parses regulatory source documents into structured, citable requirement objects and generates vector embeddings for semantic retrieval. |
| `services/matching` | Given an applicant profile, retrieves and confirms applicable requirements via a retrieval-constrained reasoning layer, producing citation-grounded checklist items. |
| `services/api` | Public-facing API. Owns document pre-validation, verified-data reuse, risk scoring, and audit logging. Orchestrates calls to the matching service. |
| `frontend` | Applicant-facing and reviewer-facing interfaces. |

## Data flow

1. **Ingestion (offline / batch process)**
   Raw regulatory documents in `data/sources/` are parsed by
   `services/ingestion`, which:
   - Extracts text with layout awareness (preserving clause/sub-clause
     structure rather than flattening it).
   - Segments text into individually addressable `RegulatoryRequirement`
     units, each with a stable identifier and source citation.
   - Tags explicit applicability conditions where the source text
     specifies them (e.g. scale or category thresholds).
   - Generates a vector embedding per requirement and stores it in the
     vector index alongside structured metadata.

2. **Matching (request time)**
   Given an `ApplicantProfile`, `services/matching`:
   - Retrieves candidate requirements via a combination of embedding
     similarity and structured condition filtering.
   - Passes the candidate set to a retrieval-constrained reasoning layer
     that confirms applicability and produces a short justification,
     strictly grounded in the retrieved text.
   - Returns structured `ChecklistItem` objects. The reasoning layer never
     generates a requirement that was not present in the retrieved set —
     if retrieval returns nothing relevant, the system reports that
     explicitly rather than fabricating a plausible-sounding requirement.

3. **API / orchestration (request time)**
   `services/api`:
   - Exposes endpoints consumed by the frontend.
   - Runs document pre-validation against the relevant requirement's
     expected fields.
   - Applies verified-data reuse: previously confirmed applicant fields
     are carried forward on subsequent applications.
   - Computes an explainable risk score from scale, sector, and
     completeness signals.
   - Writes an audit log entry for every checklist generation, validation
     run, and status change.

4. **Frontend (presentation)**
   - Applicant view: profile input, generated checklist with citation
     drill-down, document upload and pre-validation feedback.
   - Reviewer view: application queue with risk indicators.

## Design principles

- **Every applicant-facing claim must be traceable to a source document.**
  The reasoning layer is retrieval-constrained by design, not by
  convention — its output schema only permits referencing requirement IDs
  that were actually retrieved.
- **Structured conditions over similarity alone.** Applicability is
  determined by combining explicit structured conditions (extracted
  during ingestion) with semantic retrieval, rather than relying on
  embedding similarity alone, which can surface plausible-but-incorrect
  matches.
- **Explainability over opacity.** Risk scores and validation failures
  must be attributable to specific, statable reasons — never a bare
  numeric output with no justification.
- **Services fail independently and visibly.** If the matching service
  cannot retrieve a confident match, the API surfaces that state clearly
  rather than silently degrading.

## Scope boundaries

The current implementation targets a defined, real slice of the overall
problem: a fixed set of approval types across a single sector and
jurisdiction, using genuinely parsed source documents. Cross-department
workflow coordination and system-wide analytics are represented in the
architecture but currently operate against fixture/mock data pending
integration with external departmental systems — this boundary is
explicit and should remain so as the system evolves; see
`data/seed/README.md` for what is fixture data versus what is derived
from real source parsing.

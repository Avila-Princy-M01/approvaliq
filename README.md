# ApprovalIQ

**A regulatory knowledge engine for industrial approvals and compliance.**

ApprovalIQ ingests regulatory source documents (licenses, NOCs, permits, and
related statutory text), structures them into individually addressable,
citable requirements, and generates applicant-specific, citation-grounded
approval checklists via a retrieval-constrained reasoning layer. It also
provides document pre-validation, verified-data reuse across applications,
and risk-aware review tooling for reviewing authorities.

The goal is to reduce the friction, ambiguity, and repeated manual scrutiny
involved in navigating multi-department regulatory approval processes,
without weakening statutory safeguards.

---

## Why this exists

Entrepreneurs and industrial units frequently need to obtain multiple
registrations, licenses, NOCs, inspections, and renewals from different
regulatory authorities. Requirements vary by sector, location, project
scale, and operational stage, and are often difficult to discover,
interpret, and track. Reviewing authorities, in turn, face incomplete
applications, repetitive manual scrutiny, and limited visibility into
where the process is breaking down.

ApprovalIQ addresses this with:

- A **regulatory knowledge engine** that parses real source documents into
  structured, citable requirements rather than static keyword rules.
- An **applicability matching + retrieval-constrained reasoning layer**
  that determines which requirements apply to a specific applicant and
  explains *why*, grounded in the source text — never freely generated.
- **Document pre-validation** that catches incomplete or inconsistent
  submissions before they reach a reviewing authority.
- **Verified-data reuse**, so previously confirmed information doesn't
  need to be resubmitted on subsequent applications.
- A **risk-aware review dashboard** with explainable prioritization for
  reviewing authorities.

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system
design. At a high level:

```
                     ┌─────────────────────┐
  regulatory docs →  │  Ingestion Service    │  → structured, embedded
                     │  (services/ingestion) │    requirements
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌─────────────────────┐
 applicant profile → │  Matching Service     │  → citation-grounded
                     │  (services/matching)  │    checklist items
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  API Service          │ ← used by
                     │  (services/api)       │   frontend
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Frontend             │
                     │  (frontend/)          │
                     └─────────────────────┘
```

Each service is independently runnable and independently testable. They
communicate over well-defined internal contracts documented in
[`docs/API.md`](docs/API.md).

---

## Repository layout

```
.
├── services/
│   ├── ingestion/     # Document parsing, clause segmentation, embeddings
│   ├── matching/       # Applicability matching + retrieval-constrained reasoning
│   └── api/            # Public-facing FastAPI application
├── frontend/            # Applicant and reviewer-facing UI
├── data/
│   ├── sources/         # Raw source regulatory documents (see data/sources/README.md)
│   └── seed/            # Seed / fixture data for local development
├── scripts/              # Setup and maintenance scripts
├── docs/                 # Architecture, API, and development documentation
└── .github/workflows/    # CI pipelines
```

---

## Getting started

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for full local setup
instructions. Quick start with Docker:

```bash
cp .env.example .env
# edit .env and set your LLM provider API key

docker compose up --build
```

This brings up the API, matching service, database, and frontend together.
The frontend will be available at `http://localhost:8501` (or the port
configured in `.env`), and the API at `http://localhost:8000`.

---

## Documentation

| Document | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, and design rationale |
| [`docs/API.md`](docs/API.md) | API contract and internal service interfaces |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Local setup, environment configuration, testing |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution guidelines and code standards |

---

## License

Distributed under the terms of the [MIT License](LICENSE).

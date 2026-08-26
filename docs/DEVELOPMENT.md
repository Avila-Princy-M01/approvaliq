# Development Guide

## Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for running services outside Docker)
- Node.js 20+ (only if the frontend is configured to use the React setup —
  see `frontend/README.md`)
- An API key for one supported LLM provider (see `.env.example`)

## Local setup (Docker — recommended)

```bash
git clone <repository-url>
cd approvaliq
cp .env.example .env
```

Edit `.env` and set:
- `LLM_PROVIDER` (`gemini`, `groq`, `anthropic`, or `openai`)
- `LLM_API_KEY`
- `DATABASE_URL` (defaults are fine for local development)

Then:

```bash
docker compose up --build
```

This starts:
- `db` — PostgreSQL with `pgvector` enabled
- `api` — the FastAPI application (`http://localhost:8000`)
- `matching` — the matching/reasoning service
- `frontend` — the applicant/reviewer UI (`http://localhost:8501`)

Seed the database with local fixture data:

```bash
docker compose exec api python /app/scripts/seed_demo_data.py
```

## Local setup (without Docker)

Each service has its own virtual environment and dependencies. Example
for `services/api`:

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload
```

Repeat the same pattern for `services/ingestion` and `services/matching`.

## Running ingestion locally

```bash
cd services/ingestion
python -m approvaliq_ingestion.cli ingest --source-dir ../../data/sources --out ../../data/seed/requirements.json
```

See `data/sources/README.md` for expected source document format and
`services/ingestion/README.md` for pipeline details.

## Running tests

Each service is tested independently:

```bash
cd services/api && pytest
cd services/matching && pytest
cd services/ingestion && pytest
```

Or via the root Makefile, which runs all service test suites:

```bash
make test
```

## Linting and formatting

This project uses `ruff` for linting and `black` for formatting Python
code, enforced in CI.

```bash
make lint
make format
```

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | Yes | One of `gemini`, `groq`, `anthropic`, `openai` |
| `LLM_API_KEY` | Yes | API key for the selected provider |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `VECTOR_INDEX_BACKEND` | No | `pgvector` (default) or `faiss` |
| `API_PORT` | No | Defaults to `8000` |
| `FRONTEND_PORT` | No | Defaults to `8501` |
| `LOG_LEVEL` | No | Defaults to `INFO` |

Never commit a populated `.env` file. `.env` is gitignored; only
`.env.example` (with placeholder values) is tracked.

## Working across services

Each service under `services/` is independently runnable and has its own
`README.md`, dependency file, and test suite. When changing a shared data
contract (`ApplicantProfile`, `RegulatoryRequirement`, `ChecklistItem`),
update `docs/API.md` in the same change and confirm consumers of that
contract (see the data flow diagram in `docs/ARCHITECTURE.md`) are
updated accordingly.

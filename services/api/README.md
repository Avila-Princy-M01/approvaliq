# API Service

The public-facing FastAPI application. Orchestrates calls to the matching
service and owns document pre-validation, verified-data reuse, risk
scoring, and audit logging.

See [`docs/API.md`](../../docs/API.md) at the repository root for the full
endpoint contract.

## Layout

```
app/
├── main.py                # FastAPI app instantiation
├── config.py                # Environment configuration
├── models.py                   # SQLAlchemy models (audit log, applicants, etc.)
├── database.py                    # DB session management
└── routers/
    ├── checklist.py                # /api/v1/checklist
    ├── validation.py                 # /api/v1/validate
    ├── reuse.py                        # /api/v1/applicants/{id}/reused-fields
    ├── review_queue.py                   # /api/v1/review-queue (risk scoring)
    └── audit.py                            # /api/v1/audit/{id}
```

## Running locally

```bash
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload
```

## Testing

```bash
pytest -q
```

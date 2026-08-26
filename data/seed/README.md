# Seed / Fixture Data

This directory holds local development fixtures — data used to run the
system without needing to re-run ingestion or manually create test
applicants every time.

**Generated files in this directory are gitignored** (see root
`.gitignore`); only this README is tracked. Run `scripts/seed_demo_data.py`
(or `make seed`) to (re)generate them locally.

## What's real vs. fixture

It matters to keep this distinction explicit and not let it blur over
time:

| File | Nature |
|---|---|
| `requirements.json` | Output of the real ingestion pipeline run against actual source documents in `data/sources/`. This is real, derived data — not fabricated. |
| `sample_applicants.json` | Fixture applicant profiles used for local development, demos, and manual testing. Representative, not real applicant data. |
| `mock_department_status.json` | Fixture data standing in for a cross-department coordination integration that does not yet exist. Anything built against this file should be clearly documented as operating against mock data — see `docs/ARCHITECTURE.md`, "Scope boundaries." |

## Regenerating

```bash
python scripts/seed_demo_data.py
```

Or, if running via Docker Compose:

```bash
make seed
```

The script is idempotent — running it multiple times will not duplicate
records.

"""Seeds local development/demo data.

Idempotent: safe to run multiple times without duplicating records.

Populates:
- data/seed/requirements.json — only if it doesn't already exist (this
  file is expected to come from a real ingestion run; this script will
  NOT overwrite real ingestion output with fixtures, and will only write
  a minimal fixture set if no requirements file is present yet, so local
  development isn't blocked before real source documents are ingested).
- data/seed/sample_applicants.json — fixture applicant profiles.
- data/seed/mock_department_status.json — fixture cross-department status
  data, explicitly for the mocked coordination view.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "seed"

_FIXTURE_REQUIREMENTS = [
    {
        "id": "MPCB-0001",
        "source_document": "mpcb_consent_to_establish",
        "source_citation": "Clause 3.1",
        "department": "Maharashtra Pollution Control Board",
        "clause_text": (
            "3.1 Every unit engaged in a scheduled industrial process shall "
            "obtain Consent to Establish prior to commencement of construction."
        ),
        "applicability_conditions": [],
        "embedding": None,
    },
    {
        "id": "FIRE-0001",
        "source_document": "fire_noc",
        "source_citation": "Clause 4.2",
        "department": "Fire Department",
        "clause_text": (
            "4.2 Units with a built-up area exceeding 500 sq. m. shall obtain "
            "a No Objection Certificate from the Fire Department prior to "
            "occupancy."
        ),
        "applicability_conditions": [
            {"field": "scale.built_up_area_sq_m", "operator": "gt", "value": 500}
        ],
        "embedding": None,
    },
    {
        "id": "FACT-0001",
        "source_document": "factory_license",
        "source_citation": "Clause 6.1",
        "department": "Directorate of Industrial Safety and Health",
        "clause_text": (
            "6.1 Establishments employing more than 10 workers with power or "
            "20 workers without power shall register under the Factories Act."
        ),
        "applicability_conditions": [
            {"field": "scale.employee_count", "operator": "gt", "value": 10}
        ],
        "embedding": None,
    },
]

_FIXTURE_APPLICANTS = [
    {
        "sector": "food_processing",
        "sub_sector": "packaged_snacks",
        "location": {"state": "Maharashtra", "district": "Pune"},
        "scale": {"built_up_area_sq_m": 650, "employee_count": 25, "investment_inr": 5000000},
        "stage": "new_setup",
    },
    {
        "sector": "textiles",
        "sub_sector": "weaving",
        "location": {"state": "Maharashtra", "district": "Nashik"},
        "scale": {"built_up_area_sq_m": 300, "employee_count": 8, "investment_inr": 1500000},
        "stage": "expansion",
    },
]

_FIXTURE_DEPARTMENT_STATUS = [
    {
        "applicant_index": 0,
        "department": "Maharashtra Pollution Control Board",
        "status": "under_review",
    },
    {
        "applicant_index": 0,
        "department": "Fire Department",
        "status": "approved",
    },
]


def _write_if_absent(path: Path, data) -> None:
    if path.exists():
        print(f"Skipping {path.name} (already exists).")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {path.name}.")


def _write_always(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {path.name}.")


def main() -> None:
    # Requirements: only write a fixture set if real ingestion output
    # doesn't already exist, so this script never clobbers real data.
    _write_if_absent(DATA_DIR / "requirements.json", _FIXTURE_REQUIREMENTS)

    # Applicants and mock department status are always fixtures — safe to
    # regenerate deterministically every run.
    _write_always(DATA_DIR / "sample_applicants.json", _FIXTURE_APPLICANTS)
    _write_always(DATA_DIR / "mock_department_status.json", _FIXTURE_DEPARTMENT_STATUS)

    print("Seed complete.")


if __name__ == "__main__":
    main()

"""Checklist generation and retrieval endpoints."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Applicant, AuditEvent, ChecklistRecord

router = APIRouter(prefix="/api/v1", tags=["checklist"])


def _to_matching_profile(profile: dict) -> dict:
    """Convert flat or nested applicant profile to the matching schema."""

    location = profile.get("location") or {}
    scale = profile.get("scale") or {}

    return {
        "sector": profile.get("sector"),
        "sub_sector": profile.get("sub_sector"),
        "location": {
            "state": location.get(
                "state",
                profile.get("state", "Maharashtra"),
            ),
            "district": location.get(
                "district",
                profile.get("district"),
            ),
        },
        "scale": {
            "built_up_area_sq_m": scale.get(
                "built_up_area_sq_m",
                profile.get(
                    "built_up_area_sq_m",
                    profile.get("built_up_area"),
                ),
            ),
            "employee_count": scale.get(
                "employee_count",
                profile.get("employee_count"),
            ),
            "investment_inr": scale.get(
                "investment_inr",
                profile.get("investment_inr"),
            ),
        },
        "stage": profile.get("stage"),
    }


@router.post("/checklist")
def generate_checklist(profile: dict, db: Session = Depends(get_db)) -> dict:
    """Generate a citation-grounded checklist for the given applicant profile."""
    settings = get_settings()

    matching_profile = _to_matching_profile(profile)

    applicant = Applicant(profile=matching_profile)
    db.add(applicant)
    db.flush()

    try:
        response = httpx.post(
            f"{settings.matching_service_url}/match",
            json=matching_profile,
            timeout=30.0,
        )
        response.raise_for_status()
        checklist = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Matching service unavailable: {exc}",
        ) from exc

    db.add(ChecklistRecord(applicant_id=applicant.id, checklist=checklist))
    db.add(
        AuditEvent(
            applicant_id=applicant.id,
            event_type="checklist_generated",
            detail={"item_count": len(checklist)},
        )
    )
    db.commit()

    return {"applicant_id": applicant.id, "checklist": checklist}


@router.get("/checklist/{applicant_id}")
def get_checklist(applicant_id: str, db: Session = Depends(get_db)) -> dict:
    record = (
        db.query(ChecklistRecord)
        .filter(ChecklistRecord.applicant_id == applicant_id)
        .order_by(ChecklistRecord.created_at.desc())
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=404,
            detail="No checklist found for this applicant.",
        )
    return {"applicant_id": applicant_id, "checklist": record.checklist}

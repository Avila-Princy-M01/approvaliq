"""Reviewer-facing application queue with explainable risk scoring."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Applicant, ChecklistRecord

router = APIRouter(prefix="/api/v1", tags=["review_queue"])

_HAZARDOUS_SECTORS = {"chemicals", "pharmaceuticals", "food_processing", "textiles_dyeing"}
_LARGE_SCALE_AREA_SQ_M = 1000


def _score_risk(profile: dict, completeness_pct: float) -> tuple[str, list[str]]:
    """Returns (risk_flag, reasons). Every input to the score is stated
    explicitly in `reasons` so the score is defensible on request, never a
    bare number with no justification."""
    reasons: list[str] = []
    score = 0

    if profile.get("sector") in _HAZARDOUS_SECTORS:
        score += 2
        reasons.append(f"Sector '{profile.get('sector')}' is classified as higher-hazard.")

    area = (profile.get("scale") or {}).get("built_up_area_sq_m")
    if area and area >= _LARGE_SCALE_AREA_SQ_M:
        score += 1
        reasons.append(f"Built-up area ({area} sq. m.) exceeds the large-scale threshold.")

    if completeness_pct < 100:
        score += 1
        reasons.append(f"Application is only {completeness_pct:.0f}% complete.")

    if score >= 3:
        return "high", reasons
    if score >= 1:
        return "medium", reasons
    return "low", reasons or ["No elevated risk factors identified."]


@router.get("/review-queue")
def get_review_queue(db: Session = Depends(get_db)) -> dict:
    applicants = db.query(Applicant).all()
    applications = []

    for applicant in applicants:
        record = (
            db.query(ChecklistRecord)
            .filter(ChecklistRecord.applicant_id == applicant.id)
            .order_by(ChecklistRecord.created_at.desc())
            .first()
        )
        checklist = record.checklist if record else []
        verified_count = sum(1 for item in checklist if item.get("status") == "verified")
        completeness_pct = (verified_count / len(checklist) * 100) if checklist else 0.0

        risk_flag, reasons = _score_risk(applicant.profile, completeness_pct)

        applications.append(
            {
                "applicant_id": applicant.id,
                "sector": applicant.profile.get("sector"),
                "risk_flag": risk_flag,
                "risk_reasons": reasons,
                "completeness_pct": round(completeness_pct, 1),
            }
        )

    return {"applications": applications}

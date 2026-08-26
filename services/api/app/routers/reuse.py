"""Verified-data reuse endpoint.

Determines which fields on a new application can be carried forward from
a previously verified application by the same applicant, and records why,
so the reuse is explainable rather than an opaque cache hit.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Applicant

router = APIRouter(prefix="/api/v1", tags=["reuse"])

# Fields eligible for reuse once verified once. Kept explicit rather than
# reusing everything, since some fields (e.g. project-specific scale) are
# expected to change between applications even for the same applicant.
_REUSABLE_FIELDS = ["sector", "sub_sector", "location"]


@router.get("/applicants/{applicant_id}/reused-fields")
def get_reused_fields(applicant_id: str, db: Session = Depends(get_db)) -> dict:
    current = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if current is None:
        return {"reused_fields": []}

    # Find a prior applicant record with matching identity signals.
    # A real implementation would match on a verified applicant/business
    # identifier rather than profile similarity; this is a placeholder
    # for that lookup.
    prior_candidates = (
        db.query(Applicant)
        .filter(Applicant.id != applicant_id)
        .order_by(Applicant.created_at.desc())
        .all()
    )

    reused = []
    for prior in prior_candidates:
        for field in _REUSABLE_FIELDS:
            if current.profile.get(field) and current.profile.get(field) == prior.profile.get(
                field
            ):
                reused.append(
                    {
                        "field": field,
                        "source_applicant_id": prior.id,
                        "verified_at": prior.created_at.isoformat(),
                    }
                )
        if reused:
            break

    return {"reused_fields": reused}

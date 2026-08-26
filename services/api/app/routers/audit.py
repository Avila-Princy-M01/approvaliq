"""Audit trail endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditEvent

router = APIRouter(prefix="/api/v1", tags=["audit"])


@router.get("/audit/{applicant_id}")
def get_audit_trail(applicant_id: str, db: Session = Depends(get_db)) -> dict:
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.applicant_id == applicant_id)
        .order_by(AuditEvent.timestamp.asc())
        .all()
    )
    return {
        "events": [
            {
                "timestamp": event.timestamp.isoformat(),
                "event_type": event.event_type,
                "detail": event.detail,
            }
            for event in events
        ]
    }

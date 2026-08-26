"""SQLAlchemy models for persisted application state."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


class Applicant(Base):
    __tablename__ = "applicants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    profile: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )


class ChecklistRecord(Base):
    __tablename__ = "checklist_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    applicant_id: Mapped[str] = mapped_column(String, index=True)
    checklist: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    applicant_id: Mapped[str] = mapped_column(String, index=True)
    event_type: Mapped[str] = mapped_column(String)
    detail: Mapped[dict] = mapped_column(JSON)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
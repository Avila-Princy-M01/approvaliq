"""Data models for the matching service. Mirrors docs/API.md — keep in sync."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Location(BaseModel):
    state: str
    district: str


class Scale(BaseModel):
    built_up_area_sq_m: float | None = None
    employee_count: int | None = None
    investment_inr: float | None = None


class ApplicantProfile(BaseModel):
    sector: str
    sub_sector: str | None = None
    location: Location
    scale: Scale
    stage: Literal["new_setup", "renewal", "expansion"]


class Citation(BaseModel):
    source_document: str
    clause_reference: str


class ChecklistItem(BaseModel):
    requirement_id: str
    title: str
    department: str
    justification: str
    citation: Citation
    status: Literal["missing", "submitted", "verified"] = "missing"
    risk_flag: Literal["low", "medium", "high"] | None = None

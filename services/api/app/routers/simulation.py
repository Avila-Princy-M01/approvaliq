"""Simulation engine: aggregates matching results into a 
summary with timeline, fees, risk, and dependency chain.
Supports change-diff when called with before/after profiles."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Applicant, AuditEvent

router = APIRouter(prefix="/api/v1", tags=["simulation"])


class SimulationSummary(BaseModel):
    total_approvals: int
    total_documents: int
    statutory_days: int  # critical path, NOT sum of all
    indicative_fee_inr: float
    risk_tier: str  # "low" | "medium" | "high"
    bottleneck: str | None  # approval name with longest path
    approvals: list[dict]  # each with name, dept, days, fee, risk, docs


class SimulationDiff(BaseModel):
    added_approvals: list[str]
    removed_approvals: list[str]
    added_documents: list[str]
    days_change: int
    fee_change: float
    risk_change: dict  # {"from": "medium", "to": "high"}
    explanation: str


class SimulateRequest(BaseModel):
    profile: dict  # ApplicantProfile shape


def _aggregate_checklist(checklist: list[dict]) -> dict:
    """Turn a flat checklist into a simulation summary.

    Key rule: statutory_days = critical path, NOT sum.
    For the demo, approximate critical path as:
    max(days) + sum of non-parallelizable legs.
    """
    if not checklist:
        return {
            "total_approvals": 0,
            "total_documents": 0,
            "statutory_days": 0,
            "indicative_fee_inr": 0.0,
            "risk_tier": "low",
            "bottleneck": None,
            "approvals": [],
        }

    total_docs = 0
    total_fee = 0.0
    max_days = 0
    bottleneck_name = None
    risk_scores = {"low": 0, "medium": 1, "high": 2}
    highest_risk = "low"
    approvals = []

    for item in checklist:
        days = item.get("statutory_days") if item.get("statutory_days") is not None else 14
        fee = float(item.get("indicative_fee_inr") or 0.0)
        risk = item.get("risk_flag") or "low"
        required_docs = item.get("required_documents") or []
        docs = len(required_docs)

        total_docs += docs
        total_fee += fee

        if days > max_days:
            max_days = days
            bottleneck_name = item.get("title", "Unknown")

        if risk_scores.get(risk, 0) > risk_scores.get(highest_risk, 0):
            highest_risk = risk

        approvals.append({
            "id": item.get("requirement_id"),
            "name": item.get("title"),
            "department": item.get("department"),
            "statutory_days": days,
            "indicative_fee_inr": fee,
            "risk_flag": risk,
            "required_documents": required_docs,
            "justification": item.get("justification", ""),
            "citation": item.get("citation", {}),
        })

    # Critical path approximation:
    # In reality this needs a DAG. For demo, use max + 30% of remaining.
    # This is honest: "estimated critical path" not "exact timeline."
    parallelizable = sum(
        a["statutory_days"] for a in approvals
        if a["statutory_days"] < max_days
    )
    statutory_days = max_days + int(parallelizable * 0.3)

    return {
        "total_approvals": len(approvals),
        "total_documents": total_docs,
        "statutory_days": statutory_days,
        "indicative_fee_inr": total_fee,
        "risk_tier": highest_risk,
        "bottleneck": bottleneck_name,
        "approvals": approvals,
    }


def _compute_diff(
    before: dict,
    after: dict,
) -> dict:
    """Compare two simulation summaries and explain what changed."""
    before_ids = {a["id"] for a in before.get("approvals", []) if a.get("id")}
    after_ids = {a["id"] for a in after.get("approvals", []) if a.get("id")}

    added = [
        a["name"] for a in after.get("approvals", [])
        if a.get("id") not in before_ids and a.get("name")
    ]
    removed = [
        a["name"] for a in before.get("approvals", [])
        if a.get("id") not in after_ids and a.get("name")
    ]

    before_doc_set = set()
    for a in before.get("approvals", []):
        for d in a.get("required_documents", []):
            before_doc_set.add(d)

    after_doc_set = set()
    for a in after.get("approvals", []):
        for d in a.get("required_documents", []):
            after_doc_set.add(d)

    added_docs = sorted(list(after_doc_set - before_doc_set))

    days_change = after.get("statutory_days", 0) - before.get("statutory_days", 0)
    fee_change = float(after.get("indicative_fee_inr", 0) - before.get("indicative_fee_inr", 0))

    risk_from = before.get("risk_tier", "low")
    risk_to = after.get("risk_tier", "low")

    # Build explanation
    parts = []
    if added:
        parts.append(f"Added {len(added)} approval(s): {', '.join(added)}")
    if removed:
        parts.append(f"Removed {len(removed)} approval(s): {', '.join(removed)}")
    if days_change > 0:
        parts.append(f"Timeline increased by {days_change} days")
    elif days_change < 0:
        parts.append(f"Timeline decreased by {abs(days_change)} days")
    if risk_from != risk_to:
        parts.append(f"Risk changed from {risk_from} to {risk_to}")

    return {
        "added_approvals": added,
        "removed_approvals": removed,
        "added_documents": added_docs,
        "days_change": days_change,
        "fee_change": fee_change,
        "risk_change": {"from": risk_from, "to": risk_to},
        "explanation": ". ".join(parts) if parts else "No changes detected.",
    }


@router.post("/simulate")
def simulate(payload: SimulateRequest, db: Session = Depends(get_db)) -> dict:
    """Run a simulation for the given profile.
    Returns aggregated summary with timeline, fees, risk, bottleneck."""
    settings = get_settings()
    profile = payload.profile

    # Store applicant
    applicant = Applicant(profile=profile)
    db.add(applicant)
    db.flush()

    # Call matching service
    try:
        response = httpx.post(
            f"{settings.matching_service_url}/match",
            json=profile,
            timeout=30.0,
        )
        response.raise_for_status()
        checklist = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Matching service unavailable: {exc}",
        ) from exc

    summary = _aggregate_checklist(checklist)

    # Audit
    db.add(
        AuditEvent(
            applicant_id=applicant.id,
            event_type="simulation_run",
            detail={"approval_count": summary["total_approvals"]},
        )
    )
    db.commit()

    return {
        "applicant_id": applicant.id,
        "summary": summary,
        "engine_version": "demo-2026.08",
    }


@router.post("/simulate/diff")
def simulate_diff(
    before: SimulateRequest,
    after: SimulateRequest,
) -> dict:
    """Compare two profiles and show what changes.
    This is the 'change impact' feature for the demo."""
    settings = get_settings()

    # Run both through matching
    try:
        resp_before = httpx.post(
            f"{settings.matching_service_url}/match",
            json=before.profile,
            timeout=30.0,
        )
        resp_after = httpx.post(
            f"{settings.matching_service_url}/match",
            json=after.profile,
            timeout=30.0,
        )
        resp_before.raise_for_status()
        resp_after.raise_for_status()
        checklist_before = resp_before.json()
        checklist_after = resp_after.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Matching service unavailable: {exc}",
        ) from exc

    summary_before = _aggregate_checklist(checklist_before)
    summary_after = _aggregate_checklist(checklist_after)
    diff = _compute_diff(summary_before, summary_after)

    return {
        "before": summary_before,
        "after": summary_after,
        "diff": diff,
    }

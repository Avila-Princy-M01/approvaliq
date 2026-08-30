"""Internal matching service entry point. Called by services/api; not
intended to be exposed publicly."""

from __future__ import annotations

import numpy as np
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer

from .reasoner import confirm_applicability
from .retriever import retrieve_candidates
from .schema import ApplicantProfile, ChecklistItem

app = FastAPI(title="ApprovalIQ Matching Service", version="0.1.0")

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _load_requirements() -> list[dict]:
    import json
    from pathlib import Path

    path = Path("/app/data/seed/requirements.json")
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/match", response_model=list[ChecklistItem])
def match(profile: ApplicantProfile) -> list[ChecklistItem]:
    requirements = _load_requirements()
    if not requirements:
        return []

    profile_text = (
        f"{profile.sector} {profile.sub_sector or ''} {profile.stage} "
        f"{profile.location.state} {profile.location.district} "
        f"{profile.scale.built_up_area_sq_m or ''} "
        f"{profile.scale.employee_count or ''}"
    )

    model = _get_model()
    profile_embedding = np.array(model.encode(profile_text))

    # Demo/seed requirements have no persisted embeddings.
    # Generate them from clause text so the demo can run without ingestion.
    for requirement in requirements:
        if not requirement.get("embedding"):
            clause_text = requirement.get("clause_text", "")
            requirement["embedding"] = np.array(model.encode(clause_text)).tolist()

    candidates = retrieve_candidates(
        profile,
        requirements,
        profile_embedding,
    )

    return confirm_applicability(profile, candidates)

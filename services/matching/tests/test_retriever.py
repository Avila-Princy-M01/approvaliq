import numpy as np

from approvaliq_matching.retriever import retrieve_candidates
from approvaliq_matching.schema import ApplicantProfile, Location, Scale


def _profile(**scale_kwargs) -> ApplicantProfile:
    return ApplicantProfile(
        sector="food_processing",
        location=Location(state="Maharashtra", district="Pune"),
        scale=Scale(**scale_kwargs),
        stage="new_setup",
    )


def _requirement(req_id: str, conditions: list[dict], embedding: list[float]) -> dict:
    return {
        "id": req_id,
        "source_document": "Doc",
        "source_citation": "Clause 1",
        "department": "Test Dept",
        "clause_text": "Some obligation.",
        "applicability_conditions": conditions,
        "embedding": embedding,
    }


def test_excludes_requirement_when_condition_not_met():
    profile = _profile(built_up_area_sq_m=100)
    requirements = [
        _requirement(
            "R1",
            [{"field": "scale.built_up_area_sq_m", "operator": "gt", "value": 500}],
            [1.0, 0.0],
        )
    ]
    result = retrieve_candidates(profile, requirements, np.array([1.0, 0.0]))
    assert result == []


def test_includes_requirement_when_condition_met_and_similar():
    profile = _profile(built_up_area_sq_m=600)
    requirements = [
        _requirement(
            "R1",
            [{"field": "scale.built_up_area_sq_m", "operator": "gt", "value": 500}],
            [1.0, 0.0],
        )
    ]
    result = retrieve_candidates(profile, requirements, np.array([1.0, 0.0]))
    assert len(result) == 1
    assert result[0]["id"] == "R1"


def test_missing_field_treated_as_condition_not_satisfied():
    profile = _profile()  # built_up_area_sq_m is None
    requirements = [
        _requirement(
            "R1",
            [{"field": "scale.built_up_area_sq_m", "operator": "gt", "value": 500}],
            [1.0, 0.0],
        )
    ]
    result = retrieve_candidates(profile, requirements, np.array([1.0, 0.0]))
    assert result == []


def test_low_similarity_excluded_even_if_conditions_met():
    profile = _profile(built_up_area_sq_m=600)
    requirements = [_requirement("R1", [], [0.0, 1.0])]  # orthogonal vector -> similarity 0
    result = retrieve_candidates(profile, requirements, np.array([1.0, 0.0]))
    assert result == []

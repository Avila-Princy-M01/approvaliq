from unittest.mock import patch

from approvaliq_matching.reasoner import confirm_applicability
from approvaliq_matching.schema import ApplicantProfile, Location, Scale

_PROFILE = ApplicantProfile(
    sector="food_processing",
    location=Location(state="Maharashtra", district="Pune"),
    scale=Scale(),
    stage="new_setup",
)

_CANDIDATES = [
    {
        "id": "R1",
        "source_document": "Doc A",
        "source_citation": "Clause 4.1",
        "department": "Fire",
        "clause_text": "Obligation text.",
    }
]


def test_no_candidates_returns_empty_list():
    assert confirm_applicability(_PROFILE, []) == []


def test_confirmed_item_maps_to_checklist_item():
    mock_response = [
        {"requirement_id": "R1", "applies": True, "justification": "Applies because X."}
    ]
    with patch("approvaliq_matching.reasoner.generate_structured", return_value=mock_response):
        result = confirm_applicability(_PROFILE, _CANDIDATES)
    assert len(result) == 1
    assert result[0].requirement_id == "R1"
    assert result[0].citation.source_document == "Doc A"


def test_model_referencing_unknown_id_is_dropped():
    mock_response = [
        {"requirement_id": "NOT-A-REAL-ID", "applies": True, "justification": "Fabricated."}
    ]
    with patch("approvaliq_matching.reasoner.generate_structured", return_value=mock_response):
        result = confirm_applicability(_PROFILE, _CANDIDATES)
    assert result == []


def test_applies_false_is_excluded():
    mock_response = [{"requirement_id": "R1", "applies": False, "justification": "Does not apply."}]
    with patch("approvaliq_matching.reasoner.generate_structured", return_value=mock_response):
        result = confirm_applicability(_PROFILE, _CANDIDATES)
    assert result == []


def test_llm_error_fails_closed_to_empty_list():
    from approvaliq_matching.llm_client import LLMError

    with patch("approvaliq_matching.reasoner.generate_structured", side_effect=LLMError("boom")):
        result = confirm_applicability(_PROFILE, _CANDIDATES)
    assert result == []

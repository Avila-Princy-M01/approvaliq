from app.routers.review_queue import _score_risk


def test_low_risk_for_non_hazardous_small_complete_application():
    flag, reasons = _score_risk(
        {"sector": "textiles", "scale": {"built_up_area_sq_m": 100}},
        completeness_pct=100,
    )
    assert flag == "low"
    assert reasons


def test_high_risk_for_hazardous_large_incomplete_application():
    flag, reasons = _score_risk(
        {"sector": "chemicals", "scale": {"built_up_area_sq_m": 2000}},
        completeness_pct=40,
    )
    assert flag == "high"
    assert len(reasons) == 3


def test_medium_risk_for_single_factor():
    flag, _reasons = _score_risk(
        {"sector": "food_processing", "scale": {"built_up_area_sq_m": 50}},
        completeness_pct=100,
    )
    assert flag == "medium"


def test_reasons_always_explain_the_score():
    _, reasons = _score_risk({"sector": "textiles", "scale": {}}, completeness_pct=100)
    assert all(isinstance(r, str) and r for r in reasons)

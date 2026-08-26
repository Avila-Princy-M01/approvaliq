from approvaliq_ingestion.conditions import extract_conditions


def test_extracts_area_threshold():
    text = "4.2 This clause applies where the built-up area exceeding 500 sq. m."
    conditions = extract_conditions(text)
    assert len(conditions) == 1
    assert conditions[0].field == "scale.built_up_area_sq_m"
    assert conditions[0].operator == "gt"
    assert conditions[0].value == 500.0


def test_extracts_employee_threshold():
    text = "5.1 Applicable to units employing more than 50 workers."
    conditions = extract_conditions(text)
    assert len(conditions) == 1
    assert conditions[0].field == "scale.employee_count"
    assert conditions[0].value == 50


def test_no_condition_found_returns_empty_list():
    text = "6.1 The applicant shall maintain a register of incidents."
    conditions = extract_conditions(text)
    assert conditions == []

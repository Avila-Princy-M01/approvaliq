import base64

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_validate_rejects_empty_document():
    response = client.post(
        "/api/v1/validate",
        json={"requirement_id": "R1", "document": {"filename": "a.pdf", "content_base64": ""}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert "document_content" in body["missing_fields"]


def test_validate_rejects_undecodable_content():
    response = client.post(
        "/api/v1/validate",
        json={
            "requirement_id": "R1",
            "document": {"filename": "a.pdf", "content_base64": "not-valid-base64!!"},
        },
    )
    assert response.status_code == 200
    assert response.json()["valid"] is False


def test_validate_accepts_well_formed_document():
    content = base64.b64encode(b"dummy pdf bytes").decode()
    response = client.post(
        "/api/v1/validate",
        json={"requirement_id": "R1", "document": {"filename": "a.pdf", "content_base64": content}},
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True

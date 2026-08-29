"""Tests for /api/v1/validate and /api/v1/dry-run endpoints.

Covers:
- Original 3 tests (kept, now meaningful)
- Bug fix #1: _EXPECTED_FIELDS was empty → valid always True
- Bug fix #2: missing check was against outer payload, not document["fields"]
- Dry-run: demo-mismatch → blocked, demo-corrected → ready
- Contradiction detector: area mismatch detected, Pvt Ltd vs Private Limited NOT flagged
- Readiness: demo-mismatch < 90, demo-corrected >= 90
- Predicted queries: blocking contradiction produces a query
"""

from __future__ import annotations

import base64

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _b64(content: bytes = b"dummy pdf bytes") -> str:
    return base64.b64encode(content).decode()


# ---------------------------------------------------------------------------
# /api/v1/validate — structural checks
# ---------------------------------------------------------------------------

class TestValidateStructural:
    def test_rejects_empty_document(self):
        resp = client.post(
            "/api/v1/validate",
            json={"requirement_id": "factory-license",
                  "document": {"filename": "a.pdf", "content_base64": ""}},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["valid"] is False
        assert "document_content" in body["missing_fields"]

    def test_rejects_undecodable_content(self):
        resp = client.post(
            "/api/v1/validate",
            json={"requirement_id": "factory-license",
                  "document": {"filename": "a.pdf", "content_base64": "not-valid-base64!!"}},
        )
        assert resp.status_code == 200
        assert resp.json()["valid"] is False

    def test_accepts_document_with_all_expected_fields(self):
        """Bug fix #1 + #2: _EXPECTED_FIELDS populated; checks document['fields'] not payload."""
        resp = client.post(
            "/api/v1/validate",
            json={
                "requirement_id": "factory-license",
                "document": {
                    "filename": "factory.pdf",
                    "content_base64": _b64(),
                    "fields": {
                        "companyName": "XYZ Foods Pvt Ltd",
                        "registrationNumber": "U15400PN2024PTC012345",
                        "factoryAddress": "Plot 14, Pune",
                        "factoryAreaSqFt": 7500,
                        "employeeCount": 80,
                        "hasBoiler": True,
                    },
                },
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["valid"] is True
        assert body["missing_fields"] == []

    def test_reports_missing_fields_from_document_not_payload(self):
        """Bug fix #2: missing check must look at document['fields'], not outer payload keys."""
        resp = client.post(
            "/api/v1/validate",
            json={
                "requirement_id": "factory-license",
                # Outer payload has lots of keys — should NOT count as 'fields present'
                "companyName": "spoofed",
                "factoryAreaSqFt": 9999,
                "document": {
                    "filename": "empty.pdf",
                    "content_base64": _b64(),
                    "fields": {},   # empty — all expected fields missing
                },
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["valid"] is False
        assert len(body["missing_fields"]) > 0
        # Should report fields from _EXPECTED_FIELDS["factory-license"], not 0
        assert "companyName" in body["missing_fields"]
        assert "factoryAreaSqFt" in body["missing_fields"]

    def test_unknown_requirement_id_has_no_expected_fields(self):
        """Unknown requirement_id → expected_fields=[] → valid=True (no fields to check)."""
        resp = client.post(
            "/api/v1/validate",
            json={
                "requirement_id": "nonexistent-requirement",
                "document": {"filename": "a.pdf", "content_base64": _b64(), "fields": {}},
            },
        )
        assert resp.status_code == 200
        assert resp.json()["valid"] is True


# ---------------------------------------------------------------------------
# /api/v1/dry-run — demo-mismatch
# ---------------------------------------------------------------------------

class TestDryRunMismatch:
    def test_returns_200(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        assert resp.status_code == 200

    def test_status_is_blocked(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        body = resp.json()
        assert body["status"] == "blocked", f"Expected blocked, got: {body['status']}"

    def test_readiness_score_below_90(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        score = resp.json()["readiness_score"]
        assert score < 90, f"Expected score < 90 for mismatch pack, got {score}"

    def test_area_contradiction_detected(self):
        """factoryAreaSqFt: 7500 vs 6800 → blocking contradiction."""
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        contradictions = resp.json()["contradictions"]
        area_contras = [c for c in contradictions if c["field"] == "factoryAreaSqFt"]
        assert len(area_contras) >= 1, "Expected factoryAreaSqFt contradiction"
        assert area_contras[0]["severity"] == "blocking"

    def test_area_contradiction_values_are_7500_and_6800(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        contradictions = resp.json()["contradictions"]
        area_contras = [c for c in contradictions if c["field"] == "factoryAreaSqFt"]
        values = set(area_contras[0]["values"])
        assert 7500 in values and 6800 in values

    def test_boiler_certificate_missing(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        missing = resp.json()["missing_documents"]
        assert "boiler-certificate" in missing

    def test_predicted_queries_non_empty(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        queries = resp.json()["predicted_queries"]
        assert len(queries) > 0

    def test_blocking_contradiction_generates_query(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        body = resp.json()
        # At least one query should mention factory area
        queries_text = " ".join(body["predicted_queries"]).lower()
        assert "factory area" in queries_text or "factoryareasqft" in queries_text.replace(" ", "")

    def test_extraction_mode_is_fixture(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        assert resp.json()["extraction_mode"] == "fixture"

    def test_pvt_ltd_vs_private_limited_not_blocking(self):
        """Pvt Ltd vs Private Limited is informational — normalisation must handle it."""
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        contradictions = resp.json()["contradictions"]
        name_contras = [c for c in contradictions if c["field"] == "companyName"]
        # Either not present, or if present must be informational (never blocking/warning)
        for c in name_contras:
            assert c["severity"] == "informational", (
                f"companyName mismatch should be informational, got {c['severity']}"
            )

    def test_extracted_fields_present_with_confidence(self):
        """Surfaces full extracted field list with confidence and verified flags."""
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        body = resp.json()
        assert "extracted_fields" in body
        fields = body["extracted_fields"]
        assert len(fields) > 0
        for f in fields:
            assert "field" in f
            assert "value" in f
            assert "confidence" in f
            assert 0.0 <= f["confidence"] <= 1.0
            assert "source_document" in f
            assert "verified" in f

    def test_low_confidence_field_identified(self):
        """Low-confidence field (confidence < 0.8) is present in extracted_fields."""
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"})
        fields = resp.json()["extracted_fields"]
        low_conf = [f for f in fields if f["confidence"] < 0.80]
        assert len(low_conf) >= 1
        assert any(f["field"] == "factoryAddress" for f in low_conf)


# ---------------------------------------------------------------------------
# /api/v1/dry-run — demo-corrected (the 76% → 98% moment)
# ---------------------------------------------------------------------------

class TestDryRunCorrected:
    def test_returns_200(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-corrected"})
        assert resp.status_code == 200

    def test_status_is_ready_or_needs_review(self):
        """After fix: status must NOT be blocked."""
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-corrected"})
        body = resp.json()
        assert body["status"] in ("ready", "needs-review"), (
            f"Expected ready or needs-review, got: {body['status']}"
        )

    def test_readiness_score_above_90(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-corrected"})
        score = resp.json()["readiness_score"]
        assert score >= 90, f"Expected score >= 90 for corrected pack, got {score}"

    def test_no_blocking_contradictions(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-corrected"})
        contradictions = resp.json()["contradictions"]
        blocking = [c for c in contradictions if c["severity"] == "blocking"]
        assert blocking == [], f"Expected no blocking contradictions, got: {blocking}"

    def test_no_missing_mandatory_documents(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "demo-corrected"})
        missing = resp.json()["missing_documents"]
        assert missing == [], f"Expected no missing docs, got: {missing}"

    def test_readiness_higher_than_mismatch(self):
        """The 76% → 98% demo beat must hold."""
        mismatch = client.post("/api/v1/dry-run", json={"document_pack": "demo-mismatch"}).json()
        corrected = client.post("/api/v1/dry-run", json={"document_pack": "demo-corrected"}).json()
        assert corrected["readiness_score"] > mismatch["readiness_score"], (
            f"Corrected ({corrected['readiness_score']}) must beat mismatch "
            f"({mismatch['readiness_score']})"
        )


# ---------------------------------------------------------------------------
# /api/v1/dry-run — error handling
# ---------------------------------------------------------------------------

class TestDryRunErrors:
    def test_unknown_pack_returns_error(self):
        resp = client.post("/api/v1/dry-run", json={"document_pack": "nonexistent-pack"})
        assert resp.status_code == 200
        body = resp.json()
        assert "error" in body

    def test_defaults_to_demo_mismatch_when_pack_omitted(self):
        resp = client.post("/api/v1/dry-run", json={})
        assert resp.status_code == 200
        body = resp.json()
        assert "status" in body
        assert body["document_pack"] == "demo-mismatch"

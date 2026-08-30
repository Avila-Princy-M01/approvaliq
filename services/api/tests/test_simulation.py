"""Tests for the simulation engine."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.routers.simulation import _aggregate_checklist, _compute_diff

client = TestClient(app)


def override_get_db():
    mock_db = MagicMock()
    yield mock_db


app.dependency_overrides[get_db] = override_get_db


class TestAggregate:
    def test_empty_checklist(self):
        result = _aggregate_checklist([])
        assert result["total_approvals"] == 0
        assert result["statutory_days"] == 0

    def test_single_approval(self):
        checklist = [
            {
                "requirement_id": "R1",
                "title": "Fire NOC",
                "department": "Fire Dept",
                "statutory_days": 10,
                "indicative_fee_inr": 5000,
                "risk_flag": "low",
                "required_documents": ["fire-plan"],
                "justification": "Required",
                "citation": {"source_document": "Fire Act", "clause_reference": "Sec 3"},
            }
        ]
        result = _aggregate_checklist(checklist)
        assert result["total_approvals"] == 1
        assert result["statutory_days"] >= 10
        assert result["indicative_fee_inr"] == 5000
        assert result["bottleneck"] == "Fire NOC"

    def test_critical_path_not_sum(self):
        """Two 10-day approvals in parallel should NOT be 20 days."""
        checklist = [
            {
                "requirement_id": f"R{i}",
                "title": f"Approval {i}",
                "department": "Dept",
                "statutory_days": 10,
                "indicative_fee_inr": 1000,
                "risk_flag": "low",
                "required_documents": [],
                "justification": "",
                "citation": {},
            }
            for i in range(3)
        ]
        result = _aggregate_checklist(checklist)
        # Should be ~10 + 30% of remaining = 10 + 6 = 16, NOT 30
        assert result["statutory_days"] < 20

    def test_risk_escalation(self):
        checklist = [
            {
                "requirement_id": "R1",
                "title": "Low risk",
                "department": "Dept",
                "statutory_days": 5,
                "indicative_fee_inr": 1000,
                "risk_flag": "low",
                "required_documents": [],
                "justification": "",
                "citation": {},
            },
            {
                "requirement_id": "R2",
                "title": "High risk",
                "department": "Dept",
                "statutory_days": 20,
                "indicative_fee_inr": 5000,
                "risk_flag": "high",
                "required_documents": ["doc1"],
                "justification": "",
                "citation": {},
            },
        ]
        result = _aggregate_checklist(checklist)
        assert result["risk_tier"] == "high"
        assert result["bottleneck"] == "High risk"


class TestDiff:
    def test_no_change(self):
        summary = {
            "approvals": [{"id": "R1", "name": "Fire NOC"}],
            "statutory_days": 10,
            "indicative_fee_inr": 5000,
            "risk_tier": "low",
        }
        diff = _compute_diff(summary, summary)
        assert diff["added_approvals"] == []
        assert diff["days_change"] == 0

    def test_added_approval(self):
        before = {
            "approvals": [{"id": "R1", "name": "Fire NOC", "required_documents": []}],
            "statutory_days": 10,
            "indicative_fee_inr": 5000,
            "risk_tier": "low",
        }
        after = {
            "approvals": [
                {"id": "R1", "name": "Fire NOC", "required_documents": []},
                {"id": "R2", "name": "MPCB", "required_documents": ["mpcb-doc"]},
            ],
            "statutory_days": 31,
            "indicative_fee_inr": 15000,
            "risk_tier": "medium",
        }
        diff = _compute_diff(before, after)
        assert "MPCB" in diff["added_approvals"]
        assert diff["days_change"] == 21
        assert diff["risk_change"]["from"] == "low"
        assert diff["risk_change"]["to"] == "medium"


class TestSimulateEndpoints:
    @patch("httpx.post")
    def test_simulate_endpoint(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "requirement_id": "R1",
                "title": "Fire NOC",
                "department": "Fire Dept",
                "statutory_days": 14,
                "indicative_fee_inr": 2000,
                "risk_flag": "low",
                "required_documents": ["layout-plan"],
            }
        ]
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        resp = client.post("/api/v1/simulate", json={"profile": {"sector": "food"}})
        assert resp.status_code == 200
        data = resp.json()
        assert "applicant_id" in data
        assert data["engine_version"] == "demo-2026.08"
        assert data["summary"]["total_approvals"] == 1
        assert data["summary"]["indicative_fee_inr"] == 2000

    @patch("httpx.post")
    def test_simulate_diff_endpoint(self, mock_post):
        mock_resp_before = MagicMock()
        mock_resp_before.json.return_value = [
            {
                "requirement_id": "R1",
                "title": "Fire NOC",
                "statutory_days": 10,
                "indicative_fee_inr": 5000,
                "risk_flag": "medium",
                "required_documents": ["plan"],
            }
        ]
        mock_resp_before.raise_for_status = MagicMock()

        mock_resp_after = MagicMock()
        mock_resp_after.json.return_value = [
            {
                "requirement_id": "R1",
                "title": "Fire NOC",
                "statutory_days": 10,
                "indicative_fee_inr": 5000,
                "risk_flag": "medium",
                "required_documents": ["plan"],
            },
            {
                "requirement_id": "R2",
                "title": "MPCB Consent to Establish",
                "statutory_days": 31,
                "indicative_fee_inr": 15000,
                "risk_flag": "high",
                "required_documents": ["mpcb-application-form"],
            },
        ]
        mock_resp_after.raise_for_status = MagicMock()

        mock_post.side_effect = [mock_resp_before, mock_resp_after]

        resp = client.post(
            "/api/v1/simulate/diff",
            json={
                "before": {"profile": {"built_up_area_sq_m": 700}},
                "after": {"profile": {"built_up_area_sq_m": 1000}},
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "diff" in data
        assert "MPCB Consent to Establish" in data["diff"]["added_approvals"]
        assert "mpcb-application-form" in data["diff"]["added_documents"]
        assert data["diff"]["risk_change"] == {"from": "medium", "to": "high"}
        assert "Timeline increased by 24 days" in data["diff"]["explanation"]

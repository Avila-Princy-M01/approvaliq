"""ApprovalIQ frontend — applicant and reviewer interfaces.

Built with Streamlit for fast iteration. See frontend/README.md for the
option of swapping to a React-based UI.
"""

from __future__ import annotations

import os

import requests
import streamlit as st

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")

st.set_page_config(page_title="ApprovalIQ", layout="wide")

st.title("ApprovalIQ")

view = st.sidebar.radio("View", ["Applicant", "Reviewer"])


def _applicant_view() -> None:
    st.header("Generate your approval checklist")

    with st.form("profile_form"):
        col1, col2 = st.columns(2)
        with col1:
            sector = st.text_input("Sector", value="food_processing")
            district = st.text_input("District", value="Pune")
            stage = st.selectbox("Stage", ["new_setup", "renewal", "expansion"])
        with col2:
            built_up_area = st.number_input("Built-up area (sq. m.)", min_value=0.0, value=600.0)
            employee_count = st.number_input("Employee count", min_value=0, value=25)

        submitted = st.form_submit_button("Generate checklist")

    if submitted:
        profile = {
            "sector": sector,
            "location": {"state": "Maharashtra", "district": district},
            "scale": {
                "built_up_area_sq_m": built_up_area,
                "employee_count": employee_count,
            },
            "stage": stage,
        }
        with st.spinner("Generating citation-grounded checklist..."):
            try:
                response = requests.post(f"{API_BASE_URL}/api/v1/checklist", json=profile, timeout=60)
                response.raise_for_status()
                data = response.json()
            except requests.RequestException as exc:
                st.error(f"Could not generate checklist: {exc}")
                return

        st.session_state["applicant_id"] = data["applicant_id"]
        st.session_state["checklist"] = data["checklist"]

    checklist = st.session_state.get("checklist")
    if checklist:
        st.subheader(f"Checklist ({len(checklist)} requirement(s))")
        if not checklist:
            st.info("No requirements matched this profile. Try adjusting the inputs above.")
        for item in checklist:
            with st.expander(f"{item['title']} — {item['department']}"):
                st.write(item["justification"])
                st.caption(
                    f"Source: {item['citation']['source_document']}, "
                    f"{item['citation']['clause_reference']}"
                )
                st.caption(f"Status: {item['status']}")


def _reviewer_view() -> None:
    st.header("Review queue")
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/review-queue", timeout=30)
        response.raise_for_status()
        applications = response.json().get("applications", [])
    except requests.RequestException as exc:
        st.error(f"Could not load review queue: {exc}")
        return

    if not applications:
        st.info("No applications yet.")
        return

    for app_row in applications:
        risk_color = {"low": "🟢", "medium": "🟡", "high": "🔴"}.get(app_row["risk_flag"], "⚪")
        st.write(
            f"{risk_color} **{app_row['applicant_id'][:8]}** — {app_row['sector']} — "
            f"{app_row['completeness_pct']}% complete"
        )
        with st.expander("Risk reasons"):
            for reason in app_row["risk_reasons"]:
                st.write(f"- {reason}")


if view == "Applicant":
    _applicant_view()
else:
    _reviewer_view()

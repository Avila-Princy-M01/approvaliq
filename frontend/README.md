# Frontend

Applicant-facing and reviewer-facing interface for ApprovalIQ.

## Current implementation: Streamlit

`app.py` implements both views (Applicant / Reviewer) as a single Streamlit
app for fast iteration:

```bash
pip install -r requirements.txt
streamlit run app.py
```

Set `API_BASE_URL` if the API is not running on `http://localhost:8000`.

## Views

- **Applicant view** — profile input form, generated checklist with
  per-item citation drill-down (source document + clause reference) and
  status.
- **Reviewer view** — application queue with an explainable risk flag per
  application (backed by `GET /api/v1/review-queue`; see
  `services/api/app/routers/review_queue.py` for the scoring logic).

## Swapping to a React implementation

If a richer UI is needed later, replace this directory's contents with a
standard React app (e.g. Vite-based) that consumes the same
`docs/API.md` contract. No backend changes are required to make that
swap — the API is UI-framework-agnostic by design.

## Notes

- The frontend never computes risk scores, validation results, or
  checklist applicability itself — all of that is server-derived and
  fetched from the API, so the UI can't drift out of sync with the
  backend's logic.
- Loading states are shown for any request that depends on the matching
  service, since checklist generation can take a few seconds.

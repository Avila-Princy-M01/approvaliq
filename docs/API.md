# API Reference

Base URL (local development): `http://localhost:8000`

All request/response bodies are JSON. All endpoints are versioned under
`/api/v1`.

---

## Core data shapes

### `ApplicantProfile`

```json
{
  "sector": "string",
  "sub_sector": "string | null",
  "location": {
    "state": "string",
    "district": "string"
  },
  "scale": {
    "built_up_area_sq_m": "number | null",
    "employee_count": "integer | null",
    "investment_inr": "number | null"
  },
  "stage": "new_setup | renewal | expansion"
}
```

### `RegulatoryRequirement`

```json
{
  "id": "string",
  "source_document": "string",
  "source_citation": "string",
  "department": "string",
  "clause_text": "string",
  "applicability_conditions": [
    { "field": "string", "operator": "string", "value": "any" }
  ]
}
```

### `ChecklistItem`

```json
{
  "requirement_id": "string",
  "title": "string",
  "department": "string",
  "justification": "string",
  "citation": {
    "source_document": "string",
    "clause_reference": "string"
  },
  "status": "missing | submitted | verified",
  "risk_flag": "low | medium | high | null"
}
```

---

## Endpoints

### `POST /api/v1/checklist`
Generates a citation-grounded checklist for a given applicant profile.

**Request body:** `ApplicantProfile`
**Response:** `{ "applicant_id": "string", "checklist": [ChecklistItem, ...] }`

---

### `GET /api/v1/checklist/{applicant_id}`
Retrieves a previously generated checklist.

**Response:** `{ "applicant_id": "string", "checklist": [ChecklistItem, ...] }`

---

### `POST /api/v1/validate`
Validates an uploaded document against a specific requirement's expected
fields.

**Request body:**
```json
{
  "requirement_id": "string",
  "document": { "filename": "string", "content_base64": "string" }
}
```

**Response:**
```json
{
  "valid": "boolean",
  "missing_fields": ["string"],
  "notes": "string"
}
```

---

### `GET /api/v1/applicants/{applicant_id}/reused-fields`
Returns which fields on a new application were carried forward from a
previously verified application, and why.

**Response:**
```json
{
  "reused_fields": [
    { "field": "string", "source_applicant_id": "string", "verified_at": "iso8601" }
  ]
}
```

---

### `GET /api/v1/review-queue`
Returns applications for reviewing-authority use, with risk indicators.

**Response:**
```json
{
  "applications": [
    {
      "applicant_id": "string",
      "sector": "string",
      "risk_flag": "low | medium | high",
      "risk_reasons": ["string"],
      "completeness_pct": "number"
    }
  ]
}
```

---

### `GET /api/v1/audit/{applicant_id}`
Returns the audit trail for a given applicant: every checklist
generation, validation run, and status change, timestamped.

**Response:**
```json
{
  "events": [
    { "timestamp": "iso8601", "event_type": "string", "detail": "object" }
  ]
}
```

---

## Internal service interface: `services/matching`

Not exposed externally; called by `services/api`.

**Input:** `ApplicantProfile`
**Output:** `list[ChecklistItem]`

Contract guarantee: every `ChecklistItem` returned must reference a
`requirement_id` that exists in the ingested requirement set and was part
of the retrieval set passed to the reasoning layer for that request. If no
requirements are found to apply, an empty list is returned rather than a
fabricated item.

## Error handling conventions

All endpoints return errors in the shape:

```json
{ "error": { "code": "string", "message": "string" } }
```

`4xx` codes indicate client/input errors (e.g. malformed profile).
`5xx` codes indicate upstream failures (e.g. matching service
unavailable) and should never be silently swallowed by the frontend.

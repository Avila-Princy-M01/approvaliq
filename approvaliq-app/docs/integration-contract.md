# MAITRI Integration Contract — `/api/maitri/applications`

`POST /api/maitri/applications` is a **demo mock** of a handoff to Maharashtra's MAITRI single-window system. It accepts a fully-validated application package (applicant details, the list of applicable approvals with their required documents and legal clause ids, readiness score, risk summary, and the audit trail captured in ApprovalIQ) and returns an explicit acknowledgement that the package was prepared for handoff. Every field in the request body is validated — all failures are collected and returned together as field-level errors — so the endpoint behaves as a real contract surface even though it transmits nothing. Crucially, the response is unambiguous about being a prototype: `integrationMode: "demo-mock"` and a `note` stating that no data is transmitted to any government system. The payload's `externalApplicationId` must reference a real application known to the officer queue (validated via `getOfficerDetail`), so the mock never fabricates a handoff for an unknown application.

## Request

```json
{
  "externalApplicationId": "A10293",
  "applicant": {
    "companyName": "Marathwada Steel Castings",
    "registrationNumber": "U27100PN2018PTC012345",
    "district": "Solapur"
  },
  "approvals": [
    {
      "approvalId": "factory-license",
      "department": "Directorate of Industrial Safety and Health",
      "requiredDocuments": ["factory-plan", "company-registration", "worker-details", "fire-noc-copy"],
      "clauseIds": ["dgfasli/factories-act-1948/section-2m"]
    }
  ],
  "readinessScore": 62,
  "risk": {
    "submissionRisk": 53,
    "regulatoryScrutiny": "medium"
  },
  "auditTrail": [],
  "engineVersion": "demo-2026.08",
  "ruleSetVersion": "2026.08.1"
}
```

### Field validation rules

| Field | Rule |
|---|---|
| `externalApplicationId` | non-empty string; must reference a real officer-queue application |
| `applicant.companyName` / `registrationNumber` / `district` | each a non-empty string |
| `approvals` | non-empty array; each entry has `approvalId` (string), `department` (string), `requiredDocuments` (array of strings, may be empty), `clauseIds` (array of strings, may be empty) |
| `readinessScore` | number 0–100 inclusive |
| `risk.submissionRisk` | number |
| `risk.regulatoryScrutiny` | one of `"low"` / `"medium"` / `"high"` |
| `auditTrail` | array (contents not validated) |
| `engineVersion` / `ruleSetVersion` | non-empty strings |

## Success response (200)

```json
{
  "accepted": true,
  "integrationMode": "demo-mock",
  "referenceId": "MOCK-2026-123456",
  "message": "Application package prepared for handoff to the existing single-window ecosystem.",
  "note": "This is a prototype mock. No data is transmitted to any government system."
}
```

## Validation failure response (400)

```json
{
  "error": "Invalid payload",
  "fieldErrors": [
    { "field": "applicant.registrationNumber", "error": "must be a non-empty string" },
    { "field": "readinessScore", "error": "must be a number between 0 and 100 inclusive" }
  ]
}
```

## Path to production

If the mock were replaced with a real integration, the validated payload would map almost unchanged: the `demo-mock` response block would be swapped for an authenticated HTTP call to MAITRI's actual submission endpoint, transmitting the same `applicant`, `approvals`, readiness, and risk fields after adding a machine-readable applicant identifier. Retry and timeout handling would be added around the network call so a temporary MAITRI outage surfaces as a failed handoff with a clear error rather than a silent drop, and the audit trail would record the real MAITRI reference id returned by the live system. The contract, validation, and payload shape above are designed to stay stable across that swap so the frontend does not need to change.
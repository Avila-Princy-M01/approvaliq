# Design Document — ApprovalIQ: Chirag's Modules

## Overview

Chirag's modules extend the existing ApprovalIQ platform (Next.js 16.3.3 App Router + Python FastAPI) with eight interconnected subsystems:

1. **Citation Store** — static regulatory evidence layer  
2. **Decision Explanation** — structured rule trace builder  
3. **Risk Engine** — submission risk and regulatory scrutiny scoring  
4. **Application State Store** — in-memory application lifecycle store  
5. **Simulation Engine** — client-side deterministic rules engine  
6. **Officer Dashboard** — prioritised queue at `/officer`  
7. **Application Detail + Decision Workflow** — `/officer/[applicationId]`  
8. **API Routes** — officer queue, decision, audit, demo-handoff  

Plus seed data (G) and home page replacement (H).

**Core philosophy (unchanged from requirements):** _Rules decide → Evidence proves → AI/Explanation narrates → Human decides._ The system never invents citations, never fabricates clause numbers, and never makes final regulatory determinations. Officers retain final authority on every application.

---

## Architecture

### High-Level Component Map

```
Browser (Next.js App Router, React 19)
│
├── app/page.tsx                   ← Home / entry point (H)
│
├── app/officer/
│   ├── page.tsx                   ← Officer queue dashboard (E)
│   └── [applicationId]/page.tsx   ← Application detail + decision (E)
│
├── app/api/
│   ├── dryrun/route.ts            ← EXISTING — document dry-run
│   ├── officer/queue/route.ts     ← GET queue (F)
│   ├── officer/[applicationId]/route.ts   ← GET detail (F)
│   ├── officer/decision/route.ts  ← POST decision (F)
│   ├── officer/audit/[applicationId]/route.ts  ← GET audit (F)
│   └── demo-handoff/route.ts      ← POST demo handoff (F)
│
├── lib/
│   ├── citations/                 ← Citation Store (A)
│   │   ├── citations.ts
│   │   └── index.ts
│   ├── explanation/               ← Decision Explanation (B)
│   │   └── explain.ts
│   ├── risk/                      ← Risk Engine (C)
│   │   └── risk.ts
│   ├── simulation/                ← Rules Engine (I)
│   │   └── simulate.ts
│   ├── store/                     ← Application State (D)
│   │   ├── applicationStore.ts
│   │   └── auditStore.ts
│   └── documents/                 ← EXISTING (unchanged)
│
├── components/
│   ├── ui/                        ← EXISTING shadcn/ui (unchanged)
│   ├── officer/
│   │   ├── QueueTable.tsx
│   │   ├── QueueRow.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── DecisionPanel.tsx
│   │   ├── RiskBreakdown.tsx
│   │   ├── TraceExplainer.tsx
│   │   ├── CitationBadge.tsx
│   │   ├── AuditTimeline.tsx
│   │   └── EmptyQueue.tsx
│   └── shared/
│       └── StatusBadge.tsx
│
├── data/
│   ├── documents/packs/           ← EXISTING
│   └── seed/
│       └── businesses.json        ← NEW (G)
│
└── types/index.ts                 ← EXISTING — DO NOT MODIFY
```

### Data Flow: Demo End-to-End

```
Seed Business Profile
        │
        ▼
lib/simulation/simulate.ts
  → SimulationResult (approvals, traces, summary)
        │
        ├──► lib/explanation/explain.ts
        │      → DecisionTrace[] enriched with citations from Citation Store
        │
        ├──► lib/risk/risk.ts
        │      ├─ computeSubmissionRisk(DocumentRiskSignals) → submissionRisk
        │      └─ computeRegulatoryScrutiny(profile, simulation) → regulatoryScrutiny
        │
        ▼
lib/store/applicationStore.ts
  ApplicationRecord {
    profile, simulationResult, dryRunResult,
    riskAssessment, auditEvents, status, recommendation
  }
        │
        ├──► GET /api/officer/queue   → OfficerQueueItem[]
        ├──► GET /api/officer/[id]    → ApplicationRecord (full)
        ├──► POST /api/officer/decision  → updated status + audit event
        ├──► GET /api/officer/audit/[id] → AuditEvent[]
        └──► POST /api/demo-handoff   → DemoHandoffPackage
```

### Integration with Existing Systems

| Existing Module | How Chirag's Modules Consume It |
|---|---|
| `types/index.ts` | All types imported, never modified |
| `lib/documents/readiness.ts` | `getDocumentRiskSignals(DryRunResult)` feeds `computeSubmissionRisk()` |
| `app/api/dryrun/route.ts` | Called during application seeding to produce `DryRunResult` |
| `services/api` (Python) | Optional — Next.js in-memory audit is primary for demo |
| `data/documents/packs/` | Demo document packs consumed during dry-run |

---

## Components and Interfaces

### A. Citation Store (`lib/citations/`)

#### `citations.ts` — Static Data Store

The citation store is a `Map<string, CitationRecord>` populated at module load time. All entries use `verificationStatus: "needs-review"` because citations are unverified prototypes.

**Clause ID naming convention:** `<authority-slug>/<act-slug>/<section>`

Examples:
- `mah-factories/factories-act-1948/section-2m` — Factories Act, Section 2(m) definition of "factory"
- `mah-factories/factories-act-1948/section-85` — Power to apply Act to certain establishments
- `ibr/indian-boilers-act-1923/section-2` — Boilers Act definition
- `mpcb/water-act-1974/section-25` — Water (Prevention and Control of Pollution) Act consent
- `mpcb/air-act-1981/section-21` — Air Act consent  
- `mpcb/env-protection-act-1986/schedule-1` — Hazardous Waste Rules
- `msme/msme-dev-act-2006/section-7` — MSME classification
- `dgfasli/factories-act-1948/section-6` — Factory licence under Factories Act
- `mah-labour/shops-estab-act-2017/section-7` — Shops and Establishments registration
- `mpcb/hazardous-waste-rules-2016/rule-5` — Hazardous waste authorisation
- `mahares/msme-policy-2023/para-3` — Maharashtra MSME policy
- `fire/maharashtra-fire-rules-2009/rule-4` — Fire NOC

Each `CitationRecord` extends the `Citation` type (from `types/index.ts`) with two additional display fields not in the shared type:

```typescript
// Internal to citations.ts only — NOT exported as a distinct type
// (to avoid touching types/index.ts)
interface CitationRecord extends Citation {
  heading: string;       // Short heading for display: "Definition of Factory"
  relevantText: string;  // The verbatim or paraphrased clause text
  notes: string;         // Internal notes on verification status
}
```

The `getCitation()` function returns the base `Citation` type (per `types/index.ts`).

#### `index.ts` — Public API

```typescript
// lib/citations/index.ts exports:
getCitation(clauseId: string): Citation | null
getClauseText(clauseId: string): string | null   // returns relevantText
getAllClauseIds(): string[]
getUnverifiedClauseIds(): string[]               // verificationStatus === "needs-review"
```

**Safety contract:** `getCitation` wraps the Map lookup in a try/catch and returns `null` on any error. It never throws.

---

### B. Decision Explanation (`lib/explanation/`)

#### `explain.ts`

```typescript
// lib/explanation/explain.ts exports:
buildDecisionTraces(
  profile: BusinessProfile,
  approval: Approval
): DecisionTrace[]
```

`buildDecisionTraces` reads the `traces` already present on the `Approval` object (produced by the simulation engine) and enriches each trace by resolving its `clauseId` through `getCitation()`. This keeps the explanation layer stateless — it is a pure function over an `Approval`.

**Trace enrichment algorithm:**
1. For each trace in `approval.traces`:
   - Call `getCitation(trace.clauseId)`
   - If citation returned → set `trace.citation = citation`
   - If null → set `trace.citation = null`; if this is a decision-time call, emit an audit event `"citation_missing"` (caller's responsibility)
2. Return the enriched `DecisionTrace[]`

**Failure isolation:** If enrichment fails for one trace, the others continue. The function does not throw; partial results are returned.

**Why/Why-not logic:** This lives in the UI components (`TraceExplainer.tsx`), not in `explain.ts`. The function just returns the traces; the component filters by `matched: true` (Why?) or `matched: false` (Why not?).

---

### C. Risk Engine (`lib/risk/`)

#### `risk.ts`

Two exported pure functions:

```typescript
// lib/risk/risk.ts exports:
computeSubmissionRisk(signals: DocumentRiskSignals): RiskAssessment["submissionRisk"]
computeRegulatoryScrutiny(
  profile: BusinessProfile,
  simulation: SimulationResult
): RiskAssessment["regulatoryScrutiny"]
```

**`computeSubmissionRisk` — scoring algorithm:**

| Signal condition | Factor label | Points |
|---|---|---|
| `blockingCount > 0` | `"Blocking contradictions"` | `blockingCount × 20`, max 40 |
| `missingMandatoryCount > 0` | `"Missing mandatory documents"` | `missingMandatoryCount × 15`, max 30 |
| `readinessOverall < 60` | `"Low readiness score"` | `Math.round((60 - readinessOverall) / 2)` |
| `lowConfidenceCount > 0` | `"Low-confidence extractions"` | `lowConfidenceCount × 3`, max 15 |
| No elevated signals | `"No significant risk signals"` | `0` |

Score = sum of all active factor points, clamped to `[0, 100]`.

Level thresholds:
- `score >= 70` → `"high"`
- `score >= 40` → `"medium"`
- `score < 40` → `"low"`

`topIssue` = `reason` of the factor with the highest `points` value, or `null` if only the neutral factor is present.

Each `RiskFactor` uses the `label` and `points` fields from `types/index.ts` (NOT `name`/`impact` — aligned to existing type).

**`computeRegulatoryScrutiny` — factor accumulation:**

| Condition | Factor label |
|---|---|
| `profile.hasBoiler === true` | `"Boiler installation"` |
| `profile.hazardousMaterials === true \|\| profile.generatesHazardousWaste === true` | `"Hazardous process or waste"` |
| `simulation.approvals.filter(a => a.applies).length >= 3` | `"Multiple applicable approvals"` |
| `profile.employees >= 100` | `"Large workforce"` |

Level thresholds (based on factor count):
- `count >= 3` → `"high"`
- `count >= 1` → `"medium"`
- `count === 0` → `"low"`

Scrutiny factors carry no `points` value (they are not scored, only counted). The `RiskFactor.points` field is omitted for scrutiny factors. `reason` fields describe why the factor contributes to process complexity, never implying wrongdoing.

---

### D. Application State Store (`lib/store/`)

This is **in-memory** — no database. State lives in module-level Maps on the Node.js server process. In Next.js App Router, server-side module state persists across requests within a single process (suitable for demo purposes).

#### `applicationStore.ts`

```typescript
// Internal record type (not exported to types/index.ts)
interface ApplicationRecord {
  applicationId: string;
  profile: BusinessProfile;
  simulationResult: SimulationResult;
  dryRunResult: DryRunResult | null;
  riskAssessment: RiskAssessment;
  status: OfficerQueueItem["status"];
  recommendation: string | null;  // advisory only, explicitly labelled
  submittedAt: string;            // ISO 8601
  updatedAt: string;              // ISO 8601
}

// Exported functions:
getApplication(id: string): ApplicationRecord | null
getAllApplications(): ApplicationRecord[]
setApplication(record: ApplicationRecord): void
updateApplicationStatus(
  id: string,
  status: OfficerQueueItem["status"],
  recommendation?: string
): boolean
seedApplications(businesses: BusinessProfile[]): void  // called once at startup
```

The store is initialised lazily on first access. `seedApplications` runs the simulation engine and risk engine for each seed business to populate initial state.

#### `auditStore.ts`

```typescript
// Internal audit record (superset of types/index.ts AuditEvent)
interface AuditRecord {
  id: string;           // uuid-like: `audit-${Date.now()}-${Math.random()}`
  applicationId: string;
  timestamp: string;    // ISO 8601
  actor: string;        // "system" | officer name
  actorType: "system" | "officer";
  action: string;       // "evaluation" | "risk_assessment" | "dry_run" |
                        // "citation_missing" | "viewed" |
                        // "approved" | "rejected" | "clarification_requested" | "overridden"
  reason: string | null;
  details: Record<string, unknown>;
}

// Exported functions:
appendAuditEvent(event: Omit<AuditRecord, "id">): AuditRecord
getAuditTrail(applicationId: string): AuditRecord[]   // sorted ascending by timestamp
```

The audit store is a `Map<string, AuditRecord[]>` (applicationId → events array). Events are only ever pushed, never mutated or removed.

---

### E. Simulation Engine (`lib/simulation/`)

#### `simulate.ts`

```typescript
// lib/simulation/simulate.ts exports:
simulate(profile: BusinessProfile): SimulationResult
```

This is a **pure, deterministic, synchronous** function — no LLM, no network calls, no randomness.

**Rules evaluated (with clause IDs):**

| Rule ID | Approval Name | Condition | Clause ID |
|---|---|---|---|
| `factories-act-licence` | Factories Act Licence | `employees >= 10 && usesPower` OR `employees >= 20` | `dgfasli/factories-act-1948/section-6` |
| `boiler-certificate` | Boiler Registration Certificate | `hasBoiler === true` | `ibr/indian-boilers-act-1923/section-2` |
| `mpcb-consent-water` | MPCB Consent to Establish (Water) | `hazardousMaterials \|\| generatesHazardousWaste` | `mpcb/water-act-1974/section-25` |
| `mpcb-consent-air` | MPCB Consent to Establish (Air) | `hazardousMaterials \|\| generatesHazardousWaste` | `mpcb/air-act-1981/section-21` |
| `hazardous-waste-auth` | Hazardous Waste Authorisation | `generatesHazardousWaste === true` | `mpcb/hazardous-waste-rules-2016/rule-5` |
| `msme-registration` | MSME Registration (Udyam) | `investmentCrore <= 250` (manufacturing) | `msme/msme-dev-act-2006/section-7` |
| `shops-estab-registration` | Shops & Establishments Registration | `employees >= 1` | `mah-labour/shops-estab-act-2017/section-7` |
| `fire-noc` | Fire NOC | `areaSqFt >= 500` | `fire/maharashtra-fire-rules-2009/rule-4` |

For each approval, `buildDecisionTraces` produces one `DecisionTrace` per rule condition checked. The trace records `applicantValue` (the actual profile field value), `expectedCondition` (human-readable rule text), and `matched`.

`SimulationResult` fields:
- `engineVersion: "1.0.0"` (constant for demo)
- `ruleSetVersion: "mah-2024-v1"` (constant for demo)
- `generatedAt`: current ISO timestamp

Summary computation:
- `criticalPathDays`: maximum `statutoryDays` among applicable approvals on the critical path (sequential dependencies)
- `indicativeFeeTotal`: sum of `indicativeFee` for applicable approvals
- `bottleneckApprovalId`: approval with highest `statutoryDays`

---

### F. API Routes (`app/api/`)

#### `GET /api/officer/queue`

Returns `OfficerQueueItem[]` sorted by priority rules.

**Priority sort order (stable, descending priority):**
1. Status: `"pending"` > `"clarification-requested"` > `"approved"` = `"rejected"`  
2. Within same status: `submissionRisk` score descending  
3. Tie-break: regulatory scrutiny level (`"high"` > `"medium"` > `"low"`)  
4. Final tie-break: `submittedAt` ascending (older first)

Response: `200 OK` with `OfficerQueueItem[]`

#### `GET /api/officer/[applicationId]`

Returns the full `ApplicationRecord` for one application.

Response:
- `200 OK` — full record
- `404` — `{ "error": { "code": "NOT_FOUND", "message": "Application not found" } }`

#### `POST /api/officer/decision`

Request body:
```typescript
{
  applicationId: string;
  action: "approve" | "reject" | "clarification_requested" | "override";
  reason?: string;
  officerName?: string;  // defaults to "Officer (Demo)"
}
```

Validation:
- Missing `applicationId` → `400` `{ "error": { "code": "MISSING_APPLICATION_ID", "message": "applicationId is required" } }`
- Unknown `applicationId` → `404`
- `action === "reject"` or `action === "override"` with missing/empty `reason` → `400` `{ "error": { "code": "REASON_REQUIRED", "message": "A reason is required for reject and override actions" } }`

On success:
1. Updates `applicationStore` status
2. Appends officer audit event
3. Returns `{ applicationId, status, auditEventId, updatedAt }`

Status mapping:
| action | new status |
|---|---|
| `"approve"` | `"approved"` |
| `"reject"` | `"rejected"` |
| `"clarification_requested"` | `"clarification-requested"` |
| `"override"` | `"approved"` (with override flag in audit details) |

#### `GET /api/officer/audit/[applicationId]`

Returns `AuditRecord[]` for an application, sorted ascending by timestamp.

Response:
- `200 OK` — audit trail array
- `404` — application not found

#### `POST /api/demo-handoff`

Request body: `{ applicationId: string }`

Validation:
- Missing/blank `applicationId` → `400` `{ "error": { "code": "MISSING_APPLICATION_ID", "message": "applicationId is required" } }`
- Unknown `applicationId` → `404` `{ "error": { "code": "NOT_FOUND", "message": "Application not found" } }`

Success response `200 OK`:
```typescript
{
  generatedAt: string;           // ISO 8601
  disclaimer: "Demo integration — no data is transmitted to a live government system.";
  applicant: {
    applicationId: string;
    companyName: string;
    profile: BusinessProfile;
  };
  applicableApprovals: Approval[];  // applies: true only
  requiredDocuments: RequiredDocument[];  // deduplicated across all applicable approvals
  clauseIds: string[];           // all unique clauseIds from applicable traces
  readinessScore: number;
  submissionRisk: RiskAssessment["submissionRisk"];
  regulatoryScrutiny: RiskAssessment["regulatoryScrutiny"];
  auditSummary: Record<string, number>;  // { "evaluation": 1, "approved": 1, ... }
  engineVersion: string;
  ruleSetVersion: string;
}
```

No outbound HTTP requests are made. The `disclaimer` field and `"Demo integration"` label are mandatory.

---

## Data Models

### ApplicationRecord (internal to store)

```typescript
interface ApplicationRecord {
  applicationId: string;
  profile: BusinessProfile;
  simulationResult: SimulationResult;
  dryRunResult: DryRunResult | null;
  riskAssessment: RiskAssessment;
  status: "pending" | "clarification-requested" | "approved" | "rejected";
  recommendation: string | null;
  submittedAt: string;
  updatedAt: string;
}
```

### AuditRecord (internal to store)

```typescript
interface AuditRecord {
  id: string;
  applicationId: string;
  timestamp: string;
  actor: string;
  actorType: "system" | "officer";
  action:
    | "evaluation"
    | "risk_assessment"
    | "dry_run"
    | "citation_missing"
    | "viewed"
    | "approved"
    | "rejected"
    | "clarification_requested"
    | "overridden";
  reason: string | null;
  details: Record<string, unknown>;
}
```

### DemoHandoffPackage (internal to route)

```typescript
interface DemoHandoffPackage {
  generatedAt: string;
  disclaimer: string;
  applicant: { applicationId: string; companyName: string; profile: BusinessProfile };
  applicableApprovals: Approval[];
  requiredDocuments: RequiredDocument[];
  clauseIds: string[];
  readinessScore: number;
  submissionRisk: RiskAssessment["submissionRisk"];
  regulatoryScrutiny: RiskAssessment["regulatoryScrutiny"];
  auditSummary: Record<string, number>;
  engineVersion: string;
  ruleSetVersion: string;
}
```

### Seed Business JSON schema (`data/seed/businesses.json`)

Array of 13 `BusinessProfile` objects. Every field from the `BusinessProfile` type is included (optional fields explicitly set to `null` or a value). `id` fields use `"seed-01"` through `"seed-13"` format.

---

## UI Component Hierarchy

### Home Page (`app/page.tsx`)

```
<HomePage>
  <header>  ApprovalIQ logo + tagline
  <main>
    <Card> "Simulate Approvals" → links to /simulate (founder flow)
    <Card> "Review Queue" → links to /officer (officer flow)
  <footer> version info
```

Uses: `Card`, `Button`, `Badge`

### Officer Queue (`app/officer/page.tsx`)

```
<OfficerQueuePage>
  <header>
    <h1> Officer Review Dashboard
    <QueueSummary> pending count / total count
  <QueueTable>
    <QueueRow> × N
      companyName, applicationId
      <StatusBadge>
      <PriorityBadge> submissionRisk
      <PriorityBadge> regulatoryScrutiny + disclaimer tooltip
      readinessScore, topIssue
      "Open" button → /officer/[applicationId]
  <EmptyQueue>  (when no items)
```

Uses: `Table`, `Badge`, `Button`, `Separator`, `Tabs` (pending/all filter)

### Application Detail (`app/officer/[applicationId]/page.tsx`)

```
<ApplicationDetailPage>
  <nav> back to queue
  <header> companyName, applicationId, <StatusBadge>
  <Tabs value="overview|risk|evidence|audit">
    [Overview tab]
      <Card> applicant profile fields
      <AdvisoryRecommendation> clearly labelled "Advisory recommendation"
      <DecisionPanel> action buttons + reason textarea
    [Risk tab]
      <RiskBreakdown type="submission" data={submissionRisk}>
        RiskFactor rows: label, points, reason
      <Separator>
      <RiskBreakdown type="scrutiny" data={regulatoryScrutiny}>
        RiskFactor rows: label, reason
        <Alert> "Regulatory scrutiny reflects process complexity, not wrongdoing."
    [Evidence tab]
      <Tabs> approval tabs (one per applicable approval)
        <TraceExplainer approval={approval}>
          "Why applicable" / "Why not applicable" toggle
          DecisionTrace rows: field, rule, value, matched, <CitationBadge>
    [Audit tab]
      <AuditTimeline events={auditEvents}>
        AuditEvent rows: timestamp, actor, action label, reason
```

Uses: `Tabs`, `Card`, `Alert`, `Badge`, `Button`, `Separator`, `Drawer` (mobile detail panels), `Dialog` (confirmation on Reject/Override), `Progress`

### Key Shared Components

**`PriorityBadge`** — renders `RiskTier` as a coloured badge:
- `"high"` → red/destructive variant
- `"medium"` → yellow/warning variant  
- `"low"` → green/success variant

**`StatusBadge`** — maps status strings to badge colours:
- `"pending"` → slate
- `"clarification-requested"` → yellow
- `"approved"` → green
- `"rejected"` → red

**`CitationBadge`** — renders citation inline:
- Citation available + `"needs-review"` → amber badge "Needs review" + source title
- Citation available + `"verified"` → green badge "Verified" + source title
- Citation null → grey badge "Evidence unavailable"

**`TraceExplainer`** — two-panel view (Why? / Why not?):
- Filters traces by `matched: true` for "Why?" panel
- Filters traces by `matched: false` for "Why not?" panel
- Each trace row shows: condition text, applicant value, expected condition, `<CitationBadge>`

**`AuditTimeline`** — ordered list of audit events:
- Ascending chronological order
- Human-readable labels: `"evaluation"` → "Rules evaluated", `"approved"` → "Approved by officer", etc.
- System events in grey, officer events in blue

**`DecisionPanel`** — officer action UI:
- Four buttons: Approve, Request Clarification, Reject, Override
- Reject and Override show a `<Dialog>` requiring a reason string before submitting
- On submit: POSTs to `/api/officer/decision`, updates local state optimistically

---

## State Management Approach

State is managed at three levels:

### 1. Server-Side In-Memory Store (primary, `lib/store/`)

- `applicationStore`: Map of `ApplicationRecord` keyed by `applicationId`
- `auditStore`: Map of `AuditRecord[]` keyed by `applicationId`
- Lives in Node.js module scope — persists within a single server process
- Initialised at first access by `seedApplications()` which runs simulation + risk engine for all 13 seed businesses
- Mutations happen only through the API routes (`/api/officer/decision`)

### 2. Client-Side React State (page-level, `app/officer/`)

- Queue page: fetches from `/api/officer/queue` on load; after a decision is submitted, re-fetches the queue automatically
- Detail page: fetches from `/api/officer/[applicationId]` on load; after decision POST, re-fetches to reflect updated status and new audit event
- No global client state store — each page owns its data via `useState` + `useEffect`

### 3. Navigation State Preservation

- Queue sort/filter state preserved in URL query params (e.g. `?tab=pending`) so navigating back from detail restores the queue view
- Next.js App Router's built-in navigation does not unmount the queue page layout when navigating to a detail page if using a shared layout, but for simplicity the queue state is preserved via URL params rather than React state

---

## Citation Store Design and Clause ID Convention

### Naming Convention

```
<authority-slug>/<act-slug>/<section-ref>
```

- **authority-slug**: short code for the issuing authority  
  - `dgfasli` — Directorate General, Factory Advice Service & Labour Institutes  
  - `ibr` — Indian Boiler Regulations authority  
  - `mpcb` — Maharashtra Pollution Control Board  
  - `msme` — Ministry of Micro, Small and Medium Enterprises  
  - `mah-labour` — Maharashtra Labour Department  
  - `mah-factories` — Maharashtra Factories Directorate  
  - `fire` — Maharashtra Fire Services  
  - `mahares` — Maharashtra Government policy documents  

- **act-slug**: kebab-case act name with year  
  - `factories-act-1948`, `indian-boilers-act-1923`, `water-act-1974`, etc.

- **section-ref**: `section-2m`, `section-6`, `rule-5`, `schedule-1`, `para-3`

### Initial Citation Records (13 entries)

| clauseId | sourceTitle | authority | verificationStatus |
|---|---|---|---|
| `dgfasli/factories-act-1948/section-2m` | The Factories Act, 1948 | DGFASLI | needs-review |
| `dgfasli/factories-act-1948/section-6` | The Factories Act, 1948 | DGFASLI | needs-review |
| `dgfasli/factories-act-1948/section-85` | The Factories Act, 1948 | DGFASLI | needs-review |
| `ibr/indian-boilers-act-1923/section-2` | The Indian Boilers Act, 1923 | IBR | needs-review |
| `mpcb/water-act-1974/section-25` | Water (Prevention and Control of Pollution) Act, 1974 | MPCB | needs-review |
| `mpcb/air-act-1981/section-21` | Air (Prevention and Control of Pollution) Act, 1981 | MPCB | needs-review |
| `mpcb/hazardous-waste-rules-2016/rule-5` | Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016 | MPCB / MoEFCC | needs-review |
| `mpcb/env-protection-act-1986/schedule-1` | Environment (Protection) Act, 1986 | MPCB | needs-review |
| `msme/msme-dev-act-2006/section-7` | Micro, Small and Medium Enterprises Development Act, 2006 | MSME Ministry | needs-review |
| `mah-labour/shops-estab-act-2017/section-7` | Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017 | Maharashtra Labour Dept | needs-review |
| `mpcb/hazardous-waste-rules-2016/rule-5` | Hazardous and Other Wastes Rules, 2016 | MPCB | needs-review |
| `fire/maharashtra-fire-rules-2009/rule-4` | Maharashtra Fire Prevention and Life Safety Measures Act, 2006 | Maharashtra Fire Services | needs-review |
| `mahares/msme-policy-2023/para-3` | Maharashtra MSME Policy 2023 | Maharashtra Industries Dept | needs-review |

All `sourceUrl` values point to real government domains (e.g. `https://labour.gov.in`, `https://mpcb.gov.in`) or are left empty strings where no stable URL is known. No fabricated URLs.

---

## Seed Data (`data/seed/businesses.json`)

13 fictional Maharashtra businesses covering:

| # | Company Name | Industry | District | Employees | Boiler | Hazmat | Investment (Cr) | Near Threshold |
|---|---|---|---|---|---|---|---|---|
| 1 | Vasundhara Food Products | food-processing | Pune | 18 | false | false | 1.2 | Factories Act (18, near 20) |
| 2 | Kalyani Textile Mills | textiles | Nagpur | 85 | true | false | 8.5 | |
| 3 | Panchavati Chemical Works | chemicals | Nashik | 32 | false | true | 4.1 | |
| 4 | Shivshakti Engineering | engineering | Aurangabad | 9 | false | false | 0.8 | Factories Act (9, near 10 with power) |
| 5 | Godavari Solvent Extractions | agro-processing | Latur | 55 | true | true | 12.3 | |
| 6 | Marathwada Steel Castings | metals | Solapur | 120 | true | false | 28.0 | Large workforce |
| 7 | Konkan Ceramics | ceramics | Ratnagiri | 24 | true | false | 3.6 | |
| 8 | Vidarbha Plastics | plastics | Amravati | 11 | false | true | 1.8 | |
| 9 | Deccan Pharmaceuticals | pharmaceuticals | Pune | 45 | false | true | 19.5 | MSME boundary |
| 10 | Shreemati Dairy Products | dairy | Kolhapur | 8 | false | false | 0.4 | Near threshold (8 emp) |
| 11 | Nanded Paper Works | paper | Nanded | 67 | true | false | 6.2 | |
| 12 | Osmanabad Auto Parts | auto-components | Dharashiv | 19 | false | false | 2.9 | Factories Act (19, near 20) |
| 13 | Bhimashankar Paints | paints | Nashik | 38 | false | true | 5.7 | MPCB triggers |

Coverage check:
- ≥4 industries ✓ (food, textiles, chemicals, engineering, agro, metals, ceramics, plastics, pharma, dairy, paper, auto, paints)
- ≥3 districts ✓ (Pune, Nagpur, Nashik, Aurangabad, Latur, Solapur, etc.)
- ≥2 project stages ✓ (mix of `"operating"` and `"planning"`)
- ≥2 near threshold ✓ (seed-01, seed-04, seed-10, seed-12)
- ≥2 hasBoiler ✓ (seed-02, seed-05, seed-06, seed-07, seed-11)
- ≥2 hazardousMaterials/hazardousWaste ✓ (seed-03, seed-05, seed-08, seed-09, seed-13)

---

## Risk Scoring Algorithm (Concrete Weights)

### Submission Risk Score Formula

```
score = 0

if blockingCount > 0:
    points = min(blockingCount × 20, 40)
    add factor("Blocking contradictions", points, "X blocking contradiction(s) prevent approval")

if missingMandatoryCount > 0:
    points = min(missingMandatoryCount × 15, 30)
    add factor("Missing mandatory documents", points, "X mandatory document(s) not uploaded")

if readinessOverall < 60:
    points = Math.round((60 - readinessOverall) / 2)  // max 30 when readiness = 0
    add factor("Low readiness score", points, "Overall readiness is X%")

if lowConfidenceCount > 0:
    points = min(lowConfidenceCount × 3, 15)
    add factor("Low-confidence extractions", points, "X field(s) extracted with low confidence")

if factors.length === 0:
    add factor("No significant risk signals", 0, "Document pack is complete and consistent")

score = clamp(sum(factor.points), 0, 100)

level = score >= 70 ? "high" : score >= 40 ? "medium" : "low"

topIssue = factor with max points (or null if only neutral factor)
```

**Example computation:**
- `blockingCount=1, missingMandatoryCount=2, readinessOverall=55, lowConfidenceCount=3`
- Blocking: 20 pts, Missing: 30 pts, Low readiness: 2 pts, Low confidence: 9 pts
- Score = 61 → level `"medium"` (just above 40)
- topIssue = "2 mandatory document(s) not uploaded" (30 pts, highest)

### Regulatory Scrutiny Level Formula

```
factors = []

if profile.hasBoiler:
    factors.push("Boiler installation", "Boiler-operated facilities require IBR registration and periodic inspection")

if profile.hazardousMaterials || profile.generatesHazardousWaste:
    factors.push("Hazardous process or waste", "Hazardous processes require MPCB consent and waste management authorisation")

if simulation.approvals.filter(a => a.applies).length >= 3:
    factors.push("Multiple applicable approvals", "Three or more regulatory approvals create a complex approval pathway")

if profile.employees >= 100:
    factors.push("Large workforce", "Workforce of 100+ requires additional labour compliance and inspection")

level = factors.length >= 3 ? "high" : factors.length >= 1 ? "medium" : "low"
```

---

## Error Handling

### Citation Safety

- `getCitation()` wraps Map lookup in `try/catch`, returns `null` on any error
- All UI components rendering citations check for `null` and render `<CitationBadge>` in the "unavailable" state
- Missing citation at decision time appends a `"citation_missing"` audit event but does NOT block the decision

### Simulation Safety

- `simulate()` wraps each rule evaluation in `try/catch`; a failing rule produces a trace with `matched: false` and a `reason` of `"Rule evaluation error"`
- Partial simulation results are returned — one broken rule does not abort the whole simulation

### API Route Safety

All API routes:
- Validate required fields and return structured `{ error: { code, message } }` objects
- Never expose stack traces in responses
- Return `400` for validation failures, `404` for not-found, `200` for success
- Wrap handler bodies in try/catch and return `500` on unexpected errors

### UI Graceful Degradation

- If `simulationResult` is null for a detail page → show `"Evidence unavailable"` placeholder sections, not a crash
- If `riskAssessment` is null → show `"Risk data unavailable"` placeholders
- If all citations are null → every `<CitationBadge>` renders "Evidence unavailable"; page remains functional
- Audit trail with no events → render empty state, not a crash

---

## Testing Strategy

### PBT Applicability Assessment

This feature involves a mix of:
- **Pure functions** (citation lookup, risk scoring, simulation rules, trace enrichment) → PBT is appropriate
- **UI rendering** (React components) → snapshot/example tests, not PBT
- **In-memory store** (CRUD with no transformation logic) → example-based tests
- **API routes** (request/response validation) → example/integration tests

PBT is applied to the citation store, risk engine, and simulation engine. UI, store, and API routes use example-based tests.

**Property-based testing library:** [fast-check](https://fast-check.dev) (TypeScript-native, no new packages needed if already in devDependencies; otherwise add as devDependency — it is a test-only dependency with no runtime impact).

### Unit Tests (example-based)

- Citation store: `getCitation` for known and unknown IDs; `getClauseText` returns correct text
- Risk engine: known input signals → expected score, level, and factor labels
- Simulation: specific `BusinessProfile` values → expected `applies` outcomes
- API routes: valid request → expected response shape; invalid request → expected error codes
- Audit store: appended events appear in `getAuditTrail`; order is ascending

### Property Tests (PBT)

Each property test must run a minimum of 100 iterations.
Tag format: `// Feature: approvaliq-chirag-modules, Property N: <property text>`

### Integration Tests

- End-to-end: seed businesses → officer queue → detail page → decision → audit trail updated
- Demo handoff: valid applicationId → complete package structure

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Citation round-trip

*For any* clauseId in `getAllClauseIds()`, calling `getCitation(clauseId)` returns a non-null Citation record whose `clauseId` field equals the input.

**Validates: Requirements 1.2**

---

### Property 2: Unknown clause IDs return null safely

*For any* string that is not in `getAllClauseIds()`, `getCitation(string)` returns `null` and does not throw an exception.

**Validates: Requirements 1.3, 1.10**

---

### Property 3: Unverified clause IDs filter

*For any* clauseId returned by `getUnverifiedClauseIds()`, `getCitation(clauseId)` returns a record with `verificationStatus === "needs-review"`.

**Validates: Requirements 1.5**

---

### Property 4: getClauseText consistency

*For any* clauseId in `getAllClauseIds()`, `getClauseText(clauseId)` returns the same string as the `clause` field of `getCitation(clauseId)`.

**Validates: Requirements 1.6**

---

### Property 5: Decision traces are well-formed

*For any* `BusinessProfile` and any `Approval` produced by the simulation engine, `buildDecisionTraces(profile, approval)` returns a `DecisionTrace[]` where every element has `ruleId` (non-empty string), `condition` (non-empty string), `matched` (boolean), `clauseId` (non-empty string), and `citation` (Citation or null — never undefined).

**Validates: Requirements 2.1**

---

### Property 6: Submission risk output is well-formed and level matches score

*For any* valid `DocumentRiskSignals` object, `computeSubmissionRisk(signals)` returns an object where:
- `score` is an integer in `[0, 100]`
- `level` is exactly `"high"` when `score >= 70`, `"medium"` when `score >= 40`, or `"low"` when `score < 40`
- `factors` is a non-empty array (at least the neutral factor)

**Validates: Requirements 3.1, 3.3, 3.8**

---

### Property 7: Submission risk conditional factors are present when triggered

*For any* `DocumentRiskSignals` where `blockingCount > 0`, the `computeSubmissionRisk` result contains a factor with `label === "Blocking contradictions"`. The same pattern holds: `missingMandatoryCount > 0` → `"Missing mandatory documents"`, `readinessOverall < 60` → `"Low readiness score"`, `lowConfidenceCount > 0` → `"Low-confidence extractions"`.

**Validates: Requirements 3.4, 3.5, 3.6, 3.7**

---

### Property 8: Regulatory scrutiny level matches factor count

*For any* `BusinessProfile` and `SimulationResult`, `computeRegulatoryScrutiny(profile, simulation)` returns a `regulatoryScrutiny` object where `level` is `"high"` when there are 3+ factors, `"medium"` when there are 1–2 factors, and `"low"` when there are 0 factors.

**Validates: Requirements 4.7**

---

### Property 9: Regulatory scrutiny conditional factors are present when triggered

*For any* `BusinessProfile` with `hasBoiler: true`, the scrutiny result contains a factor with `label === "Boiler installation"`. The same pattern holds: `hazardousMaterials || generatesHazardousWaste` → `"Hazardous process or waste"`, `employees >= 100` → `"Large workforce"`, 3+ applicable approvals in SimulationResult → `"Multiple applicable approvals"`.

**Validates: Requirements 4.3, 4.4, 4.5, 4.6**

---

### Property 10: Audit trail is append-only and ordered

*For any* sequence of `appendAuditEvent` calls on the same `applicationId`, each subsequent call strictly increases `getAuditTrail(applicationId).length` by exactly 1, and the returned array is sorted in ascending order by `timestamp`.

**Validates: Requirements 7.9, 7.8**

---

### Property 11: Seed businesses have complete BusinessProfile fields

*For every* record in `businesses.json`, the record has all required `BusinessProfile` fields with the correct types: `industry` (string), `district` (string), `areaSqFt` (number), `investmentCrore` (number), `employees` (number), `usesPower` (boolean), `hasBoiler` (boolean), `hazardousMaterials` (boolean), `generatesHazardousWaste` (boolean), `projectStage` (one of `"planning"`, `"construction"`, `"operating"`).

**Validates: Requirements 8.2**

---

## File and Directory Structure — All New Files

```
approvaliq-app/
│
├── app/
│   ├── page.tsx                                    ← REPLACE (H)
│   ├── officer/
│   │   ├── page.tsx                                ← NEW (E)
│   │   └── [applicationId]/
│   │       └── page.tsx                            ← NEW (E)
│   └── api/
│       ├── officer/
│       │   ├── queue/
│       │   │   └── route.ts                        ← NEW (F)
│       │   ├── [applicationId]/
│       │   │   └── route.ts                        ← NEW (F)
│       │   ├── decision/
│       │   │   └── route.ts                        ← NEW (F)
│       │   └── audit/
│       │       └── [applicationId]/
│       │           └── route.ts                    ← NEW (F)
│       └── demo-handoff/
│           └── route.ts                            ← NEW (F)
│
├── lib/
│   ├── citations/
│   │   ├── citations.ts                            ← NEW (A)
│   │   └── index.ts                                ← NEW (A)
│   ├── explanation/
│   │   └── explain.ts                              ← NEW (B)
│   ├── risk/
│   │   └── risk.ts                                 ← NEW (C)
│   ├── simulation/
│   │   └── simulate.ts                             ← NEW (I)
│   └── store/
│       ├── applicationStore.ts                     ← NEW (D)
│       └── auditStore.ts                           ← NEW (D)
│
├── components/
│   ├── officer/
│   │   ├── QueueTable.tsx                          ← NEW
│   │   ├── QueueRow.tsx                            ← NEW
│   │   ├── PriorityBadge.tsx                       ← NEW
│   │   ├── DecisionPanel.tsx                       ← NEW
│   │   ├── RiskBreakdown.tsx                       ← NEW
│   │   ├── TraceExplainer.tsx                      ← NEW
│   │   ├── CitationBadge.tsx                       ← NEW
│   │   ├── AuditTimeline.tsx                       ← NEW
│   │   └── EmptyQueue.tsx                          ← NEW
│   └── shared/
│       └── StatusBadge.tsx                         ← NEW
│
└── data/
    └── seed/
        └── businesses.json                         ← NEW (G)
```

**Total new files: 26**  
**Modified files: 1** (`app/page.tsx` replacement)  
**Unchanged: all existing files** including `types/index.ts`, `lib/documents/`, `app/api/dryrun/`, `components/ui/`

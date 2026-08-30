# Implementation Plan: ApprovalIQ — Chirag's Modules

## Overview

Implements 26 new TypeScript files and 1 replacement (`app/page.tsx`) inside `approvaliq-app/`.
Tasks are ordered foundation-first: data and pure library modules land before stores, then API routes, then UI components, then pages. Each step is self-contained and can be verified before the next begins.

All code targets **TypeScript** with the existing Next.js 16 App Router conventions.
Never modify `types/index.ts`, `lib/documents/`, `app/api/dryrun/`, or `components/ui/`.

---

## Tasks

- [x] 1. Create seed business data fixture
  - [x] 1.1 Create `approvaliq-app/data/seed/businesses.json`
    - Write a JSON array of exactly 13 `BusinessProfile` objects
    - IDs: `"seed-01"` through `"seed-13"` (string)
    - Cover ≥ 4 industries, ≥ 3 districts, both `"operating"` and `"planning"` project stages
    - Include seed-01 (18 employees, no power, near Factories Act threshold of 20) and seed-04 (9 employees with power, near threshold of 10) as threshold demo cases
    - Include seed-02, seed-05, seed-06, seed-07, seed-11 with `hasBoiler: true`
    - Include seed-03, seed-05, seed-08, seed-09, seed-13 with `hazardousMaterials: true` or `generatesHazardousWaste: true`
    - All company names must be clearly fictional
    - All district names must be real Indian district names
    - Every field from `BusinessProfile` in `types/index.ts` must be present (use `null` for absent optional numerics)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8_

  - [x] 1.2 Write property test for seed business completeness
    - **Property 11: Seed businesses have complete BusinessProfile fields**
    - Use fast-check (add to devDependencies if absent): `fc.assert(fc.property(fc.constantFrom(...businesses), b => hasAllRequiredFields(b)))`
    - Validate: `industry`, `district`, `areaSqFt`, `investmentCrore`, `employees`, `usesPower`, `hasBoiler`, `hazardousMaterials`, `generatesHazardousWaste`, `projectStage` are present with correct types
    - **Validates: Requirements 8.2**

- [x] 2. Implement Citation Store
  - [x] 2.1 Create `approvaliq-app/lib/citations/citations.ts`
    - Define the internal `CitationRecord` interface (extends `Citation` from `types/index.ts` with `heading: string`, `relevantText: string`, `notes: string`)
    - Populate a `Map<string, CitationRecord>` at module scope with all 13 clause ID entries from the design doc (all `verificationStatus: "needs-review"`)
    - Clause IDs to include: `dgfasli/factories-act-1948/section-2m`, `dgfasli/factories-act-1948/section-6`, `dgfasli/factories-act-1948/section-85`, `ibr/indian-boilers-act-1923/section-2`, `mpcb/water-act-1974/section-25`, `mpcb/air-act-1981/section-21`, `mpcb/hazardous-waste-rules-2016/rule-5`, `mpcb/env-protection-act-1986/schedule-1`, `msme/msme-dev-act-2006/section-7`, `mah-labour/shops-estab-act-2017/section-7`, `fire/maharashtra-fire-rules-2009/rule-4`, `mahares/msme-policy-2023/para-3`
    - All `sourceUrl` values must be real government domains or empty strings — no fabricated URLs
    - Export the map as a named constant `citationStore`
    - _Requirements: 1.1, 1.9_

  - [x] 2.2 Create `approvaliq-app/lib/citations/index.ts`
    - Implement and export `getCitation(clauseId: string): Citation | null` — wraps Map lookup in `try/catch`, returns `null` on any error, never throws
    - Implement and export `getClauseText(clauseId: string): string | null` — returns `relevantText` from the record or `null`
    - Implement and export `getAllClauseIds(): string[]` — returns all registered clause IDs
    - Implement and export `getUnverifiedClauseIds(): string[]` — returns only IDs where `verificationStatus === "needs-review"`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.10_

  - [x] 2.3 Write property test for citation round-trip
    - **Property 1: Citation round-trip**
    - Generate random strings from `getAllClauseIds()` using `fc.constantFrom(...getAllClauseIds())`; assert `getCitation(id)` returns non-null with matching `clauseId`
    - **Validates: Requirements 1.2**

  - [x] 2.4 Write property test for unknown clause IDs return null
    - **Property 2: Unknown clause IDs return null safely**
    - Generate arbitrary strings not in `getAllClauseIds()` (filter with `fc.string()` + assume); assert `getCitation(s)` returns `null` without throwing
    - **Validates: Requirements 1.3, 1.10**

  - [x] 2.5 Write property test for unverified clause IDs filter
    - **Property 3: Unverified clause IDs filter**
    - For every ID in `getUnverifiedClauseIds()`, assert `getCitation(id)?.verificationStatus === "needs-review"`
    - **Validates: Requirements 1.5**

  - [x] 2.6 Write property test for getClauseText consistency
    - **Property 4: getClauseText consistency**
    - For every ID in `getAllClauseIds()`, assert `getClauseText(id) === getCitation(id)?.clause`
    - **Validates: Requirements 1.6**

- [x] 3. Implement Simulation Engine
  - [x] 3.1 Create `approvaliq-app/lib/simulation/simulate.ts`
    - Import `BusinessProfile`, `SimulationResult`, `Approval`, `DecisionTrace`, `SimulationSummary` from `@/types`
    - Export `simulate(profile: BusinessProfile): SimulationResult`
    - Implement the 8 approval rules from the design doc with their clause IDs:
      - `factories-act-licence`: `employees >= 10 && usesPower || employees >= 20` → clause `dgfasli/factories-act-1948/section-6`
      - `boiler-certificate`: `hasBoiler === true` → clause `ibr/indian-boilers-act-1923/section-2`
      - `mpcb-consent-water`: `hazardousMaterials || generatesHazardousWaste` → clause `mpcb/water-act-1974/section-25`
      - `mpcb-consent-air`: `hazardousMaterials || generatesHazardousWaste` → clause `mpcb/air-act-1981/section-21`
      - `hazardous-waste-auth`: `generatesHazardousWaste === true` → clause `mpcb/hazardous-waste-rules-2016/rule-5`
      - `msme-registration`: `investmentCrore <= 250` → clause `msme/msme-dev-act-2006/section-7`
      - `shops-estab-registration`: `employees >= 1` → clause `mah-labour/shops-estab-act-2017/section-7`
      - `fire-noc`: `areaSqFt >= 500` → clause `fire/maharashtra-fire-rules-2009/rule-4`
    - Each rule evaluation produces a `DecisionTrace` with `ruleId`, `condition` (human-readable), `applicantValue`, `expectedCondition`, `matched`, `clauseId`, `citation: null` (citations enriched separately by `explain.ts`)
    - Wrap each rule evaluation in `try/catch`; a failing rule emits a trace with `matched: false` and `condition: "Rule evaluation error"`
    - Compute `SimulationSummary`: `criticalPathDays` = max `statutoryDays` among `applies: true` approvals, `indicativeFeeTotal`, `bottleneckApprovalId`, `highestRiskTier`
    - Set `engineVersion: "1.0.0"`, `ruleSetVersion: "mah-2024-v1"`, `generatedAt` to current ISO timestamp
    - Include required documents and indicative fees per approval as specified in the design
    - _Requirements: 2.1, 8.6, 10.1_

- [x] 4. Implement Risk Engine
  - [x] 4.1 Create `approvaliq-app/lib/risk/risk.ts`
    - Import `DocumentRiskSignals`, `BusinessProfile`, `SimulationResult`, `RiskAssessment`, `RiskFactor`, `RiskTier` from `@/types`
    - Export `computeSubmissionRisk(signals: DocumentRiskSignals): RiskAssessment["submissionRisk"]`
      - Scoring algorithm (per design): blocking×20 capped 40, missing×15 capped 30, readiness<60 → `round((60-readiness)/2)`, lowConf×3 capped 15
      - Clamp total score to `[0, 100]`
      - Level: `score >= 70` → `"high"`, `>= 40` → `"medium"`, `< 40` → `"low"`
      - When no elevated signals, add neutral factor `"No significant risk signals"` with `points: 0`
      - `topIssue` = `reason` of highest-`points` factor, or `null` for neutral-only result
      - Use `label` and `points` fields (matching existing `RiskFactor` type, not `name`/`impact`)
    - Export `computeRegulatoryScrutiny(profile: BusinessProfile, simulation: SimulationResult): RiskAssessment["regulatoryScrutiny"]`
      - Factor conditions: `hasBoiler`, `hazardousMaterials || generatesHazardousWaste`, `applies.length >= 3`, `employees >= 100`
      - Level: `count >= 3` → `"high"`, `>= 1` → `"medium"`, `0` → `"low"`
      - Scrutiny factor `reason` fields must describe process complexity, never imply wrongdoing
      - Scrutiny factors omit `points` field
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.10_

  - [x] 4.2 Write property test for submission risk output is well-formed
    - **Property 6: Submission risk output is well-formed and level matches score**
    - Use `fc.record({blockingCount: fc.nat(10), warningCount: fc.nat(10), missingMandatoryCount: fc.nat(10), lowConfidenceCount: fc.nat(10), verifiedFieldCount: fc.nat(10), readinessOverall: fc.integer({min:0,max:100}), status: fc.constantFrom("ready","blocked","needs-review"), topIssue: fc.option(fc.string()), evidence: fc.array(fc.string())})` to generate signals
    - Assert `score` in `[0,100]`, level matches threshold rules, `factors.length >= 1`
    - **Validates: Requirements 3.1, 3.3, 3.8**

  - [x] 4.3 Write property test for submission risk conditional factors
    - **Property 7: Submission risk conditional factors are present when triggered**
    - Generate signals with `blockingCount > 0` and assert factor labelled `"Blocking contradictions"` is present; repeat for `missingMandatoryCount`, `readinessOverall < 60`, `lowConfidenceCount`
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7**

  - [x] 4.4 Write property test for regulatory scrutiny level matches factor count
    - **Property 8: Regulatory scrutiny level matches factor count**
    - Generate `BusinessProfile` and `SimulationResult` combinations using fast-check; assert `level` matches the 0/1-2/3+ factor count thresholds
    - **Validates: Requirements 4.7**

  - [x] 4.5 Write property test for regulatory scrutiny conditional factors
    - **Property 9: Regulatory scrutiny conditional factors are present when triggered**
    - Generate profiles with `hasBoiler: true` and assert `"Boiler installation"` factor is present; repeat for hazmat, workforce ≥ 100, and 3+ applicable approvals
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6**

- [x] 5. Implement Decision Explanation Layer
  - [x] 5.1 Create `approvaliq-app/lib/explanation/explain.ts`
    - Import `BusinessProfile`, `Approval`, `DecisionTrace` from `@/types`
    - Import `getCitation` from `@/lib/citations`
    - Export `buildDecisionTraces(profile: BusinessProfile, approval: Approval): DecisionTrace[]`
    - Enrich each trace in `approval.traces` by calling `getCitation(trace.clauseId)`:
      - If citation returned → set `trace.citation = citation`
      - If null → set `trace.citation = null`
    - If enrichment of one trace fails, continue with the others (partial results acceptable)
    - Function must not throw; return partial results on any error
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 5.2 Write property test for decision traces are well-formed
    - **Property 5: Decision traces are well-formed**
    - For any `Approval` produced by `simulate()`, call `buildDecisionTraces(profile, approval)` and assert every element has non-empty `ruleId`, non-empty `condition`, boolean `matched`, non-empty `clauseId`, and `citation` that is either a `Citation` object or `null` (never `undefined`)
    - **Validates: Requirements 2.1**

- [x] 6. Implement Audit Store
  - [x] 6.1 Create `approvaliq-app/lib/store/auditStore.ts`
    - Define internal `AuditRecord` interface (superset of `AuditEvent` from `types/index.ts`): `id`, `applicationId`, `timestamp`, `actor`, `actorType: "system" | "officer"`, `action` (all action type strings per design), `reason: string | null`, `details: Record<string, unknown>`
    - Implement module-level `Map<string, AuditRecord[]>` (applicationId → events)
    - Export `appendAuditEvent(event: Omit<AuditRecord, "id">): AuditRecord` — generates `id` as `` `audit-${Date.now()}-${Math.random().toString(36).slice(2)}` ``, pushes to array (never mutates existing events), returns full record
    - Export `getAuditTrail(applicationId: string): AuditRecord[]` — returns array sorted ascending by `timestamp`; returns `[]` for unknown applicationId
    - _Requirements: 7.1, 7.8, 7.9_

  - [x] 6.2 Write property test for audit trail append-only and ordered
    - **Property 10: Audit trail is append-only and ordered**
    - Generate a sequence of 1–20 `appendAuditEvent` calls for the same applicationId; after each call assert `getAuditTrail(id).length` increased by exactly 1 and the array is sorted ascending by `timestamp`
    - **Validates: Requirements 7.8, 7.9**

- [x] 7. Implement Application Store
  - [x] 7.1 Create `approvaliq-app/lib/store/applicationStore.ts`
    - Define internal `ApplicationRecord` interface (per design): `applicationId`, `profile`, `simulationResult`, `dryRunResult: DryRunResult | null`, `riskAssessment`, `status`, `recommendation: string | null`, `submittedAt`, `updatedAt`
    - Implement module-level `Map<string, ApplicationRecord>` initialised lazily on first access
    - Export `getApplication(id: string): ApplicationRecord | null`
    - Export `getAllApplications(): ApplicationRecord[]`
    - Export `setApplication(record: ApplicationRecord): void`
    - Export `updateApplicationStatus(id: string, status: OfficerQueueItem["status"], recommendation?: string): boolean` — returns `false` if id unknown
    - Export `seedApplications(businesses: BusinessProfile[]): void` — for each business: run `simulate(profile)`, run `computeSubmissionRisk` + `computeRegulatoryScrutiny`, create `ApplicationRecord` with `status: "pending"` and `recommendation: null`, call `setApplication`, then `appendAuditEvent` for `"evaluation"` and `"risk_assessment"` system events
    - Call `seedApplications` lazily on first store access (check if map is empty)
    - Import seed businesses from `@/data/seed/businesses.json` using `assert { type: "json" }` or standard `require`
    - _Requirements: 5.1, 7.2, 7.3, 10.1_

- [x] 8. Implement API Routes
  - [x] 8.1 Create `approvaliq-app/app/api/officer/queue/route.ts`
    - `GET` handler — call `getAllApplications()`, map to `OfficerQueueItem[]`, sort by priority rules (pending > clarification-requested > approved/rejected, then submissionRisk desc, then scrutiny level desc, then submittedAt asc)
    - Return `Response.json(items)` with status 200
    - Wrap in try/catch; return 500 on unexpected error
    - _Requirements: 5.1, 5.2, 5.7, 5.9_

  - [x] 8.2 Create `approvaliq-app/app/api/officer/[applicationId]/route.ts`
    - `GET` handler — call `getApplication(params.applicationId)`
    - Return 200 with full `ApplicationRecord` if found; 404 with `{ error: { code: "NOT_FOUND", message: "Application not found" } }` if not
    - _Requirements: 6.1, 6.2_

  - [x] 8.3 Create `approvaliq-app/app/api/officer/decision/route.ts`
    - `POST` handler — parse body `{ applicationId, action, reason?, officerName? }`
    - Validate: missing `applicationId` → 400 `MISSING_APPLICATION_ID`; unknown id → 404; `action === "reject" || action === "override"` with empty/missing reason → 400 `REASON_REQUIRED`
    - Map action to new status (approve→approved, reject→rejected, clarification_requested→clarification-requested, override→approved)
    - Call `updateApplicationStatus`, call `appendAuditEvent` with actorType `"officer"` and the mapped action string
    - Return 200 `{ applicationId, status, auditEventId, updatedAt }`
    - _Requirements: 6.6, 6.7, 7.7_

  - [x] 8.4 Create `approvaliq-app/app/api/officer/audit/[applicationId]/route.ts`
    - `GET` handler — call `getAuditTrail(params.applicationId)`
    - If application not found in applicationStore → 404; else return 200 with `AuditRecord[]` sorted ascending by timestamp
    - _Requirements: 7.1, 7.8_

  - [x] 8.5 Create `approvaliq-app/app/api/demo-handoff/route.ts`
    - `POST` handler — parse body `{ applicationId }`
    - Validate: missing/blank `applicationId` → 400 `MISSING_APPLICATION_ID`; unknown id → 404 `NOT_FOUND`
    - Build `DemoHandoffPackage`: deduplicate `requiredDocuments` across applicable approvals, collect unique `clauseIds` from traces, compute `auditSummary` as `Record<action, count>`
    - Include mandatory fields: `generatedAt` (ISO 8601), `disclaimer: "Demo integration — no data is transmitted to a live government system."`
    - No outbound HTTP calls
    - Return 200 with full package
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8_

- [x] 9. Checkpoint — verify TypeScript compiles and stores seed correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Shared UI Components
  - [x] 10.1 Create `approvaliq-app/components/shared/StatusBadge.tsx`
    - Accept `status: "pending" | "clarification-requested" | "approved" | "rejected"` prop
    - Use `Badge` from `@/components/ui/badge` with appropriate variant:
      - `"pending"` → slate/secondary
      - `"clarification-requested"` → yellow (outline or warning styling)
      - `"approved"` → green (default or success)
      - `"rejected"` → red (destructive)
    - _Requirements: 5.7, 5.3_

  - [x] 10.2 Create `approvaliq-app/components/officer/PriorityBadge.tsx`
    - Accept `tier: RiskTier` prop and optional `label?: string`
    - Use `Badge` with:
      - `"high"` → destructive variant
      - `"medium"` → outline with amber/yellow text
      - `"low"` → default/secondary with green tint
    - _Requirements: 5.3, 4.9_

  - [x] 10.3 Create `approvaliq-app/components/officer/CitationBadge.tsx`
    - Accept `citation: Citation | null` prop
    - Render:
      - `citation` is null → grey badge "Evidence unavailable"
      - `citation.verificationStatus === "needs-review"` → amber badge "Needs review" + `sourceTitle`
      - `citation.verificationStatus === "verified"` → green badge "Verified" + `sourceTitle`
    - Use `Badge` from `@/components/ui/badge`
    - _Requirements: 1.7, 1.8, 6.8, 6.9_

- [x] 11. Implement Officer Queue Components
  - [x] 11.1 Create `approvaliq-app/components/officer/EmptyQueue.tsx`
    - Renders a centred empty-state message when no queue items exist
    - Use shadcn/ui `Card` and existing Tailwind classes
    - _Requirements: 5.8_

  - [x] 11.2 Create `approvaliq-app/components/officer/QueueRow.tsx`
    - Accept `item: OfficerQueueItem` and `onClick: () => void` props
    - Render a table row with: `companyName`, `applicationId`, `<StatusBadge status={item.status}>`, `<PriorityBadge tier={...}>` for submissionRisk level, `<PriorityBadge tier={item.regulatoryScrutiny}>` with tooltip "Reflects process complexity, not wrongdoing.", `readinessScore`, `topIssue || "—"`, "Open" button calling `onClick`
    - Use `TableRow`, `TableCell` from `@/components/ui/table`
    - _Requirements: 5.3, 5.5_

  - [x] 11.3 Create `approvaliq-app/components/officer/QueueTable.tsx`
    - Accept `items: OfficerQueueItem[]` and `onSelect: (applicationId: string) => void` props
    - Render `Table`, `TableHeader`, `TableBody` from `@/components/ui/table`
    - Map items to `<QueueRow>` components
    - If `items.length === 0`, render `<EmptyQueue>`
    - _Requirements: 5.1, 5.8_

  - [x] 11.4 Create `approvaliq-app/components/officer/RiskBreakdown.tsx`
    - Accept `type: "submission" | "scrutiny"`, `submissionRisk?: RiskAssessment["submissionRisk"]`, `regulatoryScrutiny?: RiskAssessment["regulatoryScrutiny"]` props
    - For submission: render score as `Progress` bar + level badge, then each factor row showing `label`, `points`, `reason`
    - For scrutiny: render level badge, then each factor row showing `label`, `reason`; render `Alert` with text "Regulatory scrutiny reflects process complexity, not wrongdoing."
    - The two risk types must be rendered in completely separate, distinctly labelled sections
    - _Requirements: 3.10, 4.8, 4.9, 6.2_

  - [x] 11.5 Create `approvaliq-app/components/officer/TraceExplainer.tsx`
    - Accept `approval: Approval` prop
    - Render two-panel toggle ("Why applicable?" / "Why not applicable?")
    - "Why?" panel: filter traces where `matched === true`; render each trace row with `condition`, `applicantValue`, `expectedCondition`, `<CitationBadge citation={trace.citation}>`
    - "Why not?" panel: filter traces where `matched === false`; same row format
    - Use `Tabs` from `@/components/ui/tabs`
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 11.6 Create `approvaliq-app/components/officer/AuditTimeline.tsx`
    - Accept `events: AuditRecord[]` prop (sorted ascending)
    - Render ordered list; each row: `timestamp` (formatted), human-readable `actorType` label (system→"System", officer→officer name), human-readable `action` label per the mapping in the design, `reason` if non-null
    - System events styled in grey, officer events in blue
    - Renders empty state if `events.length === 0`
    - _Requirements: 7.8, 7.10_

  - [x] 11.7 Create `approvaliq-app/components/officer/DecisionPanel.tsx`
    - Accept `applicationId: string`, `currentStatus: OfficerQueueItem["status"]`, `onDecisionSubmitted: () => void` props
    - Render four buttons: "Approve", "Request Clarification", "Reject", "Override"
    - "Reject" and "Override" open a `Dialog` requiring a non-empty reason string before enabling submit
    - On submit: `POST /api/officer/decision` with `{ applicationId, action, reason, officerName: "Officer (Demo)" }`, then call `onDecisionSubmitted()`
    - Display advisory label `"Advisory recommendation"` clearly above/near the decision buttons
    - Disable buttons during in-flight request
    - _Requirements: 6.3, 6.6, 6.7_

- [x] 12. Implement Officer Queue Page
  - [x] 12.1 Create `approvaliq-app/app/officer/page.tsx`
    - `"use client"` — fetches `GET /api/officer/queue` on mount with `useEffect`/`useState`
    - Render `<h1>Officer Review Dashboard</h1>`, pending count / total count summary
    - Render `<Tabs>` with "Pending" tab (filter `status === "pending"`) and "All" tab
    - Active tab preserved in URL query param `?tab=pending` or `?tab=all` using `useSearchParams` + `useRouter`
    - Render `<QueueTable>` with filtered items; on row select navigate to `/officer/[applicationId]`
    - After returning from detail page, re-fetch queue to reflect any status changes
    - Use `Separator` from `@/components/ui/separator` between header and table
    - _Requirements: 5.1, 5.2, 5.6, 5.9, 10.4, 10.5_

- [x] 13. Implement Officer Detail Page
  - [x] 13.1 Create `approvaliq-app/app/officer/[applicationId]/page.tsx`
    - `"use client"` — fetches `GET /api/officer/[applicationId]` and `GET /api/officer/audit/[applicationId]` on mount
    - Render back-to-queue nav link
    - Render `companyName`, `applicationId`, `<StatusBadge>`
    - Four-tab layout using `Tabs` from `@/components/ui/tabs`: "Overview", "Risk", "Evidence", "Audit"
    - **Overview tab**: applicant profile fields, `<AdvisoryRecommendation>` section labelled "Advisory recommendation" (visually distinct), `<DecisionPanel>` — on `onDecisionSubmitted` re-fetch application and audit trail
    - **Risk tab**: `<RiskBreakdown type="submission">` + `<Separator>` + `<RiskBreakdown type="scrutiny">`; verify the disclaimer Alert renders
    - **Evidence tab**: one inner `Tabs` per applicable approval (where `applies === true`); each approval tab renders `<TraceExplainer approval={approval}>`; if no applicable approvals show "No applicable approvals found"
    - **Audit tab**: `<AuditTimeline events={auditEvents}>`; record a `"viewed"` officer audit event on mount via `POST /api/officer/decision` … (use `appendAuditEvent` directly from audit API route — or a small dedicated `/api/officer/audit/record` route if needed)
    - Graceful degradation: if `simulationResult` null → show "Evidence unavailable" placeholders; if `riskAssessment` null → show "Risk data unavailable"; all `CitationBadge` handle null citations
    - `engineVersion` and `ruleSetVersion` displayed at bottom of Evidence tab
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8, 6.9, 6.10, 7.6, 10.2, 10.3_

- [x] 14. Implement Home Page Replacement
  - [x] 14.1 Replace `approvaliq-app/app/page.tsx`
    - Replace existing content; keep the same file path
    - Render: ApprovalIQ logo/heading + tagline, two `Card` components — "Simulate Approvals" (links to `/simulate`, for founder flow) and "Review Queue" (links to `/officer`, for officer flow)
    - Footer: version info (`engineVersion: "1.0.0"`, `ruleSetVersion: "mah-2024-v1"`)
    - Demo disclaimer: "Demo integration — no data is transmitted to a live government system."
    - Use only existing `Card`, `Button`, `Badge` from `@/components/ui`
    - _Requirements: 9.6, 10.4_

- [x] 15. Build Verification
  - [x] 15.1 Run TypeScript build and fix all errors
    - Run `tsc --noEmit` (or `next build`) from `approvaliq-app/`
    - Fix all type errors, import path errors, and missing module errors
    - Ensure no modifications were made to `types/index.ts`, `lib/documents/`, `app/api/dryrun/`, or `components/ui/`
    - _Requirements: 10.1_

  - [x] 15.2 Run ESLint and fix linting errors
    - Run `eslint` from `approvaliq-app/`
    - Fix all reported errors (warnings may remain)
    - _Requirements: 10.1_

- [x] 16. Final Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- fast-check must be added to `devDependencies` (`"fast-check": "^3"`) if not already present — it is test-only with no runtime impact
- The audit `"viewed"` event for the detail page (Requirement 7.6) can be emitted by calling the audit API route from the server component or by a small `useEffect` calling a dedicated route
- The queue URL param preservation (Requirement 10.5) uses Next.js `useSearchParams` in the officer queue page — this requires the page to be wrapped in `<Suspense>` per Next.js App Router rules
- All in-memory stores (applicationStore, auditStore) are reset on server restart; this is expected for a demo system
- `data/seed/businesses.json` is imported server-side; use `require()` or `import ... assert { type: "json" }` depending on tsconfig `resolveJsonModule` setting (check `tsconfig.json`)
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "3.1", "4.1", "6.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "5.1", "6.2"] },
    { "id": 4, "tasks": ["5.2", "7.1"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 6, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 7, "tasks": ["11.1", "11.2", "11.4", "11.5", "11.6"] },
    { "id": 8, "tasks": ["11.3", "11.7", "14.1"] },
    { "id": 9, "tasks": ["12.1"] },
    { "id": 10, "tasks": ["13.1"] },
    { "id": 11, "tasks": ["15.1", "15.2"] }
  ]
}
```

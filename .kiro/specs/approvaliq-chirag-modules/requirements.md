# Requirements Document

## Introduction

This document specifies the requirements for Chirag's modules in the ApprovalIQ hackathon project. ApprovalIQ is an existing Next.js (TypeScript) + Python FastAPI system that helps businesses navigate regulatory approval processes in Maharashtra, India.

Chirag's scope covers eight interconnected modules that extend the existing platform: a regulatory evidence and citation system, a decision explanation layer, an explainable risk engine (submission risk and regulatory scrutiny as two separate concepts), an officer dashboard with prioritised queue, an application detail and officer decision workflow, an audit trail, seed businesses for demo, and a Maitri demo handoff API.

**Core philosophy:** Rules decide → Evidence proves → AI/Explanation narrates → Human decides. The system must never invent regulatory citations, fabricate clause numbers, or make final regulatory determinations. Officers retain final decision authority on every application.

**Integration constraint:** All modules must integrate with and extend the existing codebase — specifically the `types/index.ts` shared type contracts, the `lib/documents` document intelligence module, the `app/api/dryrun` route, and the Python backend services under `services/api` and `services/matching`. No existing functionality may be removed or broken.

---

## Glossary

- **ApprovalIQ_System**: The full ApprovalIQ application (Next.js frontend + Python FastAPI services).
- **Citation_Store**: The in-memory/static data layer mapping clause IDs to structured citation records.
- **Decision_Trace**: A structured record capturing which rule was evaluated, the applicant's input value, whether the condition matched, and the supporting citation.
- **DryRunResult**: The existing type from `types/index.ts` produced by the document dry-run module.
- **DocumentRiskSignals**: The existing type from `types/index.ts` produced by `lib/documents/readiness.ts`, consumed by the risk engine.
- **Officer**: A reviewing authority who uses the officer-facing dashboard to evaluate applications and make final decisions.
- **OfficerQueueItem**: The existing type from `types/index.ts` representing a row in the prioritised officer queue.
- **Risk_Engine**: The module computing submission risk and regulatory scrutiny scores from structured signals.
- **Submission_Risk**: A measure of how likely an application/document pack is to need officer attention, derived from document validation signals.
- **Regulatory_Scrutiny**: A measure of process complexity for a business, derived from its industry, facility characteristics, and number of applicable approvals. Never implies wrongdoing.
- **Audit_Trail**: The append-only log of every system and officer action taken on an application.
- **Seed_Business**: A fictional but realistic business profile used for demo purposes.
- **Demo_Handoff_Package**: A structured payload passed to a simulated downstream system (Maitri) for demo purposes — never connected to a real government system.
- **Rules_Engine**: The existing applicability matching engine (the `services/matching` Python service and its Next.js-side simulation layer).
- **Advisory_Recommendation**: A non-binding system-generated suggestion labelled explicitly as advisory; the officer always decides.

---

## Requirements

---

### Requirement 1: Regulatory Evidence and Citation Store

**User Story:** As an officer, I want every rule-based decision to link to a verifiable regulatory source, so that I can confirm the legal basis for each applicability determination and trust the system's output.

#### Acceptance Criteria

1. THE Citation_Store SHALL maintain a record for every clause ID referenced by the Rules_Engine, containing: `clauseId`, `sourceTitle`, `authority`, `version`, `sourceUrl`, `lastVerified`, `sectionOrClause`, `heading`, `relevantText`, `verificationStatus` (one of `"verified"` or `"needs-review"`), and `notes`.
2. WHEN `getCitation(clauseId)` is called and the clauseId exists, THE Citation_Store SHALL return the matching Citation record.
3. WHEN `getCitation(clauseId)` is called and the clauseId does not exist, THE Citation_Store SHALL return `null` without throwing an exception.
4. THE Citation_Store SHALL expose `getAllClauseIds()` returning a string array of all registered clause IDs.
5. THE Citation_Store SHALL expose `getUnverifiedClauseIds()` returning only the subset of clause IDs whose `verificationStatus` is `"needs-review"`.
6. THE Citation_Store SHALL expose `getClauseText(clauseId)` returning the `relevantText` string, or `null` if the clause ID is not found.
7. IF a citation record has `verificationStatus: "needs-review"`, THEN THE ApprovalIQ_System SHALL display the label `"Needs review"` alongside the citation in the UI rather than presenting it as authoritative.
8. IF a clauseId is referenced but has no citation record, THEN THE ApprovalIQ_System SHALL display `"Evidence unavailable"` in all UI locations where a citation would appear.
9. THE Citation_Store SHALL NOT contain fabricated regulatory clause numbers, invented government URLs, or invented authority names — all entries with unconfirmed provenance SHALL use `verificationStatus: "needs-review"` and `sourceUrl` set to a real published government domain or left as an empty string.
10. THE ApprovalIQ_System SHALL NOT crash or throw an unhandled exception when any citation is missing, null, or marked needs-review.

---

### Requirement 2: Decision Explanation Layer

**User Story:** As an officer or applicant, I want to see exactly why each approval was determined to apply or not apply, so that I can verify the logic, identify errors, and understand the regulatory basis.

#### Acceptance Criteria

1. WHEN an applicability decision is made for an approval, THE ApprovalIQ_System SHALL produce a Decision_Trace for each rule evaluated, containing: `ruleId`, `condition` (human-readable), `applicantValue`, `expectedCondition`, `matched` (boolean), `clauseId`, and `citation` (Citation record or null); IF trace generation fails, THE ApprovalIQ_System SHALL allow the decision to proceed and record the trace failure in the Audit_Trail rather than blocking the decision.
2. THE ApprovalIQ_System SHALL display the set of Decision_Traces for any approval as a "Why?" explanation that shows: the business field that was evaluated, the rule condition, whether the condition matched, the resulting decision, and the supporting citation with its verification status.
3. WHEN an approval does not apply, THE ApprovalIQ_System SHALL support a "Why not applicable?" view showing which rule conditions were not met and why.
4. IF a Decision_Trace has `citation: null`, THEN THE ApprovalIQ_System SHALL display `"Evidence unavailable"` in the explanation rather than omitting the step.
5. THE Decision_Trace SHALL be the single authoritative source of truth for decision explanations — the ApprovalIQ_System SHALL NOT generate explanatory text through an LLM that contradicts or overrides the structured trace.
6. WHERE an LLM narration is used to present a decision explanation in plain language, THE ApprovalIQ_System SHALL constrain the narration to only describe what the Decision_Trace already states, and SHALL clearly label the output as `"Plain-language summary"` to distinguish it from the structured trace.
7. THE ApprovalIQ_System SHALL display the `ruleSetVersion` and `engineVersion` alongside each decision explanation so officers know which rule set produced the determination.

---

### Requirement 3: Submission Risk Score

**User Story:** As an officer, I want to see a submission risk score for each application that tells me whether the document pack is likely to need attention, so that I can prioritise my review queue efficiently.

#### Acceptance Criteria

1. WHEN a `DocumentRiskSignals` object is available, THE Risk_Engine SHALL compute a `submissionRisk` object containing: `score` (0–100 integer), `level` (one of `"low"`, `"medium"`, `"high"`), `factors` (array of `{name, impact, reason, evidence}`), and `topIssue` (string or null).
2. THE Risk_Engine SHALL derive `submissionRisk` exclusively from signals in the `DocumentRiskSignals` interface: `blockingCount`, `warningCount`, `missingMandatoryCount`, `lowConfidenceCount`, `verifiedFieldCount`, `readinessOverall`, `status`, `topIssue`, and `evidence`.
3. THE Risk_Engine SHALL assign `level: "high"` when `submissionRisk.score >= 70`, `level: "medium"` when `score >= 40`, and `level: "low"` when `score < 40`.
4. WHEN `blockingCount > 0`, THE Risk_Engine SHALL add a factor named `"Blocking contradictions"` with a stated `impact` and `reason` referencing the blocking count.
5. WHEN `missingMandatoryCount > 0`, THE Risk_Engine SHALL add a factor named `"Missing mandatory documents"` with a stated `impact` and `reason` referencing the count.
6. WHEN `readinessOverall < 60`, THE Risk_Engine SHALL add a factor named `"Low readiness score"` with a stated `impact` and `reason` referencing the readiness value.
7. WHEN `lowConfidenceCount > 0`, THE Risk_Engine SHALL add a factor named `"Low-confidence extractions"` with a stated `impact` and `reason`.
8. THE Risk_Engine SHALL return at least one factor in every `submissionRisk` result — including a neutral factor `"No significant risk signals"` when no elevated signals are present.
9. THE Risk_Engine SHALL produce a `topIssue` value equal to the `reason` of the highest-impact factor, or null when no factors are present.
10. THE ApprovalIQ_System SHALL display each factor with its name, impact, and reason in the officer-facing UI so that every point of the score is explainable.

---

### Requirement 4: Regulatory Scrutiny Score

**User Story:** As an officer, I want to see a regulatory scrutiny level for each application that reflects process complexity, so that I understand which cases require deeper regulatory review due to their inherent complexity.

#### Acceptance Criteria

1. WHEN a `BusinessProfile` and `SimulationResult` are available, THE Risk_Engine SHALL compute a `regulatoryScrutiny` object containing: `level` (one of `"low"`, `"medium"`, `"high"`) and `factors` (array of `{name, reason}`).
2. THE Risk_Engine SHALL derive `regulatoryScrutiny` from the business profile and simulation result ONLY — it SHALL NOT use document validation signals (`DocumentRiskSignals`) for this score.
3. WHEN a `BusinessProfile` has `hasBoiler: true`, THE Risk_Engine SHALL include a factor named `"Boiler installation"` in `regulatoryScrutiny.factors`; adding this factor SHALL increment the total factor count used for determining the scrutiny level.
4. WHEN a `BusinessProfile` has `hazardousMaterials: true` or `generatesHazardousWaste: true`, THE Risk_Engine SHALL include a factor named `"Hazardous process or waste"` in `regulatoryScrutiny.factors`.
5. WHEN the count of applicable approvals in a `SimulationResult` (approvals where `applies: true`) is three or more, THE Risk_Engine SHALL include a factor named `"Multiple applicable approvals"` in `regulatoryScrutiny.factors`.
6. WHEN a `BusinessProfile` has `employees >= 100`, THE Risk_Engine SHALL include a factor named `"Large workforce"` in `regulatoryScrutiny.factors`.
7. THE Risk_Engine SHALL assign `regulatoryScrutiny.level: "high"` when three or more factors are present, `"medium"` when one or two factors are present, and `"low"` when no factors are present.
8. THE ApprovalIQ_System SHALL display the disclaimer `"Regulatory scrutiny reflects process complexity, not wrongdoing."` in every UI location that shows the regulatory scrutiny score.
9. THE ApprovalIQ_System SHALL display `submissionRisk` and `regulatoryScrutiny` as two completely separate, distinctly labelled sections in the UI — they SHALL NOT be combined into a single score or merged label.
10. THE Risk_Engine SHALL never present regulatory scrutiny factors as evidence of suspicion, fraud, or non-compliance in any label, tooltip, or explanatory text.

---

### Requirement 5: Officer Dashboard and Prioritised Queue

**User Story:** As an officer, I want a professional dashboard showing a prioritised queue of applications, so that I know what to review first and why each application is prioritised in its position.

#### Acceptance Criteria

1. THE ApprovalIQ_System SHALL provide an officer dashboard page at `/officer` that displays a prioritised queue of `OfficerQueueItem` entries.
2. WHEN the officer dashboard loads, THE ApprovalIQ_System SHALL sort `OfficerQueueItem` entries by: (1) status `"pending"` with blocking issues first, (2) higher `submissionRisk` score descending, (3) higher `regulatoryScrutiny` level descending, (4) earlier submission date (days pending ascending).
3. EACH `OfficerQueueItem` row SHALL display: `companyName`, `applicationId`, `status`, `submissionRisk` score and level, `regulatoryScrutiny` level, `readinessScore`, `topIssue`, and `daysPending`.
4. THE ApprovalIQ_System SHALL provide a "Why prioritised?" explanation for each queue item that states which prioritisation rule placed it at its current position.
5. WHEN the regulatory scrutiny level is displayed in the queue, THE ApprovalIQ_System SHALL display the disclaimer `"Reflects process complexity, not wrongdoing."` as a tooltip or inline note.
6. THE officer dashboard SHALL use the existing design system (shadcn/ui components, Tailwind CSS, and colour tokens already in the project) without introducing new UI libraries.
7. THE ApprovalIQ_System SHALL display the queue status as `"pending"`, `"clarification-requested"`, `"approved"`, or `"rejected"` using the existing `OfficerQueueItem.status` field values.
8. WHEN no applications are in the queue, THE ApprovalIQ_System SHALL display an empty-state message rather than an empty table.
9. THE ApprovalIQ_System SHALL show the count of pending and total applications as a summary at the top of the dashboard.

---

### Requirement 6: Application Detail and Officer Decision Workflow

**User Story:** As an officer, I want to open an application from the queue and see all relevant details in one view, then take a structured decision action with a reason, so that every decision is deliberate, informed, and auditable.

#### Acceptance Criteria

1. WHEN an officer clicks an application row in the queue, THE ApprovalIQ_System SHALL navigate to an application detail page at `/officer/[applicationId]`.
2. THE application detail page SHALL display: applicant details, applicable approvals list, submission risk breakdown (all factors), regulatory scrutiny breakdown (all factors with disclaimer), readiness score, `topIssue`, evidence/citations from applicable approval traces, and the full Audit_Trail for the application.
3. THE ApprovalIQ_System SHALL display any system recommendation labelled explicitly as `"Advisory recommendation"` and visually distinguished from the officer's decision actions.
6. THE application detail page SHALL provide four decision action buttons: `"Approve"`, `"Request Clarification"`, `"Reject"`, and `"Override"`; THE ApprovalIQ_System SHALL return HTTP 400 for any validation failure including missing reasons on `"Reject"` or `"Override"`, regardless of session or authentication state.
7. WHEN an officer submits a decision action, THE ApprovalIQ_System SHALL create an Audit_Trail event with the officer's identity, action type, timestamp, and reason (where applicable).
8. WHEN the officer views citations in the application detail, THE ApprovalIQ_System SHALL display each citation's `verificationStatus` — `"verified"` or `"Needs review"` — alongside the citation text.
9. WHEN a citation is unavailable for an applicable approval, THE ApprovalIQ_System SHALL display `"Evidence unavailable"` rather than omitting the field.
10. THE application detail page SHALL remain both readable and functional when all citations are unavailable or simulation results are empty — IF the page cannot be both readable and functional, THE ApprovalIQ_System SHALL fail gracefully with a clear error message rather than displaying a functional but unreadable interface.

---

### Requirement 7: Audit Trail

**User Story:** As an officer or auditor, I want a complete, chronological record of every action taken on an application, so that I can answer "what happened, when, why, and who did it?" for any application at any time.

#### Acceptance Criteria

1. THE Audit_Trail SHALL record a structured event for every important action, containing: `id`, `applicationId`, `timestamp` (ISO 8601), `actor` (identity string), `actorType` (one of `"system"` or `"officer"`), `action` (action type string), `reason` (string or null), and `details` (free-form object).
2. THE ApprovalIQ_System SHALL create a `"system"` audit event with action `"evaluation"` when the rules engine evaluates an application.
3. THE ApprovalIQ_System SHALL create a `"system"` audit event with action `"risk_assessment"` when risk scores are computed.
4. THE ApprovalIQ_System SHALL create a `"system"` audit event with action `"dry_run"` when a document dry-run is executed.
5. IF a citation is missing at decision time, THE ApprovalIQ_System SHALL create a `"system"` audit event with action `"citation_missing"` and record the missing clauseId in `details`.
6. THE ApprovalIQ_System SHALL create an `"officer"` audit event with action `"viewed"` when an officer opens an application detail page.
7. THE ApprovalIQ_System SHALL create an `"officer"` audit event with action `"approved"`, `"rejected"`, `"clarification_requested"`, or `"overridden"` when an officer submits a decision, capturing the reason in the `reason` field.
8. THE Audit_Trail SHALL be displayed in chronological ascending order (oldest first) in the application detail view.
9. THE Audit_Trail SHALL be append-only — no event SHALL be modified or deleted after creation.
10. THE ApprovalIQ_System SHALL display audit events with human-readable labels for `actorType` and `action`, mapping `"system"` to `"System"` and officer action codes to plain English descriptions.

---

### Requirement 8: Seed Businesses for Demo

**User Story:** As a demo presenter, I want 12–15 realistic fictional business profiles pre-loaded, so that I can demonstrate the full system flow with varied scenarios that show different approval combinations and risk levels.

#### Acceptance Criteria

1. THE ApprovalIQ_System SHALL include between 12 and 15 fictional seed business records in a static JSON fixture file at `approvaliq-app/data/seed/businesses.json`; both the file's existence and a record count of 12–15 must be satisfied for this requirement to be met.
2. EACH seed business SHALL contain all fields required by the `BusinessProfile` type: `id`, `companyName`, `industry`, `district`, `areaSqFt`, `investmentCrore`, `employees`, `usesPower`, `powerLoadHP`, `hasBoiler`, `boilerCapacityLitres`, `hazardousMaterials`, `generatesHazardousWaste`, `annualTurnoverLakh`, `projectStage`.
3. THE seed businesses SHALL vary across at least four different industries, at least three different districts, and at least two different project stages.
4. AT LEAST two seed businesses SHALL have characteristics placing them near meaningful rule thresholds (e.g. employee counts near the Factories Act threshold, investment values near MSME classification boundaries).
5. AT LEAST two seed businesses SHALL have `hasBoiler: true` and at least two SHALL have `hazardousMaterials: true` or `generatesHazardousWaste: true`, to demonstrate regulatory scrutiny variation.
6. THE ApprovalIQ_System SHALL evaluate seed businesses using the same Rules_Engine used for live profiles — their applicable approvals SHALL NOT be hardcoded.
7. THE seed businesses SHALL use clearly fictional company names that could not be confused with real registered entities.
8. THE seed businesses SHALL use real Indian district names and realistic industry categories consistent with the existing rules engine's supported sectors.

---

### Requirement 9: Maitri Demo Handoff API

**User Story:** As a demo presenter, I want a functional API endpoint that packages an evaluated application for handoff to the Maitri downstream service, so that the demo shows an end-to-end integration flow without connecting to any real government system.

#### Acceptance Criteria

1. THE ApprovalIQ_System SHALL expose a Next.js API route at `POST /api/demo-handoff` that accepts an `applicationId` and returns a structured Demo_Handoff_Package.
2. THE Demo_Handoff_Package SHALL contain: applicant details, `BusinessProfile`, applicable approvals list (applies: true only), required documents (deduplicated), clause IDs referenced, readiness score, submission risk object, regulatory scrutiny object, audit summary (count of events by type), and rule/version metadata (`engineVersion`, `ruleSetVersion`).
3. WHEN the `applicationId` in the request body is missing or blank, THE ApprovalIQ_System SHALL return a 400 response with `{ "error": { "code": "MISSING_APPLICATION_ID", "message": "applicationId is required" } }`.
4. WHEN the `applicationId` is provided but does not correspond to a known application in a demo handoff request, THE ApprovalIQ_System SHALL return a 404 response with `{ "error": { "code": "NOT_FOUND", "message": "Application not found" } }`.
5. THE ApprovalIQ_System SHALL return all Demo_Handoff_Package responses as valid JSON with HTTP 200.
6. THE ApprovalIQ_System SHALL display the disclaimer `"Demo integration — no data is transmitted to a live government system."` in the UI wherever the demo handoff feature is presented to the user.
7. THE demo handoff API SHALL NOT make any outbound HTTP requests to external government URLs or live third-party systems.
8. THE Demo_Handoff_Package SHALL include a `generatedAt` ISO 8601 timestamp and a `disclaimer` field set to `"Demo integration — no data is transmitted to a live government system."`.

---

### Requirement 10: End-to-End Officer Flow Integration

**User Story:** As a demo presenter, I want the complete officer flow to work end-to-end without manual intervention, so that I can demonstrate the full system in a single uninterrupted walkthrough.

#### Acceptance Criteria

1. THE ApprovalIQ_System SHALL support a complete demo flow: selecting a seed business → viewing the prioritised officer queue → opening an application detail → reviewing risk scores and evidence → reading an advisory recommendation → submitting an officer decision → verifying the audit trail updated.
2. WHEN an officer decision is submitted on the application detail page, THE ApprovalIQ_System SHALL immediately reflect the updated status and new audit event in the UI without requiring a full page reload or manual data refresh.
3. THE officer queue SHALL reflect the current status of each application — an approved or rejected application SHALL be visually distinguished from pending applications.
4. THE ApprovalIQ_System SHALL be navigable entirely within the Next.js frontend — the officer flow SHALL NOT require direct API calls from the user or manual data loading steps.
5. WHEN transitioning from the officer queue to the application detail and back, THE ApprovalIQ_System SHALL preserve the queue state so the officer returns to the same sorted view, provided the officer had previously established a queue view in the same session.
6. THE ApprovalIQ_System SHALL handle the case where risk scores, citations, or simulation results are unavailable for a specific application by displaying appropriate `"Evidence unavailable"` or `"Needs review"` placeholders rather than crashing or showing blank sections.


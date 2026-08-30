// -----------------------------------------------------------------------------
// lib/officer/queue.ts — demo officer queue.
//
// No new fake data: this module only picks WHICH seed business and document
// pack stand in for each demo application (A10293 / A10294 / A10295).
// Everything else — simulation approvals, dry-run readiness, document risk
// signals, submission risk, regulatory scrutiny, and the audit trail — is
// computed by the existing engines in lib/engine, lib/documents, lib/risk,
// and lib/store.
// -----------------------------------------------------------------------------

import type {
  AuditEvent,
  BusinessProfile,
  DryRunResult,
  OfficerQueueItem,
  RequiredDocument,
  RiskAssessment,
  RiskTier,
  SimulationResult,
} from "@/types";
import { evaluateApprovals, calculateSimulationSummary } from "@/lib/engine";
import {
  extractDocumentFields,
  getUploadedDocuments,
  detectContradictions,
  findMissingDocuments,
  calculateReadinessScore,
  deriveStatus,
  getDocumentRiskSignals,
} from "@/lib/documents";
import {
  computeSubmissionRisk,
  computeRegulatoryScrutiny,
} from "@/lib/risk/risk";
import { appendAuditEvent, getAuditTrail } from "@/lib/store/auditStore";
import type { AuditRecord } from "@/lib/store/auditStore";
import { seedBusinesses } from "@/lib/engine/changeImpact";

// -----------------------------------------------------------------------------
// Demo applications — a small fixed set backed by real seed businesses and
// real document packs. This is the ONLY place in the file that "invents" data.
// -----------------------------------------------------------------------------

const DEMO_APPLICATIONS: {
  applicationId: string;
  businessId: string;
  documentPack: string;
}[] = [
  { applicationId: "A10293", businessId: "seed-06", documentPack: "demo-mismatch" },
  { applicationId: "A10294", businessId: "seed-02", documentPack: "demo-corrected" },
  { applicationId: "A10295", businessId: "seed-03", documentPack: "demo-mismatch" },
];

// -----------------------------------------------------------------------------
// Snapshot builder — runs the real simulation + dry-run + risk pipeline for
// one demo application entry.
// -----------------------------------------------------------------------------

function buildApplicationSnapshot(
  app: (typeof DEMO_APPLICATIONS)[number]
): ApplicationSnapshot {
  // 1. Find the seed business. Fail loudly if the demo list drifts from the
  //    seed data — this should never happen.
  const profile = seedBusinesses.find((b) => b.id === app.businessId);
  if (!profile) {
    throw new Error(
      `Seed business "${app.businessId}" not found for demo application ${app.applicationId}`
    );
  }

  // 2. Simulation approvals for this business.
  const approvals = evaluateApprovals(profile);

  // 3. Required documents, mirroring app/api/dryrun/route.ts's comment:
  //      simulation.approvals.filter(a => a.applies).flatMap(a => a.requiredDocuments)
  const requiredDocuments: RequiredDocument[] = approvals
    .filter((a) => a.applies)
    .flatMap((a) => a.requiredDocuments);

  // 4. Same dry-run pipeline as app/api/dryrun/route.ts, using the pack picked
  //    for this demo application and the live required documents from step 3.
  const extractedFields = extractDocumentFields(app.documentPack);
  const uploadedDocuments = getUploadedDocuments(app.documentPack);
  const contradictions = detectContradictions(extractedFields);
  const { missing, expected, found } = findMissingDocuments(
    requiredDocuments,
    uploadedDocuments
  );
  const readiness = calculateReadinessScore({
    extractedFields,
    requiredDocuments,
    uploadedDocuments,
    contradictions,
  });
  const status = deriveStatus(contradictions, missing);

  const dryRunResult: DryRunResult = {
    applicationId: app.applicationId,
    documentPack: app.documentPack,
    extractedFields,
    documentsExpected: expected,
    documentsFound: found,
    missingDocuments: missing,
    contradictions,
    readiness,
    predictedQueries: [], // query prediction is not part of this module
    status,
    extractionMode: "fixture",
  };

  // 5. Document risk signals.
  const signals = getDocumentRiskSignals(dryRunResult);

  // 6. Submission risk from the signals, and regulatory scrutiny from the
  //    profile + a SimulationResult-shaped object (built the same way the API
  //    routes build it).
  const submissionRisk = computeSubmissionRisk(signals);

  const simulationResult: SimulationResult = {
    profile,
    approvals,
    summary: calculateSimulationSummary(approvals),
    engineVersion: "demo-2026.08",
    ruleSetVersion: "2026.08.1",
    generatedAt: new Date().toISOString(),
  };
  const regulatoryScrutiny = computeRegulatoryScrutiny(profile, simulationResult);

  return {
    applicationId: app.applicationId,
    businessId: app.businessId,
    profile,
    dryRunResult,
    submissionRisk,
    regulatoryScrutiny,
  };
}

// -----------------------------------------------------------------------------
// Types & small helpers.
// -----------------------------------------------------------------------------
/** Everything computed about one demo application, pre-mapping to UI shapes. */
interface ApplicationSnapshot {
  applicationId: string;
  businessId: string;
  profile: BusinessProfile;
  dryRunResult: DryRunResult;
  submissionRisk: RiskAssessment["submissionRisk"];
  regulatoryScrutiny: RiskAssessment["regulatoryScrutiny"];
}

/**
 * Maps an internal AuditRecord to the shared AuditEvent shape from types/.
 * AuditRecord.action is a narrow union assignable to AuditEvent's free string,
 * so this is a plain field copy — no cast needed. AuditRecord has a structured
 * `details` bag rather than AuditEvent's flat `detail?: string`, so a non-empty
 * bag is stringified for the event view.
 */
function toAuditEvent(record: AuditRecord): AuditEvent {
  return {
    timestamp: record.timestamp,
    actor: record.actor,
    action: record.action,
    reason: record.reason ?? undefined,
    detail:
      record.details && Object.keys(record.details).length > 0
        ? JSON.stringify(record.details)
        : undefined,
  };
}

const RISK_RANK: Record<RiskTier, number> = { low: 0, medium: 1, high: 2 };

function riskRank(tier: RiskTier): number {
  return RISK_RANK[tier];
}

/** Higher of two risk tiers (low < medium < high). */
function higherRiskTier(a: RiskTier, b: RiskTier): RiskTier {
  return riskRank(a) >= riskRank(b) ? a : b;
}

/** Server-side enforcement of the 10-character reason rule. */
function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    throw new Error(
      "A reason of at least 10 characters is required and will be recorded in the audit trail."
    );
  }
  return trimmed;
}

// -----------------------------------------------------------------------------
// Queue construction & sorting.
// -----------------------------------------------------------------------------

/**
 * Maps a snapshot to the OfficerQueueItem the officer UI renders.
 * topIssue is attached by computeSubmissionRisk at runtime but not declared
 * on the RiskAssessment type, so it is read through a narrow intersection
 * assertion.
 */
function buildQueueItem(snapshot: ApplicationSnapshot): OfficerQueueItem {
  const { applicationId, profile, dryRunResult, submissionRisk, regulatoryScrutiny } =
    snapshot;

  const submissionRiskWithIssue = submissionRisk as RiskAssessment["submissionRisk"] & {
    topIssue: string | null;
  };

  // Advisory recommendation — the officer decides; the system suggests.
  // "Advisory" in the UI. This framing is what makes this deployable
  // rather than alarming to a government audience.
  const topIssue = submissionRiskWithIssue.topIssue ?? null;
  const hasBlockingIssue = dryRunResult.status === "blocked";
  const recommendation = hasBlockingIssue && topIssue
    ? {
        action: "request-clarification",
        rationale: topIssue,
        advisoryOnly: true as const,
      }
    : undefined;

  return {
    applicationId,
    companyName: profile.companyName ?? "Unknown",
    district: profile.district,
    priority: higherRiskTier(submissionRisk.level, regulatoryScrutiny.level),
    submissionRisk: submissionRisk.score,
    regulatoryScrutiny: regulatoryScrutiny.level,
    readinessScore: dryRunResult.readiness.overall,
    topIssue,
    evidence: dryRunResult.contradictions[0]?.documents ?? [],
    status: statusFromAudit(applicationId),
    recommendation,
  };
}

/**
 * Latest audit action drives the officer-visible status. "viewed" and any
 * other non-decision actions leave the application pending until a decision
 * is recorded.
 */
function statusFromAudit(applicationId: string): OfficerQueueItem["status"] {
  const audit = getAuditTrail(applicationId);
  const latest = audit[audit.length - 1];
  if (!latest) return "pending";
  switch (latest.action) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "clarification_requested":
      return "clarification-requested";
    default:
      return "pending";
  }
}

/**
 * Full officer queue, sorted by triage importance:
 *   1. Blocked applications first (dry-run status === "blocked").
 *   2. Then submission risk score, descending.
 *   3. Then regulatory scrutiny level, descending.
 */
export function getOfficerQueue(): OfficerQueueItem[] {
  const ranked = DEMO_APPLICATIONS.map((app) => {
    const snapshot = buildApplicationSnapshot(app);
    return {
      item: buildQueueItem(snapshot),
      blocked: snapshot.dryRunResult.status === "blocked",
    };
  });

  ranked.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    if (a.item.submissionRisk !== b.item.submissionRisk) {
      return b.item.submissionRisk - a.item.submissionRisk;
    }
    return riskRank(b.item.regulatoryScrutiny) - riskRank(a.item.regulatoryScrutiny);
  });

  return ranked.map((r) => r.item);
}

// -----------------------------------------------------------------------------
// Detail view.
// -----------------------------------------------------------------------------

export function getOfficerDetail(applicationId: string): {
  queueItem: OfficerQueueItem;
  risk: RiskAssessment;
  audit: AuditEvent[];
} | null {
  const demoApp = DEMO_APPLICATIONS.find((a) => a.applicationId === applicationId);
  if (!demoApp) return null; // legitimate miss — lookup, not an error

  const snapshot = buildApplicationSnapshot(demoApp);

  // Reuse the queue (and its sort logic) rather than duplicating it.
  const queueItem = getOfficerQueue().find(
    (item) => item.applicationId === applicationId
  );
  if (!queueItem) return null;

  let audit = getAuditTrail(applicationId).map(toAuditEvent);

  // First-ever view: log it so system activity is audited too, not just
  // officer decisions.
  if (audit.length === 0) {
    appendAuditEvent({
      applicationId,
      actor: "system",
      actorType: "system",
      action: "viewed",
      reason: null,
      details: {},
      timestamp: new Date().toISOString(),
    });
    audit = getAuditTrail(applicationId).map(toAuditEvent);
  }

  return {
    queueItem,
    risk: {
      submissionRisk: snapshot.submissionRisk,
      regulatoryScrutiny: snapshot.regulatoryScrutiny,
    },
    audit,
  };
}

// -----------------------------------------------------------------------------
// Officer decisions — server-side enforcement of the 10-character reason rule
// for every action that records a reason in the audit trail.
// -----------------------------------------------------------------------------

export function approveApplication(applicationId: string, actor: string): AuditRecord {
  return appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "approved",
    reason: null,
    details: {},
    timestamp: new Date().toISOString(),
  });
}

export function requestClarification(
  applicationId: string,
  actor: string,
  reason: string
): AuditRecord {
  return appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "clarification_requested",
    reason: requireReason(reason),
    details: {},
    timestamp: new Date().toISOString(),
  });
}

export function rejectApplication(
  applicationId: string,
  actor: string,
  reason: string
): AuditRecord {
  return appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "rejected",
    reason: requireReason(reason),
    details: {},
    timestamp: new Date().toISOString(),
  });
}

export function overrideRecommendation(
  applicationId: string,
  actor: string,
  reason: string
): AuditRecord {
  return appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "overridden",
    reason: requireReason(reason),
    details: {},
    timestamp: new Date().toISOString(),
  });
}
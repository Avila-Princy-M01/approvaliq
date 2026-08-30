/**
 * lib/officer/audit.ts — Officer decisions & audit trail.
 *
 * Every officer action is recorded. System events are also logged
 * (simulation-run, executed, citation-missing, dry-run, explanation-rejected,
 * rule-version-applied). A trail that records what the system did —
 * including when it refused to answer — is far more compelling than one
 * that only logs button clicks.
 *
 * In-memory store (a module-level Map) is fine for this prototype.
 * Note in the pitch: "append-only in this prototype, designed for a
 * write-once audit store in production."
 */

import type { AuditEvent } from "@/types";
import {
  appendAuditEvent,
  getAuditTrail as _getAuditTrail,
} from "@/lib/store/auditStore";
import type { AuditRecord } from "@/lib/store/auditStore";

// Re-export the type for consumers
export type { AuditRecord };

// ---------------------------------------------------------------------------
// Server-side enforcement of the 10-character reason rule.
// Frontend validation is a convenience; backend enforcement is the actual control.
// ---------------------------------------------------------------------------

function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    throw new Error(
      "A reason of at least 10 characters is required and will be recorded in the audit trail."
    );
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Officer decision functions
// ---------------------------------------------------------------------------

/**
 * Approve an application. No reason required for approval.
 * Returns the full audit trail after the event is appended.
 */
export function approveApplication(
  applicationId: string,
  actor: string
): AuditEvent[] {
  appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "approved",
    reason: null,
    details: {},
    timestamp: new Date().toISOString(),
  });

  return getAuditTrail(applicationId);
}

/**
 * Request clarification from the applicant. Requires a reason of at least 10 characters.
 * Returns the full audit trail after the event is appended.
 */
export function requestClarification(
  applicationId: string,
  actor: string,
  reason: string
): AuditEvent[] {
  const validatedReason = requireReason(reason);

  appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "clarification_requested",
    reason: validatedReason,
    details: {},
    timestamp: new Date().toISOString(),
  });

  return getAuditTrail(applicationId);
}

/**
 * Reject an application. Requires a reason of at least 10 characters.
 * Returns the full audit trail after the event is appended.
 */
export function rejectApplication(
  applicationId: string,
  actor: string,
  reason: string
): AuditEvent[] {
  const validatedReason = requireReason(reason);

  appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "rejected",
    reason: validatedReason,
    details: {},
    timestamp: new Date().toISOString(),
  });

  return getAuditTrail(applicationId);
}

/**
 * Override the system recommendation. Requires a reason of at least 10 characters.
 * Returns the full audit trail after the event is appended.
 */
export function overrideRecommendation(
  applicationId: string,
  actor: string,
  reason: string
): AuditEvent[] {
  const validatedReason = requireReason(reason);

  appendAuditEvent({
    applicationId,
    actor,
    actorType: "officer",
    action: "overridden",
    reason: validatedReason,
    details: {},
    timestamp: new Date().toISOString(),
  });

  return getAuditTrail(applicationId);
}

// ---------------------------------------------------------------------------
// System event logging (not just human decisions)
// ---------------------------------------------------------------------------

/**
 * Log a system event. These are auto-logged events that record what the
 * system did, including when it refused to answer.
 */
export function logSystemEvent(
  applicationId: string,
  action: AuditRecord["action"],
  details: Record<string, unknown>
): void {
  appendAuditEvent({
    applicationId,
    actor: "system",
    actorType: "system",
    action,
    reason: null,
    details,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log a citation-missing event (when a rule references a clause ID not in the store).
 */
export function logCitationMissing(
  applicationId: string,
  clauseId: string,
  ruleId: string
): void {
  logSystemEvent(applicationId, "citation_missing", {
    clauseId,
    ruleId,
  });
}

/**
 * Get the audit trail for an application, converted to the shared AuditEvent shape.
 */
export function getAuditTrail(applicationId: string): AuditEvent[] {
  return _getAuditTrail(applicationId).map((record) => ({
    timestamp: record.timestamp,
    actor: record.actor,
    action: record.action,
    reason: record.reason ?? undefined,
    detail:
      record.details && Object.keys(record.details).length > 0
        ? JSON.stringify(record.details)
        : undefined,
  }));
}

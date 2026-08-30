/**
 * auditStore.ts — In-memory audit trail store
 *
 * Maintains a Map of applicationId → AuditRecord[] for the demo.
 * Events are append-only: never mutated or removed.
 */

import type { AuditEvent } from "../../types/index";

/**
 * Internal audit record — superset of AuditEvent from types/index.ts.
 * Adds a stable id, actorType discriminator, typed action union, and
 * a structured details bag not present on the shared AuditEvent type.
 */
export interface AuditRecord extends Omit<AuditEvent, "action" | "reason" | "detail"> {
  id: string;
  applicationId: string;
  timestamp: string; // ISO 8601
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

/** applicationId → ordered list of audit records (insertion order = chronological) */
const auditMap = new Map<string, AuditRecord[]>();

/**
 * Appends a new audit event for an application.
 *
 * - Generates a unique id with the pattern `audit-${Date.now()}-${random}`.
 * - Creates the array for the applicationId if it does not exist yet.
 * - Pushes the new record; never mutates existing entries.
 *
 * @param event  All AuditRecord fields except `id` (generated here).
 * @returns      The complete record including the generated id.
 */
export function appendAuditEvent(event: Omit<AuditRecord, "id">): AuditRecord {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record: AuditRecord = { ...event, id };

  const existing = auditMap.get(event.applicationId);
  if (existing) {
    existing.push(record);
  } else {
    auditMap.set(event.applicationId, [record]);
  }

  return record;
}

/**
 * Returns the full audit trail for an application, sorted ascending by
 * `timestamp` (ISO 8601 strings compare correctly with localeCompare).
 *
 * @param applicationId  The application to look up.
 * @returns              Sorted array of AuditRecord, or [] if not found.
 */
export function getAuditTrail(applicationId: string): AuditRecord[] {
  const records = auditMap.get(applicationId);
  if (!records || records.length === 0) {
    return [];
  }
  // Return a sorted copy; do not mutate the stored array.
  return [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

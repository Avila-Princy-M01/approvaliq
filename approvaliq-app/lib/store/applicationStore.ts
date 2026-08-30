/**
 * applicationStore.ts — In-memory application lifecycle store
 *
 * Maintains a Map of applicationId → ApplicationRecord for the demo.
 * State lives in Node.js module scope and persists across requests
 * within a single server process.
 */

import type {
  BusinessProfile,
  SimulationResult,
  DryRunResult,
  RiskAssessment,
  OfficerQueueItem,
} from "@/types";
import { simulate } from "@/lib/simulation/simulate";
import {
  computeSubmissionRisk,
  computeRegulatoryScrutiny,
} from "@/lib/risk/risk";

import { appendAuditEvent } from "./auditStore";

// ---------------------------------------------------------------------------
// Internal record type
// ---------------------------------------------------------------------------

interface ApplicationRecord {
  applicationId: string;
  profile: BusinessProfile;
  simulationResult: SimulationResult;
  dryRunResult: DryRunResult | null;
  riskAssessment: RiskAssessment;
  status: OfficerQueueItem["status"];
  recommendation: string | null;
  submittedAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Module-level store
// ---------------------------------------------------------------------------

const applicationMap = new Map<string, ApplicationRecord>();
let seeded = false;

// ---------------------------------------------------------------------------
// Lazy seeding
// ---------------------------------------------------------------------------

function ensureSeeded(): void {
  if (seeded) return;
  seeded = true;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const businesses: BusinessProfile[] = require("@/data/seed/businesses.json");

  for (const profile of businesses) {
    const applicationId = profile.id ?? `app-${Math.random().toString(36).slice(2)}`;

    // Run simulation
    const simulationResult = simulate(profile);

    // Run a minimal dry-run (no real document pack for seed data)
    const dryRunResult: DryRunResult | null = null;

    // Compute risk scores
    const defaultSignals = {
      blockingCount: 0,
      warningCount: 0,
      missingMandatoryCount: 0,
      lowConfidenceCount: 0,
      verifiedFieldCount: 0,
      readinessOverall: 85,
      status: "ready" as const,
      topIssue: null,
      evidence: [],
    };
    const submissionRisk = computeSubmissionRisk(defaultSignals);
    const regulatoryScrutiny = computeRegulatoryScrutiny(
      profile,
      simulationResult
    );

    const now = new Date().toISOString();
    const record: ApplicationRecord = {
      applicationId,
      profile,
      simulationResult,
      dryRunResult,
      riskAssessment: { submissionRisk, regulatoryScrutiny },
      status: "pending",
      recommendation: null,
      submittedAt: now,
      updatedAt: now,
    };

    applicationMap.set(applicationId, record);

    // Audit events
    appendAuditEvent({
      applicationId,
      actor: "system",
      actorType: "system",
      action: "evaluation",
      reason: null,
      details: {
        engineVersion: simulationResult.engineVersion,
        ruleSetVersion: simulationResult.ruleSetVersion,
      },
      timestamp: now,
    });

    appendAuditEvent({
      applicationId,
      actor: "system",
      actorType: "system",
      action: "risk_assessment",
      reason: null,
      details: {
        submissionRisk: submissionRisk.score,
        regulatoryScrutiny: regulatoryScrutiny.level,
      },
      timestamp: now,
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getApplication(id: string): ApplicationRecord | null {
  ensureSeeded();
  return applicationMap.get(id) ?? null;
}

export function getAllApplications(): ApplicationRecord[] {
  ensureSeeded();
  return Array.from(applicationMap.values());
}

export function setApplication(record: ApplicationRecord): void {
  ensureSeeded();
  applicationMap.set(record.applicationId, record);
}

export function updateApplicationStatus(
  id: string,
  status: OfficerQueueItem["status"],
  recommendation?: string
): boolean {
  ensureSeeded();
  const record = applicationMap.get(id);
  if (!record) return false;

  record.status = status;
  record.updatedAt = new Date().toISOString();
  if (recommendation !== undefined) {
    record.recommendation = recommendation;
  }

  return true;
}

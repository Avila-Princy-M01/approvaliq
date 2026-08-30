/**
 * lib/officer/risk.ts — Dual risk scoring.
 *
 * Two separate scores. Never one blended "AI risk" number.
 * The conflation is the single most common conceptual error in
 * compliance tools, and a domain expert will call it out.
 *
 * A. Submission-quality risk — "is this file in good order?"
 * B. Regulatory scrutiny tier — "how complex is this case?"
 *
 * "Regulatory scrutiny reflects process complexity, not wrongdoing."
 * That one sentence pre-empts the strongest objection to the whole feature.
 */

import type {
  Approval,
  BusinessProfile,
  DocumentRiskSignals,
  RiskAssessment,
  RiskFactor,
  RiskTier,
  SimulationResult,
} from "@/types";
import {
  computeSubmissionRisk,
  computeRegulatoryScrutiny,
} from "@/lib/risk/risk";

/**
 * Assess dual risk for an application.
 *
 * @param approvals - The approval decisions for this application
 * @param profile - The business profile
 * @param docSignals - Document risk signals from Avila's integration
 * @returns RiskAssessment with separate submissionRisk and regulatoryScrutiny
 */
export function assessRisk(
  approvals: Approval[],
  profile: BusinessProfile,
  docSignals: DocumentRiskSignals
): RiskAssessment {
  // A. Submission-quality risk — "is this file in good order?"
  const submissionRisk = computeSubmissionRisk(docSignals);

  // B. Regulatory scrutiny tier — "how complex is this case?"
  // Build a minimal SimulationResult for the scrutiny computation
  const simulationResult: SimulationResult = {
    profile,
    approvals,
    summary: {
      applicableApprovalCount: approvals.filter((a) => a.applies).length,
      uniqueDocumentCount: 0,
      criticalPathDays: 0,
      sumOfAllDays: 0,
      indicativeFeeTotal: 0,
      highestRiskTier: "low",
      criticalPath: [],
      bottleneckApprovalId: null,
      unverifiedFieldCount: 0,
    },
    engineVersion: "demo-2026.08",
    ruleSetVersion: "2026.08.1",
    generatedAt: new Date().toISOString(),
  };

  const regulatoryScrutiny = computeRegulatoryScrutiny(
    profile,
    simulationResult
  );

  return {
    submissionRisk,
    regulatoryScrutiny,
  };
}

/**
 * Get a human-readable summary of the submission risk.
 */
export function summarizeSubmissionRisk(
  risk: RiskAssessment["submissionRisk"]
): string {
  if (risk.factors.length === 0 || risk.score === 0) {
    return "No significant submission quality issues detected.";
  }
  const topFactors = risk.factors
    .filter((f) => (f.points ?? 0) > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 3);
  if (topFactors.length === 0) {
    return "No significant submission quality issues detected.";
  }
  return `Submission quality is ${risk.level} risk (${risk.score}/100). Key issues: ${topFactors.map((f) => f.reason).join("; ")}.`;
}

/**
 * Get a human-readable summary of the regulatory scrutiny.
 * Note: "Regulatory scrutiny reflects process complexity, not wrongdoing."
 */
export function summarizeRegulatoryScrutiny(
  scrutiny: RiskAssessment["regulatoryScrutiny"]
): string {
  if (scrutiny.factors.length === 0) {
    return "This is a straightforward regulatory case with no additional complexity factors.";
  }
  return `Regulatory scrutiny level: ${scrutiny.level}. Complexity factors: ${scrutiny.factors.map((f) => `${f.label}: ${f.reason}`).join("; ")}. Note: regulatory scrutiny reflects process complexity, not wrongdoing.`;
}

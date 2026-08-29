import type {
  DocumentRiskSignals,
  BusinessProfile,
  SimulationResult,
  RiskAssessment,
  RiskFactor,
  RiskTier,
} from "@/types";

/**
 * Computes submission risk from document analysis signals.
 * Pure function — no side effects.
 */
export function computeSubmissionRisk(
  signals: DocumentRiskSignals
): RiskAssessment["submissionRisk"] {
  const factors: RiskFactor[] = [];

  // Blocking contradictions
  if (signals.blockingCount > 0) {
    const points = Math.min(signals.blockingCount * 20, 40);
    factors.push({
      label: "Blocking contradictions",
      points,
      reason: `${signals.blockingCount} blocking contradiction${signals.blockingCount === 1 ? "" : "s"} prevent${signals.blockingCount === 1 ? "s" : ""} approval`,
    });
  }

  // Missing mandatory documents
  if (signals.missingMandatoryCount > 0) {
    const points = Math.min(signals.missingMandatoryCount * 15, 30);
    factors.push({
      label: "Missing mandatory documents",
      points,
      reason: `${signals.missingMandatoryCount} mandatory document${signals.missingMandatoryCount === 1 ? "" : "s"} not uploaded`,
    });
  }

  // Low readiness score
  if (signals.readinessOverall < 60) {
    const points = Math.round((60 - signals.readinessOverall) / 2);
    factors.push({
      label: "Low readiness score",
      points,
      reason: `Overall readiness score is ${signals.readinessOverall}%, below the 60% threshold`,
    });
  }

  // Low-confidence extractions
  if (signals.lowConfidenceCount > 0) {
    const points = Math.min(signals.lowConfidenceCount * 3, 15);
    factors.push({
      label: "Low-confidence extractions",
      points,
      reason: `${signals.lowConfidenceCount} field${signals.lowConfidenceCount === 1 ? "" : "s"} extracted with low confidence`,
    });
  }

  // No elevated signals — neutral factor
  if (factors.length === 0) {
    factors.push({
      label: "No significant risk signals",
      points: 0,
      reason: "All document checks passed without significant issues",
    });
  }

  // Sum points and clamp to [0, 100]
  const rawScore = factors.reduce((sum, f) => sum + (f.points ?? 0), 0);
  const score = Math.max(0, Math.min(100, rawScore));

  // Determine level
  let level: RiskTier;
  if (score >= 70) {
    level = "high";
  } else if (score >= 40) {
    level = "medium";
  } else {
    level = "low";
  }

  // topIssue = reason of the highest-points factor, or null if only the neutral factor
  const elevatedFactors = factors.filter((f) => (f.points ?? 0) > 0);
  let topIssue: string | null = null;
  if (elevatedFactors.length > 0) {
    const topFactor = elevatedFactors.reduce((best, f) =>
      (f.points ?? 0) > (best.points ?? 0) ? f : best
    );
    topIssue = topFactor.reason;
  }

  return { score, level, factors, topIssue } as RiskAssessment["submissionRisk"] & {
    topIssue: string | null;
  };
}

/**
 * Computes regulatory scrutiny level from business profile and simulation result.
 * Pure function — no side effects.
 * Factors describe process complexity only, never imply wrongdoing.
 */
export function computeRegulatoryScrutiny(
  profile: BusinessProfile,
  simulation: SimulationResult
): RiskAssessment["regulatoryScrutiny"] {
  const factors: RiskFactor[] = [];

  // Boiler installation
  if (profile.hasBoiler === true) {
    factors.push({
      label: "Boiler installation",
      reason:
        "Presence of a boiler adds a regulated pressure vessel process requiring IBR certification and periodic inspection",
    });
  }

  // Hazardous process or waste
  if (
    profile.hazardousMaterials === true ||
    profile.generatesHazardousWaste === true
  ) {
    factors.push({
      label: "Hazardous process or waste",
      reason:
        "Use of hazardous materials or generation of hazardous waste involves additional MPCB consent and waste management compliance procedures",
    });
  }

  // Multiple applicable approvals
  const applicableCount = simulation.approvals.filter((a) => a.applies).length;
  if (applicableCount >= 3) {
    factors.push({
      label: "Multiple applicable approvals",
      reason: `${applicableCount} approvals apply, indicating a multi-agency compliance process with interdependent requirements`,
    });
  }

  // Large workforce
  if (profile.employees >= 100) {
    factors.push({
      label: "Large workforce",
      reason: `A workforce of ${profile.employees} employees triggers additional labour compliance requirements under the Factories Act`,
    });
  }

  // Determine level based on factor count
  const count = factors.length;
  let level: RiskTier;
  if (count >= 3) {
    level = "high";
  } else if (count >= 1) {
    level = "medium";
  } else {
    level = "low";
  }

  return { level, factors };
}

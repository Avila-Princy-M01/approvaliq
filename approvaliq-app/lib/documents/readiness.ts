import type {
  Contradiction,
  DryRunResult,
  ExtractedField,
  ReadinessBreakdown,
  RequiredDocument,
  Severity,
} from "@/types";

// ---------------------------------------------------------------------------
// Weights (must sum to 1.0)
// ---------------------------------------------------------------------------
const W_DOCUMENTS = 0.35;
const W_INFORMATION = 0.25;
const W_CONSISTENCY = 0.25;
const W_REGULATORY = 0.15;

// ---------------------------------------------------------------------------
// Required fields — fields that must be present for a complete application.
// These are the fields the rules engine cares about.
// ---------------------------------------------------------------------------
const CORE_REQUIRED_FIELDS = [
  "companyName",
  "registrationNumber",
  "factoryAddress",
  "factoryAreaSqFt",
  "employeeCount",
  "investmentCrore",
  "hasBoiler",
];

export interface ReadinessInput {
  extractedFields: ExtractedField[];
  requiredDocuments: RequiredDocument[];
  uploadedDocuments: string[];
  contradictions: Contradiction[];
  requiredFields?: string[]; // defaults to CORE_REQUIRED_FIELDS
}

/**
 * Calculates a multi-component readiness score for a dry-run submission.
 *
 * Components:
 *   Documents   35%  found / expected * 100
 *   Information 25%  present required fields / total required fields * 100
 *   Consistency 25%  100 − (blocking×25 + warning×10 + info×2), floor 0
 *   Regulatory  15%  100 if all applicable conditions have data, else proportional
 *
 * overall = round(0.35*d + 0.25*i + 0.25*c + 0.15*r)
 *
 * Critical override: any blocking contradiction or missing mandatory document
 * forces status = "blocked" regardless of score.
 */
export function calculateReadinessScore(
  input: ReadinessInput
): ReadinessBreakdown {
  const {
    extractedFields,
    requiredDocuments,
    uploadedDocuments,
    contradictions,
    requiredFields = CORE_REQUIRED_FIELDS,
  } = input;

  // ---- Documents component ------------------------------------------------
  const mandatoryRequired = dedupeById(
    requiredDocuments.filter((d) => d.mandatory)
  );
  const uploadedSet = new Set(uploadedDocuments.map((id) => id.trim().toLowerCase()));
  const expected = mandatoryRequired.length;
  const found = mandatoryRequired.filter((d) =>
    uploadedSet.has(d.id.trim().toLowerCase())
  ).length;
  const documentsScore =
    expected === 0 ? 100 : Math.round((found / expected) * 100);

  // ---- Information component -----------------------------------------------
  // A required field is "present" if at least one extracted field has that name
  const presentFieldNames = new Set(extractedFields.map((f) => f.field));
  const presentCount = requiredFields.filter((f) => presentFieldNames.has(f)).length;
  const informationScore =
    requiredFields.length === 0
      ? 100
      : Math.round((presentCount / requiredFields.length) * 100);

  // ---- Consistency component -----------------------------------------------
  const blockingCount = contradictions.filter(
    (c) => c.severity === "blocking"
  ).length;
  const warningCount = contradictions.filter(
    (c) => c.severity === "warning"
  ).length;
  const infoCount = contradictions.filter(
    (c) => c.severity === "informational"
  ).length;

  const consistencyPenalty = blockingCount * 25 + warningCount * 10 + infoCount * 2;
  const consistencyScore = Math.max(0, 100 - consistencyPenalty);

  // ---- Regulatory conditions component ------------------------------------
  // 100 if all required fields are present AND no blocking contradictions,
  // else proportional to how many required fields have data.
  const regulatoryScore =
    blockingCount === 0 && presentCount === requiredFields.length
      ? 100
      : Math.round((presentCount / Math.max(requiredFields.length, 1)) * 100);

  // ---- Overall -------------------------------------------------------------
  const overall = Math.round(
    W_DOCUMENTS * documentsScore +
      W_INFORMATION * informationScore +
      W_CONSISTENCY * consistencyScore +
      W_REGULATORY * regulatoryScore
  );

  return {
    documents: documentsScore,
    information: informationScore,
    consistency: consistencyScore,
    regulatoryConditions: regulatoryScore,
    overall,
  };
}

/**
 * Derives the DryRunResult status from contradictions and missing documents.
 *
 * Critical override rule:
 *   - Any blocking contradiction  → "blocked"
 *   - Any missing mandatory doc   → "blocked"
 *   - Any warning contradiction   → "needs-review"
 *   - Otherwise                   → "ready"
 *
 * A 92% score with a blocking contradiction still says BLOCKED.
 */
export function deriveStatus(
  contradictions: Contradiction[],
  missing: RequiredDocument[]
): DryRunResult["status"] {
  if (contradictions.some((c) => c.severity === ("blocking" as Severity))) {
    return "blocked";
  }
  if (missing.some((m) => m.mandatory)) {
    return "blocked";
  }
  if (contradictions.some((c) => c.severity === ("warning" as Severity))) {
    return "needs-review";
  }
  return "ready";
}

/**
 * Produces a DocumentRiskSignals summary for Chirag's risk scorer.
 */
export function getDocumentRiskSignals(result: DryRunResult) {
  return {
    blockingCount: result.contradictions.filter(
      (c) => c.severity === "blocking"
    ).length,
    warningCount: result.contradictions.filter(
      (c) => c.severity === "warning"
    ).length,
    missingMandatoryCount: result.missingDocuments.filter(
      (m) => m.mandatory
    ).length,
    lowConfidenceCount: result.extractedFields.filter(
      (f) => f.confidence < 0.8
    ).length,
    verifiedFieldCount: result.extractedFields.filter((f) => f.verified).length,
    readinessOverall: result.readiness.overall,
    status: result.status,
    topIssue: result.contradictions[0]?.label ?? null,
    evidence: result.contradictions[0]?.documents ?? [],
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function dedupeById(docs: RequiredDocument[]): RequiredDocument[] {
  const seen = new Set<string>();
  return docs.filter((d) => {
    const key = d.id.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

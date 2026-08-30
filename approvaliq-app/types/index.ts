// ============ PROFILE ============
export type ProjectStage = "planning" | "construction" | "operating";

export interface BusinessProfile {
  id?: string;
  companyName?: string;
  industry: string; // "food-processing"
  district: string; // "Pune"
  taluka?: string;
  areaSqFt: number;
  investmentCrore: number;
  employees: number;
  usesPower: boolean;
  powerLoadHP?: number;
  hasBoiler: boolean;
  boilerCapacityLitres?: number;
  hazardousMaterials: boolean;
  generatesHazardousWaste: boolean;
  annualTurnoverLakh?: number;
  projectStage: ProjectStage;
}

// ============ EVIDENCE ============
export type VerificationStatus = "verified" | "needs-review";

export interface Citation {
  clauseId: string;
  sourceTitle: string;
  authority: string;
  clause: string;
  page?: string;
  version: string;
  lastVerified: string; // ISO date
  sourceUrl: string;
  verificationStatus: VerificationStatus;
}

export interface DecisionTrace {
  ruleId: string;
  condition: string; // human readable
  applicantValue: string | number | boolean;
  expectedCondition: string; // "employees >= 10 with power"
  matched: boolean;
  clauseId: string;
  citation: Citation | null;
}

// ============ APPROVALS ============
export type RiskTier = "low" | "medium" | "high";

export interface RequiredDocument {
  id: string;
  label: string;
  mandatory: boolean;
}

export interface Approval {
  id: string;
  name: string;
  department: string;
  applies: boolean;
  appliesReason?: string; // optional: short summary, derived from matched traces
  requiredDocuments: RequiredDocument[];
  statutoryDays?: number | null; // null = not sourced yet, renders as "—"
  statutoryDaysClauseId?: string | null;
  statutoryDaysSource?: Citation | null; // resolved from statutoryDaysClauseId at evaluate time
  indicativeFee?: number;
  feeConfidence: "sourced" | "indicative" | "unknown";
  riskTier: RiskTier;
  dependsOn: string[];
  traces: DecisionTrace[];
}

export interface SimulationSummary {
  applicableApprovalCount: number;
  uniqueDocumentCount: number;
  criticalPathDays: number; // USE THIS in the UI
  sumOfAllDays: number; // diagnostic only, never shown as timeline
  indicativeFeeTotal: number;
  highestRiskTier: RiskTier;
  criticalPath: string[]; // ordered approval ids
  bottleneckApprovalId: string | null;
  unverifiedFieldCount: number;
}

export interface SimulationResult {
  profile: BusinessProfile;
  approvals: Approval[]; // includes applies:false ones, for "why not"
  summary: SimulationSummary;
  engineVersion: string;
  ruleSetVersion: string;
  generatedAt: string;
}

export interface SimulationDiff {
  addedApprovals: string[];
  removedApprovals: string[];
  addedDocuments: string[];
  removedDocuments: string[];
  daysChange: number;
  feeChange: number;
  riskChange: { from: RiskTier; to: RiskTier } | null;
  triggeredBy: string[]; // which rules flipped
}

// ============ DOCUMENTS ============
export interface ExtractedField {
  field: string; // "factoryAreaSqFt"
  label: string; // "Factory area"
  value: string | number | boolean;
  sourceDocument: string;
  page?: number;
  confidence: number; // 0..1
  verified: boolean;
}

export type Severity = "blocking" | "warning" | "informational";

export interface Contradiction {
  id: string;
  field: string;
  label: string;
  documents: string[];
  values: (string | number | boolean)[];
  severity: Severity;
  recommendedAction: string;
  predictedQuery: string;
}

export interface ReadinessBreakdown {
  documents: number;
  information: number;
  consistency: number;
  regulatoryConditions: number;
  overall: number;
}

export interface DryRunResult {
  applicationId: string;
  documentPack: string;
  extractedFields: ExtractedField[];
  documentsExpected: number;
  documentsFound: number;
  missingDocuments: RequiredDocument[];
  contradictions: Contradiction[];
  readiness: ReadinessBreakdown;
  predictedQueries: string[];
  status: "ready" | "blocked" | "needs-review";
  extractionMode: "fixture" | "live-pdf";
}

// ============ RISK / OFFICER ============
export interface RiskFactor {
  label: string;
  points?: number;
  reason: string;
  evidence?: string[];
}

export interface RiskAssessment {
  submissionRisk: { score: number; level: RiskTier; factors: RiskFactor[] };
  regulatoryScrutiny: { level: RiskTier; factors: RiskFactor[] };
}

export interface AuditEvent {
  timestamp: string;
  actor: string;
  action: string;
  reason?: string;
  detail?: string;
}

// Produced by Avila (lib/documents), consumed by Chirag (lib/officer/risk.ts).
// Frozen Saturday evening — neither side changes it alone.
export interface DocumentRiskSignals {
  blockingCount: number;
  warningCount: number;
  missingMandatoryCount: number;
  lowConfidenceCount: number;
  verifiedFieldCount: number;
  readinessOverall: number; // = DryRunResult.readiness.overall
  status: DryRunResult["status"];
  topIssue: string | null;
  evidence: string[];
}

export interface OfficerRecommendation {
  action: string;
  rationale: string;
  advisoryOnly: true;
}

export interface OfficerQueueItem {
  applicationId: string;
  companyName: string;
  district: string;
  priority: RiskTier;
  submissionRisk: number;
  regulatoryScrutiny: RiskTier;
  readinessScore: number; // from DocumentRiskSignals.readinessOverall
  topIssue: string | null;
  evidence: string[];
  status: "pending" | "clarification-requested" | "approved" | "rejected";
  recommendation?: OfficerRecommendation;
}

export interface ChangeImpactResult {
  ruleId: string;
  oldValue: number | string;
  newValue: number | string;
  totalBusinessesEvaluated: number;
  affected: Array<{
    businessId: string;
    name: string;
    district: string;
    newlyRequiredApprovals: string[];
    noLongerRequiredApprovals: string[];
    reason: string;
  }>;
}

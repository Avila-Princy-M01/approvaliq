import type {
  Approval,
  BusinessProfile,
  RiskTier,
  SimulationSummary,
} from "@/types";

// ---------------------------------------------------------------------------
// Approval engine.
// evaluateApprovals currently returns a hardcoded seed set — rule logic will be
// implemented here later. calculateSimulationSummary is a working placeholder
// until the real critical-path algorithm lands (see lib/engine/summary.ts task).
// ---------------------------------------------------------------------------

export function evaluateApprovals(profile: BusinessProfile): Approval[] {
  return [
    {
      id: "factory-license",
      name: "Factory Licence",
      department: "Directorate of Industrial Safety and Health",
      applies: true,
      requiredDocuments: [
        { id: "factory-plan", label: "Approved factory plan", mandatory: true },
      ],
      statutoryDays: 30,
      statutoryDaysClauseId: null,
      statutoryDaysSource: null,
      indicativeFee: 5000,
      feeConfidence: "indicative",
      riskTier: "medium",
      dependsOn: [],
      traces: [],
    },
    {
      id: "fire-noc",
      name: "Fire NOC",
      department: "Maharashtra Fire Services",
      applies: true,
      requiredDocuments: [
        { id: "fire-safety-form", label: "Fire safety declaration", mandatory: true },
      ],
      statutoryDays: 21,
      statutoryDaysClauseId: null,
      statutoryDaysSource: null,
      indicativeFee: 3000,
      feeConfidence: "indicative",
      riskTier: "medium",
      dependsOn: [],
      traces: [],
    },
    {
      id: "fssai-license",
      name: "FSSAI Licence",
      department: "Food Safety and Standards Authority",
      applies: false,
      appliesReason: "Turnover below licensing threshold",
      requiredDocuments: [],
      statutoryDays: null,
      statutoryDaysClauseId: null,
      statutoryDaysSource: null,
      feeConfidence: "unknown",
      riskTier: "low",
      dependsOn: [],
      traces: [],
    },
  ];
}

export function calculateSimulationSummary(
  approvals: Approval[]
): SimulationSummary {
  const applicable = approvals.filter((a) => a.applies);

  const applicableApprovalCount = applicable.length;

  const documentIds = new Set<string>();
  for (const approval of applicable) {
    for (const doc of approval.requiredDocuments) {
      documentIds.add(doc.id);
    }
  }
  const uniqueDocumentCount = documentIds.size;

  // PLACEHOLDER: replace with longest-path algorithm, see lib/engine/summary.ts task
  const criticalPathDays = applicable.reduce(
    (sum, a) => sum + (a.statutoryDays ?? 0),
    0
  );

  const indicativeFeeTotal = applicable.reduce(
    (sum, a) => sum + (a.indicativeFee ?? 0),
    0
  );

  const RISK_RANK: Record<RiskTier, number> = { low: 0, medium: 1, high: 2 };
  let highestRiskTier: RiskTier = "low";
  for (const approval of applicable) {
    if (RISK_RANK[approval.riskTier] > RISK_RANK[highestRiskTier]) {
      highestRiskTier = approval.riskTier;
    }
  }

  const criticalPath = applicable.map((a) => a.id);

  const unverifiedFieldCount = applicable.filter(
    (a) => a.feeConfidence !== "sourced"
  ).length;

  return {
    applicableApprovalCount,
    uniqueDocumentCount,
    criticalPathDays,
    sumOfAllDays: criticalPathDays, // diagnostic only, never shown as timeline
    indicativeFeeTotal,
    highestRiskTier,
    criticalPath,
    bottleneckApprovalId: null,
    unverifiedFieldCount,
  };
}

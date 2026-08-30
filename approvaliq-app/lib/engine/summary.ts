import type { Approval, RiskTier, SimulationSummary } from "@/types";

// ---------------------------------------------------------------------------
// Real longest-path critical path algorithm.
//
// Walks the dependsOn graph starting from every applicable approval and picks
// the chain with the greatest total statutoryDays. Includes a safety guard
// against cyclic dependsOn graphs so this function never hangs — real cycle
// detection with a proper error belongs to a separate lib/engine/graph.ts
// task later; this is just a guard that bails out when a cycle is re-entered.
// ---------------------------------------------------------------------------

function longestPathDays(approvals: Approval[]): { days: number; path: string[] } {
  const applicable = approvals.filter((a) => a.applies);
  const byId = new Map(applicable.map((a) => [a.id, a]));
  const memo = new Map<string, { days: number; path: string[] }>();
  // Cycle guard: ids currently being walked. If walk() is re-entered for one
  // of them, the dependsOn graph has a cycle — return zero immediately rather
  // than recurse forever.
  const visiting = new Set<string>();

  function walk(id: string): { days: number; path: string[] } {
    if (visiting.has(id)) return { days: 0, path: [] };
    if (memo.has(id)) return memo.get(id)!;
    const a = byId.get(id);
    if (!a) return { days: 0, path: [] };
    visiting.add(id);
    const deps = a.dependsOn.filter((d) => byId.has(d));
    let best = { days: 0, path: [] as string[] };
    for (const d of deps) {
      const r = walk(d);
      if (r.days > best.days) best = r;
    }
    visiting.delete(id);
    const result = { days: best.days + (a.statutoryDays ?? 0), path: [...best.path, a.id] };
    memo.set(id, result);
    return result;
  }

  let overall: { days: number; path: string[] } | null = null;
  for (const a of applicable) {
    const r = walk(a.id);
    if (overall === null || r.days > overall.days) overall = r;
  }
  return overall ?? { days: 0, path: [] };
}

// ---------------------------------------------------------------------------
// Summary aggregation.
// ---------------------------------------------------------------------------

const RISK_RANK: Record<RiskTier, number> = { low: 0, medium: 1, high: 2 };

export function calculateSimulationSummary(
  approvals: Approval[]
): SimulationSummary {
  const applicable = approvals.filter((a) => a.applies);

  const applicableApprovalCount = applicable.length;

  // Dedupe requiredDocuments by id across all applicable approvals.
  const documentIds = new Set<string>();
  for (const approval of applicable) {
    for (const doc of approval.requiredDocuments) {
      documentIds.add(doc.id);
    }
  }
  const uniqueDocumentCount = documentIds.size;

  const longestPath = longestPathDays(approvals);
  const criticalPathDays = longestPath.days;
  const criticalPath = longestPath.path;

  // DIAGNOSTIC ONLY — this sums every applicable approval's statutoryDays and
  // must NEVER be shown as the timeline in the UI. The timeline length is
  // criticalPathDays (the longest dependsOn chain), not this sum.
  const sumOfAllDays = applicable.reduce(
    (sum, a) => sum + (a.statutoryDays ?? 0),
    0
  );

  const indicativeFeeTotal = applicable.reduce(
    (sum, a) => sum + (a.indicativeFee ?? 0),
    0
  );

  let highestRiskTier: RiskTier = "low";
  for (const approval of applicable) {
    if (RISK_RANK[approval.riskTier] > RISK_RANK[highestRiskTier]) {
      highestRiskTier = approval.riskTier;
    }
  }

  // Id on the critical path with the largest statutoryDays value
  // (null if the critical path is empty).
  const applicableById = new Map(applicable.map((a) => [a.id, a]));
  let bottleneckApprovalId: string | null = null;
  if (criticalPath.length > 0) {
    let maxDays = -1;
    for (const id of criticalPath) {
      const days = applicableById.get(id)?.statutoryDays ?? 0;
      if (days > maxDays) {
        maxDays = days;
        bottleneckApprovalId = id;
      }
    }
  }

  const unverifiedFieldCount = applicable.filter(
    (a) => a.feeConfidence !== "sourced"
  ).length;

  return {
    applicableApprovalCount,
    uniqueDocumentCount,
    criticalPathDays,
    sumOfAllDays,
    indicativeFeeTotal,
    highestRiskTier,
    criticalPath,
    bottleneckApprovalId,
    unverifiedFieldCount,
  };
}
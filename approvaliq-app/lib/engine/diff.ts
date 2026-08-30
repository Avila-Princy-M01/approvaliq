import type {
  Approval,
  RiskTier,
  SimulationDiff,
  SimulationResult,
} from "@/types";

// ---------------------------------------------------------------------------
// Compares two full simulation runs and produces a structured diff.
//
// - Approvals: newly-required vs no-longer-required (by id, applies flag).
// - Documents: deduped requiredDocument ids across APPLICABLE approvals.
// - Days/fee deltas use summary.criticalPathDays / indicativeFeeTotal.
// - Risk delta compares summary.highestRiskTier.
// - triggeredBy: rule ids whose matched state flipped between the two runs.
// ---------------------------------------------------------------------------

/**
 * For each ruleId, compute whether the RULE AS A WHOLE matched in this
 * simulation. DecisionTrace is one entry per CONDITION, not per rule, so a
 * rule matches only when ALL of its traces (across every approval it
 * generated traces on) have matched === true — mirroring how
 * evaluateApprovals treats logic: "all" (every condition must pass).
 *
 * NOTE: this inference is safe for the current dataset because no rule uses
 * logic: "any" yet. If an "any"-logic rule is added later, this helper will
 * need the rule's logic type threaded through (e.g. import the rule metadata
 * alongside the trace) instead of inferring whole-rule match from the traces
 * alone.
 */
function ruleMatchedBySimulation(approvals: Approval[]): Map<string, boolean> {
  const matched = new Map<string, boolean>();
  for (const approval of approvals) {
    for (const trace of approval.traces) {
      // All-or-nothing per ruleId: once ANY condition trace for this rule is
      // unmatched, the rule as a whole did not match in this simulation.
      matched.set(
        trace.ruleId,
        (matched.get(trace.ruleId) ?? true) && trace.matched
      );
    }
  }
  return matched;
}

function applicableIds(approvals: Approval[]): Set<string> {
  return new Set(approvals.filter((a) => a.applies).map((a) => a.id));
}

function applicableDocIds(approvals: Approval[]): Set<string> {
  const ids = new Set<string>();
  for (const approval of approvals) {
    if (!approval.applies) continue;
    for (const doc of approval.requiredDocuments) {
      ids.add(doc.id);
    }
  }
  return ids;
}

function diffIdSets(prev: Set<string>, curr: Set<string>): {
  added: string[];
  removed: string[];
} {
  return {
    added: [...curr].filter((id) => !prev.has(id)),
    removed: [...prev].filter((id) => !curr.has(id)),
  };
}

export function compareSimulations(
  prev: SimulationResult,
  curr: SimulationResult
): SimulationDiff {
  const prevApprovals = prev.approvals;
  const currApprovals = curr.approvals;

  const approvalDiff = diffIdSets(
    applicableIds(prevApprovals),
    applicableIds(currApprovals)
  );

  const docDiff = diffIdSets(
    applicableDocIds(prevApprovals),
    applicableDocIds(currApprovals)
  );

  const daysChange = curr.summary.criticalPathDays - prev.summary.criticalPathDays;
  const feeChange = curr.summary.indicativeFeeTotal - prev.summary.indicativeFeeTotal;

  const prevRisk = prev.summary.highestRiskTier;
  const currRisk = curr.summary.highestRiskTier;
  const riskChange:
    | { from: RiskTier; to: RiskTier }
    | null = prevRisk !== currRisk ? { from: prevRisk, to: currRisk } : null;

  // Trace flips: keyed by ruleId, comparing whole-rule matched status per
  // simulation (all condition traces must match; see ruleMatchedBySimulation).
  const prevMatched = ruleMatchedBySimulation(prevApprovals);
  const currMatched = ruleMatchedBySimulation(currApprovals);
  const triggeredBy: string[] = [];
  const allRuleIds = new Set([...prevMatched.keys(), ...currMatched.keys()]);
  for (const ruleId of allRuleIds) {
    const prevState = prevMatched.get(ruleId) ?? false;
    const currState = currMatched.get(ruleId) ?? false;
    if (prevState !== currState) triggeredBy.push(ruleId);
  }

  return {
    addedApprovals: approvalDiff.added,
    removedApprovals: approvalDiff.removed,
    addedDocuments: docDiff.added,
    removedDocuments: docDiff.removed,
    daysChange,
    feeChange,
    riskChange,
    triggeredBy,
  };
}
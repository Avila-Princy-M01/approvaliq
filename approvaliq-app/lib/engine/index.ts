// ---------------------------------------------------------------------------
// Approval engine barrel.
// Rule evaluation lives in lib/engine/evaluate.ts and summary/critical-path
// logic in lib/engine/summary.ts — both are re-exported here so the public
// API surface stays stable:
//   evaluateApprovals(profile, overrides?) -> Approval[]
//   calculateSimulationSummary(approvals) -> SimulationSummary
// ---------------------------------------------------------------------------

export { evaluateApprovals } from "./evaluate";
export { calculateSimulationSummary } from "./summary";

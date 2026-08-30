// -----------------------------------------------------------------------------
// Approval engine boundary / regression checks.
//
// Runs standalone:            npx tsx lib/engine/__tests__/boundary.ts
// Intentionally NOT a vitest test — zero-framework so the team can run it in
// any CI that has typescript + tsx, with no config.
//
// What this verifies:
//   - Rule-boundary behavior for the employee-count thresholds (10 with power,
//     20 without) and the boiler-installed rule.
//   - Applicable approvals always carry supporting decision traces and have at
//     least one non-empty clauseId backing them.
//   - The applicable-approval dependency graph is acyclic (topological order
//     must not throw).
//   - The critical-path invariant: criticalPathDays <= sumOfAllDays for every
//     profile shape exercised below (never a chain long than the naive sum).
// -----------------------------------------------------------------------------

import {
  evaluateApprovals,
  calculateSimulationSummary,
} from "@/lib/engine";
import {
  getTopologicalOrder,
  detectCycle,
} from "@/lib/engine/graph";
import type { Approval, BusinessProfile } from "@/types";

let passed = 0, failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) { passed++; console.log(`PASS: ${label}`); }
  else { failed++; console.log(`FAIL: ${label}`); }
}

// -----------------------------------------------------------------------------
// Base demo profile — every case below starts from this and spreads overrides.
// -----------------------------------------------------------------------------
const baseProfile: BusinessProfile = {
  industry: "food-processing",
  district: "Pune",
  areaSqFt: 7500,
  investmentCrore: 8,
  employees: 80,
  usesPower: true,
  hasBoiler: true,
  hazardousMaterials: true,
  generatesHazardousWaste: true,
  projectStage: "planning",
};

// Case 1-6 profiles: spread overrides on the base.
const smallPowered = { ...baseProfile, employees: 9, usesPower: true };
const thresholdPowered = { ...baseProfile, employees: 10, usesPower: true };
const smallUnpowered = { ...baseProfile, employees: 19, usesPower: false };
const thresholdUnpowered = { ...baseProfile, employees: 20, usesPower: false };
const noBoiler = { ...baseProfile, hasBoiler: false };
const withBoiler = { ...baseProfile, hasBoiler: true };

function factoryLicenseApplies(approvals: Approval[]): boolean {
  return approvals.find((a) => a.id === "factory-license")?.applies ?? false;
}

function boilerRegistrationApplies(approvals: Approval[]): boolean {
  return approvals.find((a) => a.id === "boiler-registration")?.applies ?? false;
}

// -----------------------------------------------------------------------------
// 1-6: rule-boundary cases.
// -----------------------------------------------------------------------------
assert(
  !factoryLicenseApplies(evaluateApprovals(smallPowered)),
  "case 1: employees=9 + power -> factory-license applies=false"
);
assert(
  factoryLicenseApplies(evaluateApprovals(thresholdPowered)),
  "case 2: employees=10 + power -> factory-license applies=true"
);
assert(
  !factoryLicenseApplies(evaluateApprovals(smallUnpowered)),
  "case 3: employees=19 + no power -> factory-license applies=false"
);
assert(
  factoryLicenseApplies(evaluateApprovals(thresholdUnpowered)),
  "case 4: employees=20 + no power -> factory-license applies=true"
);
assert(
  !boilerRegistrationApplies(evaluateApprovals(noBoiler)),
  "case 5: hasBoiler=false -> boiler-registration applies=false"
);
assert(
  boilerRegistrationApplies(evaluateApprovals(withBoiler)),
  "case 6: hasBoiler=true -> boiler-registration applies=true"
);

// -----------------------------------------------------------------------------
// 7: an approval cannot be applicable with zero supporting traces.
// -----------------------------------------------------------------------------
const baseApprovals = evaluateApprovals(baseProfile);
const traceConsistency = baseApprovals.every(
  (a) => !a.applies || a.traces.length > 0
);
assert(
  traceConsistency,
  "case 7: every applicable approval has traces.length > 0"
);

// -----------------------------------------------------------------------------
// 8: every applicable approval must have SOME non-null, non-empty clauseId on
//    at least one of its traces (not necessarily every trace).
// -----------------------------------------------------------------------------
const clauseBacking = baseApprovals.every(
  (a) =>
    !a.applies ||
    a.traces.some(
      (t) => t.clauseId != null && t.clauseId.length > 0
    )
);
assert(
  clauseBacking,
  "case 8: every applicable approval has a non-empty clauseId on >=1 trace"
);

// -----------------------------------------------------------------------------
// 9: the dependency graph of the base profile must be acyclic — the
//    topological order must not throw.
// -----------------------------------------------------------------------------
let topologyOk = false;
try {
  getTopologicalOrder(baseApprovals);
  topologyOk = true;
} catch {
  topologyOk = false;
}
assert(topologyOk, "case 9: getTopologicalOrder does not throw");

// -----------------------------------------------------------------------------
// 10: criticalPathDays must never exceed sumOfAllDays — checked for the base
//     profile plus every profile shape from cases 1-6.
// -----------------------------------------------------------------------------
const allProfiles: { name: string; profile: BusinessProfile }[] = [
  { name: "base", profile: baseProfile },
  { name: "case 1 (employees=9 + power)", profile: smallPowered },
  { name: "case 2 (employees=10 + power)", profile: thresholdPowered },
  { name: "case 3 (employees=19 + no power)", profile: smallUnpowered },
  { name: "case 4 (employees=20 + no power)", profile: thresholdUnpowered },
  { name: "case 5 (no boiler)", profile: noBoiler },
  { name: "case 6 (boiler)", profile: withBoiler },
];

for (const { name, profile } of allProfiles) {
  const summary = calculateSimulationSummary(evaluateApprovals(profile));
  assert(
    summary.criticalPathDays <= summary.sumOfAllDays,
    `case 10: criticalPathDays <= sumOfAllDays for ${name}`
  );
}

// -----------------------------------------------------------------------------
// Report & exit code.
// -----------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
else process.exit(0);
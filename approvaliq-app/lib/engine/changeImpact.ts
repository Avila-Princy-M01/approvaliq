import type { Approval, BusinessProfile, ChangeImpactResult } from "@/types";

import {
  evaluateApprovals,
  getRuleCondition,
  getRuleConditionValue,
} from "./evaluate";

import seedBusinessesData from "@/data/seed/businesses.json";

// Seed businesses used for testing change impact.
// NOTE: this is data/seed/businesses.json — NOT data/businesses.seed.json,
// which is a pre-existing path mismatch from another module (not fixed here).
export const seedBusinesses = seedBusinessesData as BusinessProfile[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applicableIdSet(approvals: Approval[]): Set<string> {
  return new Set(approvals.filter((a) => a.applies).map((a) => a.id));
}

/**
 * Build a short human-readable reason for why a business was affected by a
 * threshold change. Reads the actual field name from the rule's condition at
 * conditionIndex (generic for any numeric field — not hardcoded to "area").
 */
function buildReason(
  business: BusinessProfile,
  field: string,
  unit: string | undefined,
  newValue: number
): string {
  const rawValue = (business as unknown as Record<string, unknown>)[field];
  const numericValue = typeof rawValue === "number" ? rawValue : 0;
  const direction = numericValue >= newValue ? "above" : "below";
  const valueText = String(rawValue ?? "n/a");
  return `${business.companyName ?? "Unknown"} ${field} ${valueText}${
    unit ? ` ${unit}` : ""
  } now ${direction} the revised threshold of ${newValue}`;
}

// ---------------------------------------------------------------------------
// Change impact calculation.
// ---------------------------------------------------------------------------

export function calculateChangeImpact(
  ruleId: string,
  conditionIndex: number,
  newValue: number,
  businesses: BusinessProfile[]
): ChangeImpactResult {
  const condition = getRuleCondition(ruleId, conditionIndex);
  const field = condition?.field ?? "value";
  const unit = condition?.unit;

  const affected: ChangeImpactResult["affected"] = [];

  for (const business of businesses) {
    // Baseline: current rules (no overrides).
    const baselineIds = applicableIdSet(evaluateApprovals(business));

    // Hypothetical: same rules but with the threshold changed at
    // (ruleId, conditionIndex).
    const overriddenIds = applicableIdSet(
      evaluateApprovals(business, [{ ruleId, conditionIndex, value: newValue }])
    );

    const newlyRequiredApprovals = [...overriddenIds].filter(
      (id) => !baselineIds.has(id)
    );
    const noLongerRequiredApprovals = [...baselineIds].filter(
      (id) => !overriddenIds.has(id)
    );

    if (
      newlyRequiredApprovals.length === 0 &&
      noLongerRequiredApprovals.length === 0
    ) {
      continue; // business unaffected
    }

    affected.push({
      businessId: business.id ?? "",
      name: business.companyName ?? "Unknown",
      district: business.district,
      newlyRequiredApprovals,
      noLongerRequiredApprovals,
      reason: buildReason(business, field, unit, newValue),
    });
  }

  // Original threshold value before the override, looked up from the same
  // merged rules array used inside evaluateApprovals.
  const rawOldValue = getRuleConditionValue(ruleId, conditionIndex);
  const oldValue: number | string =
    typeof rawOldValue === "boolean" ? String(rawOldValue) : rawOldValue ?? 0;

  return {
    ruleId,
    oldValue,
    newValue,
    totalBusinessesEvaluated: businesses.length, // never hardcoded
    affected,
  };
}
import type {
  Approval,
  BusinessProfile,
  DecisionTrace,
  RequiredDocument,
  RiskTier,
} from "@/types";

import { getCitation } from "@/lib/citations";

import approvalsData from "@/data/approvals.json";
import boilerRegistrationRulesData from "@/data/rules/boiler-registration.json";
import factoryLicenseRulesData from "@/data/rules/factory-license.json";
import otherApprovalsRulesData from "@/data/rules/other-approvals.json";

// ---------------------------------------------------------------------------
// Types matching the static data files.
// ---------------------------------------------------------------------------

type Override = { ruleId: string; conditionIndex: number; value: number };

interface RuleCondition {
  field: string;
  operator: string;
  value?: unknown;
  unit?: string;
}

interface Rule {
  id: string;
  approvalId: string;
  description: string;
  conditions: RuleCondition[];
  logic: "all" | "any";
  result: string;
  clauseId: string;
  editableThreshold?: { conditionIndex: number; label: string };
}

interface RuleFile {
  ruleSetVersion: string;
  rules: Rule[];
}

interface ApprovalMetadata {
  id: string;
  name: string;
  department: string;
  requiredDocuments: RequiredDocument[];
  statutoryDays: number | null;
  statutoryDaysClauseId: string | null;
  indicativeFee: number | null;
  feeConfidence: Approval["feeConfidence"];
  dependsOn: string[];
  baseRiskTier: RiskTier;
}

// ---------------------------------------------------------------------------
// Static data loaded at module scope (JSON gets bundled — fine in Next.js).
// ---------------------------------------------------------------------------

const approvalMetadata = approvalsData as ApprovalMetadata[];
const allRules: Rule[] = [
  ...(factoryLicenseRulesData as RuleFile).rules,
  ...(boilerRegistrationRulesData as RuleFile).rules,
  ...(otherApprovalsRulesData as RuleFile).rules,
];

// ---------------------------------------------------------------------------
// Condition evaluation.
// ---------------------------------------------------------------------------

function describeCondition(field: string, operator: string, value: unknown, unit?: string): string {
  const labels: Record<string, string> = {
    usesPower: "Uses powered machinery", employees: "Employee count",
    areaSqFt: "Facility area", hasBoiler: "Boiler installed",
    hazardousMaterials: "Hazardous materials", generatesHazardousWaste: "Generates hazardous waste",
    investmentCrore: "Investment amount",
  };
  const label = labels[field] ?? field;
  const opWords: Record<string, string> = { gte: "at least", gt: "more than", lte: "at most", lt: "less than", eq: "equal to" };
  if (operator === "booleanTrue") return `${label} is Yes`;
  if (operator === "booleanFalse") return `${label} is No`;
  return `${label} ${opWords[operator] ?? operator} ${value}${unit ? " " + unit : ""}`;
}

function getApplicantValue(profile: BusinessProfile, field: string): string | number | boolean {
  return (profile as unknown as Record<string, unknown>)[field] as string | number | boolean;
}

function evaluateCondition(
  applicantValue: unknown,
  operator: string,
  expectedValue: unknown
): boolean {
  switch (operator) {
    case "eq":
      return applicantValue === expectedValue;
    case "neq":
      return applicantValue !== expectedValue;
    case "gt":
      return (
        typeof applicantValue === "number" &&
        typeof expectedValue === "number" &&
        applicantValue > expectedValue
      );
    case "gte":
      return (
        typeof applicantValue === "number" &&
        typeof expectedValue === "number" &&
        applicantValue >= expectedValue
      );
    case "lt":
      return (
        typeof applicantValue === "number" &&
        typeof expectedValue === "number" &&
        applicantValue < expectedValue
      );
    case "lte":
      return (
        typeof applicantValue === "number" &&
        typeof expectedValue === "number" &&
        applicantValue <= expectedValue
      );
    case "booleanTrue":
      return applicantValue === true;
    case "booleanFalse":
      return applicantValue === false;
    case "in":
      return Array.isArray(expectedValue) && expectedValue.includes(applicantValue);
    case "notIn":
      return Array.isArray(expectedValue) && !expectedValue.includes(applicantValue);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Risk tier: start from baseRiskTier, bump one level (capped at "high") if the
// profile has any hazardous/hazardous-waste/boiler signal.
// ---------------------------------------------------------------------------

const RISK_ORDER: RiskTier[] = ["low", "medium", "high"];

function computeRiskTier(baseRiskTier: RiskTier, profile: BusinessProfile): RiskTier {
  const hasHazardSignal =
    profile.hazardousMaterials || profile.generatesHazardousWaste || profile.hasBoiler;
  if (!hasHazardSignal) return baseRiskTier;
  return RISK_ORDER[Math.min(RISK_ORDER.indexOf(baseRiskTier) + 1, RISK_ORDER.length - 1)];
}

// ---------------------------------------------------------------------------
// Overrides are applied to a cloned copy of the rules — the loaded JSON data
// is never mutated.
// ---------------------------------------------------------------------------

function applyOverrides(rules: Rule[], overrides?: Override[]): Rule[] {
  if (!overrides || overrides.length === 0) return rules;

  return rules.map((rule) => {
    const ruleOverrides = overrides.filter((o) => o.ruleId === rule.id);
    if (ruleOverrides.length === 0) return rule;

    return {
      ...rule,
      conditions: rule.conditions.map((condition, conditionIndex) => {
        const override = ruleOverrides.find((o) => o.conditionIndex === conditionIndex);
        return override ? { ...condition, value: override.value } : condition;
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// Rule introspection helpers — used by lib/engine/changeImpact.ts so it can
// read the original threshold value and the condition's field name without
// duplicating the rule-loading logic in this file.
// ---------------------------------------------------------------------------

export function getRuleCondition(
  ruleId: string,
  conditionIndex: number
): RuleCondition | undefined {
  return allRules.find((rule) => rule.id === ruleId)?.conditions[conditionIndex];
}

export function getRuleConditionValue(
  ruleId: string,
  conditionIndex: number
): number | string | boolean | undefined {
  const value = getRuleCondition(ruleId, conditionIndex)?.value;
  return value as number | string | boolean | undefined;
}

// ---------------------------------------------------------------------------
// Engine entry point.
// ---------------------------------------------------------------------------

export function evaluateApprovals(
  profile: BusinessProfile,
  overrides?: { ruleId: string; conditionIndex: number; value: number }[]
): Approval[] {
  const effectiveRules = applyOverrides(allRules, overrides);

  return approvalMetadata.map((meta) => {
    const rulesForApproval = effectiveRules.filter((rule) => rule.approvalId === meta.id);

    // No rules sourced yet — we cannot decide applicability.
    if (rulesForApproval.length === 0) {
      return {
        id: meta.id,
        name: meta.name,
        department: meta.department,
        applies: false,
        appliesReason: "Rule not yet defined for this approval",
        requiredDocuments: meta.requiredDocuments,
        statutoryDays: meta.statutoryDays,
        statutoryDaysClauseId: meta.statutoryDaysClauseId,
        statutoryDaysSource: null,
        indicativeFee: meta.indicativeFee ?? undefined, // Approval type allows undefined, not null
        feeConfidence: meta.feeConfidence,
        riskTier: computeRiskTier(meta.baseRiskTier, profile),
        dependsOn: meta.dependsOn,
        traces: [],
      };
    }

    const traces: DecisionTrace[] = [];
    let applies = false;

    for (const rule of rulesForApproval) {
      const ruleTraces: DecisionTrace[] = rule.conditions.map((condition) => {
        const applicantValue = getApplicantValue(profile, condition.field);
        const description = describeCondition(
          condition.field,
          condition.operator,
          condition.value,
          condition.unit
        );
        const matched = evaluateCondition(applicantValue, condition.operator, condition.value);

        return {
          ruleId: rule.id,
          condition: description,
          applicantValue,
          expectedCondition: description,
          matched,
          clauseId: rule.clauseId,
          citation: getCitation(rule.clauseId),
        };
      });

      const matchedConditionCount = ruleTraces.filter((t) => t.matched).length;
      const ruleMatched =
        rule.logic === "any"
          ? matchedConditionCount > 0
          : matchedConditionCount === rule.conditions.length;

      traces.push(...ruleTraces);
      if (ruleMatched) applies = true;
    }

    return {
      id: meta.id,
      name: meta.name,
      department: meta.department,
      applies,
      requiredDocuments: meta.requiredDocuments,
      statutoryDays: meta.statutoryDays,
      statutoryDaysClauseId: meta.statutoryDaysClauseId,
      statutoryDaysSource: null,
      indicativeFee: meta.indicativeFee ?? undefined, // Approval type allows undefined, not null
      feeConfidence: meta.feeConfidence,
      riskTier: computeRiskTier(meta.baseRiskTier, profile),
      dependsOn: meta.dependsOn,
      traces,
    };
  });
}
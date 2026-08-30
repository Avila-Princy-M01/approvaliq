/**
 * lib/evidence/explain.ts — Deterministic template explanation layer.
 *
 * Generates human-readable explanations from approval traces.
 * Works fully offline with no LLM. The template version is always available;
 * an optional LLM layer can be added later but must pass through the validator
 * and fall back to template on any failure.
 *
 * Key design: "The language model has zero authority over any decision.
 * It phrases explanations that the rules engine has already made, and
 * anything it says that isn't traceable to a retrieved clause is
 * rejected before display."
 */

import type { Approval } from "@/types";
import { getCitation, getClauseText } from "./citations";

/**
 * Explain an approval decision using deterministic templates.
 *
 * Returns an explanation string, the list of clause IDs used,
 * and the mode (always "template" in this implementation).
 */
export function explainApproval(approval: Approval): {
  explanation: string;
  usedClauseIds: string[];
  mode: "template" | "llm";
} {
  const matched = approval.traces.filter((t) => t.matched);

  if (matched.length === 0) {
    return {
      explanation: `Based on the details provided, ${approval.name} does not appear to apply to this project.`,
      usedClauseIds: [],
      mode: "template",
    };
  }

  // Build explanation from matched traces
  const parts = matched.map(
    (t) =>
      `${t.condition} — your project reports ${t.applicantValue}, and the applicable condition is ${t.expectedCondition}.`
  );

  // Collect citations from matched traces
  const cites = matched
    .map((t) => {
      const citation = t.citation ?? getCitation(t.clauseId);
      return citation
        ? `${citation.sourceTitle}, ${citation.clause}`
        : null;
    })
    .filter(Boolean);

  // Deduplicate citations
  const uniqueCites = [...new Set(cites)];

  const explanation =
    `${parts.join(" ")} On this basis, ${approval.name} is required from the ${approval.department}.` +
    (uniqueCites.length ? ` Source: ${uniqueCites.join("; ")}.` : "");

  return {
    explanation,
    usedClauseIds: matched.map((t) => t.clauseId),
    mode: "template",
  };
}

/**
 * Enriched explanation that includes clause text for each used clause.
 * Useful for the LLM layer input (profile values + matched traces + retrieved clause text only).
 */
export function explainApprovalWithText(approval: Approval): {
  explanation: string;
  usedClauseIds: string[];
  clauseTexts: Record<string, string | null>;
  mode: "template" | "llm";
} {
  const base = explainApproval(approval);
  const clauseTexts: Record<string, string | null> = {};

  for (const clauseId of base.usedClauseIds) {
    clauseTexts[clauseId] = getClauseText(clauseId);
  }

  return {
    ...base,
    clauseTexts,
  };
}

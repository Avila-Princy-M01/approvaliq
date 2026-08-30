/**
 * lib/evidence/citations.ts — Citation retrieval layer.
 *
 * Wraps the existing citation store (lib/citations/) and adds:
 *   - auditCitationCoverage: self-check you can run and quote on stage
 *
 * Every function returns null on miss — never throws, never guesses.
 */

import type { Citation } from "@/types";
import {
  getCitation as _getCitation,
  getClauseText as _getClauseText,
  getAllClauseIds as _getAllClauseIds,
  getUnverifiedClauseIds as _getUnverifiedClauseIds,
} from "@/lib/citations";

/**
 * Look up a citation by clause ID.
 * Returns the Citation or null if not found. Never throws.
 */
export function getCitation(clauseId: string): Citation | null {
  return _getCitation(clauseId);
}

/**
 * Return the relevant clause text for a given clause ID, or null if not found.
 */
export function getClauseText(clauseId: string): string | null {
  return _getClauseText(clauseId);
}

/**
 * Return all registered clause IDs.
 */
export function getAllClauseIds(): string[] {
  return _getAllClauseIds();
}

/**
 * Return only clause IDs where verificationStatus is "needs-review".
 */
export function getUnverifiedClauseIds(): string[] {
  return _getUnverifiedClauseIds();
}

/**
 * Self-check: report citation coverage for a set of rule clause IDs.
 *
 * Being able to say "we have citation coverage on N of N active rules,
 * and here are the ones still pending verification" is a strong,
 * checkable claim. Most teams cannot answer that question at all.
 */
export function auditCitationCoverage(ruleClauseIds: string[]): {
  total: number;
  covered: number;
  missing: string[];
  unverified: string[];
} {
  const known = new Set(getAllClauseIds());
  return {
    total: ruleClauseIds.length,
    covered: ruleClauseIds.filter((id) => known.has(id)).length,
    missing: ruleClauseIds.filter((id) => !known.has(id)),
    unverified: getUnverifiedClauseIds(),
  };
}

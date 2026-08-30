import { Citation } from "@/types";
import { citationStore } from "./citations";

/**
 * Look up a citation by clause ID.
 * Returns the Citation (public fields) or null if not found or on any error.
 * Never throws.
 */
export function getCitation(clauseId: string): Citation | null {
  try {
    const record = citationStore.get(clauseId);
    if (!record) return null;

    // Return only the Citation fields (CitationRecord extends Citation,
    // so we can cast directly — internal fields like heading, relevantText,
    // notes are not part of the Citation interface and won't cause issues,
    // but callers only see the Citation contract).
    const citation: Citation = {
      clauseId: record.clauseId,
      sourceTitle: record.sourceTitle,
      authority: record.authority,
      clause: record.clause,
      page: record.page,
      version: record.version,
      lastVerified: record.lastVerified,
      sourceUrl: record.sourceUrl,
      verificationStatus: record.verificationStatus,
    };

    return citation;
  } catch {
    return null;
  }
}

/**
 * Return the relevant clause text for a given clause ID, or null if not found.
 */
export function getClauseText(clauseId: string): string | null {
  try {
    const record = citationStore.get(clauseId);
    return record?.relevantText ?? null;
  } catch {
    return null;
  }
}

/**
 * Return all registered clause IDs.
 */
export function getAllClauseIds(): string[] {
  return Array.from(citationStore.keys());
}

/**
 * Return only clause IDs where verificationStatus is "needs-review".
 */
export function getUnverifiedClauseIds(): string[] {
  return Array.from(citationStore.entries())
    .filter(([, record]) => record.verificationStatus === "needs-review")
    .map(([id]) => id);
}

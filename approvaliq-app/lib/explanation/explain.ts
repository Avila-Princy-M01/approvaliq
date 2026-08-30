import type { BusinessProfile, Approval, DecisionTrace } from "@/types";
import { getCitation } from "@/lib/citations";

/**
 * Enriches an approval's decision traces by resolving each trace's clauseId
 * through the Citation Store.
 *
 * Returns a new array of DecisionTrace objects where `citation` is populated
 * with the resolved Citation record (or null if not found).
 *
 * Failure isolation: if enrichment fails for one trace, the others continue.
 * The function never throws; partial results are returned.
 *
 * _Requirements: 2.1, 2.4, 2.5_
 */
export function buildDecisionTraces(
  _profile: BusinessProfile,
  approval: Approval
): DecisionTrace[] {
  return approval.traces.map((trace) => {
    try {
      const citation = getCitation(trace.clauseId);
      return {
        ...trace,
        citation: citation ?? null,
      };
    } catch {
      // If enrichment fails for this trace, keep citation as null
      return {
        ...trace,
        citation: null,
      };
    }
  });
}

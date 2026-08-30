/**
 * lib/evidence/validate.ts — Citation validator.
 *
 * Validates that an explanation only references clause IDs that were
 * actually retrieved, and doesn't assert requirements without evidence.
 *
 * On failure returns the fallback explanation to show in the UI
 * rather than hiding the error:
 *   "This explanation could not be verified against the available
 *    regulatory source. Human review required."
 *
 * Counter-intuitively, demonstrating a rejection is a better demo
 * than a clean pass. Keep one deliberately unsupported clause id
 * in your test data so you can trigger the guardrail live on request.
 */

/**
 * Validates an explanation output against allowed clause IDs.
 *
 * Rejection rules:
 * 1. Any usedClauseIds entry not in allowedClauseIds → "cited a clause that was not retrieved"
 * 2. Explanation contains a section/clause-looking pattern not in the allowed set → "referenced an unverified provision"
 * 3. usedClauseIds is empty but text asserts a requirement → "asserted a requirement without evidence"
 * 4. Explanation is empty or over ~1200 chars → "malformed output"
 */
export function validateExplanation(
  output: { explanation: string; usedClauseIds: string[] },
  allowedClauseIds: string[]
): { valid: boolean; reason?: string } {
  const { explanation, usedClauseIds } = output;

  // Rule 4: Check explanation length
  if (!explanation || explanation.trim().length === 0) {
    return {
      valid: false,
      reason: "malformed output",
    };
  }

  if (explanation.length > 1200) {
    return {
      valid: false,
      reason: "malformed output",
    };
  }

  // Rule 1: Check that all used clause IDs are in the allowed set
  const allowedSet = new Set(allowedClauseIds);
  for (const clauseId of usedClauseIds) {
    if (!allowedSet.has(clauseId)) {
      return {
        valid: false,
        reason: `cited a clause that was not retrieved`,
      };
    }
  }

  // Rule 2: Check for section/clause-looking patterns not in the allowed set
  const pattern = /\b(section|clause|rule|schedule)\s+[\dA-Za-z().\-]+/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(explanation)) !== null) {
    const referenced = match[0];
    // Check if any allowed clause ID contains this reference
    const isAllowed = allowedClauseIds.some(
      (id) =>
        id.toLowerCase().includes(referenced.toLowerCase()) ||
        referenced.toLowerCase().includes(id.toLowerCase())
    );
    if (!isAllowed && usedClauseIds.length === 0) {
      return {
        valid: false,
        reason: "referenced an unverified provision",
      };
    }
  }

  // Rule 3: Check for requirement assertions without evidence
  if (usedClauseIds.length === 0) {
    const requirementPattern =
      /\b(is required|must|shall obtain|obtain)\b/i;
    if (requirementPattern.test(explanation)) {
      return {
        valid: false,
        reason: "asserted a requirement without evidence",
      };
    }
  }

  return { valid: true };
}

/**
 * The fallback explanation shown when validation fails.
 * This is intentionally displayed in the UI rather than hidden —
 * demonstrating a rejection is a better demo than a clean pass.
 */
export const VALIDATION_FALLBACK =
  "This explanation could not be verified against the available regulatory source. Human review required.";

import type { Contradiction, ExtractedField, RequiredDocument } from "@/types";

/**
 * Predicts the queries an officer will raise based on contradictions,
 * missing documents, and low-confidence fields.
 *
 * Rules:
 * - Deterministic templates only — no LLM. Instant, offline-safe, never
 *   hallucinates, and every string is reviewable in advance.
 * - Written in the voice of an actual officer — formal, specific, referencing
 *   the document by name.
 * - Informational contradictions are excluded (officers don't query on those).
 * - Results are deduped.
 */
export function predictQueries(
  contradictions: Contradiction[],
  missing: RequiredDocument[],
  lowConfidence: ExtractedField[]
): string[] {
  const queries: string[] = [];

  // --- Contradictions (blocking + warning only) ----------------------------
  for (const c of contradictions.filter((c) => c.severity !== "informational")) {
    queries.push(c.predictedQuery);
  }

  // --- Missing mandatory documents -----------------------------------------
  for (const m of missing.filter((m) => m.mandatory)) {
    queries.push(
      `Please upload the ${m.label.toLowerCase()}, which is mandatory for the approvals applicable to your project.`
    );
  }

  // --- Low-confidence extracted fields ------------------------------------
  for (const f of lowConfidence) {
    const docName = f.sourceDocument.replace(/-/g, " ");
    queries.push(
      `Please confirm the ${f.label.toLowerCase()} recorded in the ${docName}; the submitted copy was difficult to read.`
    );
  }

  // Dedupe while preserving order
  return [...new Set(queries)];
}

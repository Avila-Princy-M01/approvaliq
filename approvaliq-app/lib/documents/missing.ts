import type { RequiredDocument } from "@/types";

// ---------------------------------------------------------------------------
// Default required documents — used as fallback when the caller doesn't pass
// a live simulation result (e.g. during standalone endpoint testing).
// ---------------------------------------------------------------------------
const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocument[] = [
  { id: "factory-plan", label: "Approved factory plan", mandatory: true },
  { id: "company-registration", label: "Company registration proof", mandatory: true },
  { id: "fire-safety-form", label: "Fire safety declaration", mandatory: true },
  { id: "worker-details", label: "Worker strength declaration", mandatory: true },
  { id: "boiler-certificate", label: "Boiler test certificate", mandatory: true },
  { id: "application-form", label: "Application form", mandatory: true },
];

export interface MissingDocumentResult {
  missing: RequiredDocument[];
  expected: number; // count of mandatory docs
  found: number;    // count of mandatory docs that were uploaded
}

/**
 * Compares the required documents (from simulation) against what was actually
 * uploaded. Both sides are deduped by id before counting — a document required
 * by three approvals is still one document.
 *
 * Only mandatory: true documents count toward expected / found.
 *
 * @param requiredDocuments - from Shreya's simulation (approvals.flatMap requiredDocuments)
 * @param uploadedDocuments - list of document ids present in the pack
 */
export function findMissingDocuments(
  requiredDocuments: RequiredDocument[],
  uploadedDocuments: string[]
): MissingDocumentResult {
  // Use defaults if caller passes nothing (makes endpoint independently testable)
  const source =
    requiredDocuments.length > 0 ? requiredDocuments : DEFAULT_REQUIRED_DOCUMENTS;

  // Dedupe required docs by id
  const dedupedRequired = dedupeById(source);

  // Only mandatory docs count
  const mandatoryRequired = dedupedRequired.filter((d) => d.mandatory);

  // Dedupe uploaded ids
  const uploadedSet = new Set(uploadedDocuments.map((id) => id.trim().toLowerCase()));

  const missing = mandatoryRequired.filter(
    (d) => !uploadedSet.has(d.id.trim().toLowerCase())
  );

  const found = mandatoryRequired.length - missing.length;

  return {
    missing,
    expected: mandatoryRequired.length,
    found,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dedupeById(docs: RequiredDocument[]): RequiredDocument[] {
  const seen = new Set<string>();
  const result: RequiredDocument[] = [];
  for (const doc of docs) {
    const key = doc.id.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(doc);
    }
  }
  return result;
}

/** Exported so the dryrun route can access the fallback list. */
export { DEFAULT_REQUIRED_DOCUMENTS };

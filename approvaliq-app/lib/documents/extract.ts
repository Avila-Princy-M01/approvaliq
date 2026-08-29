import type { ExtractedField } from "@/types";

// ---------------------------------------------------------------------------
// Pack loader — reads fixture JSON files from data/documents/packs/
// In Next.js App Router, server-side imports can use fs/path at build/request
// time. On the client this module should only be called via the API route.
// ---------------------------------------------------------------------------

import demaMismatch from "@/data/documents/packs/demo-mismatch.json";
import demoCorrected from "@/data/documents/packs/demo-corrected.json";

type PackData = {
  packId: string;
  uploadedDocuments: string[];
  fields: ExtractedField[];
};

// In-memory pack registry — add more packs here as needed
const PACKS: Record<string, PackData> = {
  "demo-mismatch": demaMismatch as PackData,
  "demo-corrected": demoCorrected as PackData,
};

/**
 * Returns the extracted fields for the given pack.
 * Falls back to demo-mismatch if the packId is unknown.
 */
export function extractDocumentFields(packId: string): ExtractedField[] {
  const pack = PACKS[packId] ?? PACKS["demo-mismatch"];
  return pack.fields as ExtractedField[];
}

/**
 * Returns the list of document IDs that were uploaded in the pack.
 */
export function getUploadedDocuments(packId: string): string[] {
  const pack = PACKS[packId] ?? PACKS["demo-mismatch"];
  return pack.uploadedDocuments;
}

/**
 * Always "fixture" — we do not run live OCR in this prototype.
 * The UI renders "Demo mode — extraction uses prepared verification fixtures"
 * whenever this returns "fixture".
 */
export function getExtractionMode(): "fixture" | "live-pdf" {
  return "fixture";
}

/**
 * Maps uploaded filenames to a pack id.
 * Any filename containing "correct" (case-insensitive) → demo-corrected.
 * Everything else → demo-mismatch.
 * Never crashes on unknown input.
 */
export function resolvePackFromUpload(filenames: string[]): string {
  if (filenames.some((f) => /correct/i.test(f))) {
    return "demo-corrected";
  }
  return "demo-mismatch";
}

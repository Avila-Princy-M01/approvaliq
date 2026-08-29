// lib/documents/index.ts
// Barrel export — import everything from "@/lib/documents"
// This lets Saloni and the API route import directly without waiting for
// API wiring, as per the shared contracts.

export {
  extractDocumentFields,
  getUploadedDocuments,
  getExtractionMode,
  resolvePackFromUpload,
} from "./extract";

export {
  detectContradictions,
} from "./contradictions";

export {
  findMissingDocuments,
  DEFAULT_REQUIRED_DOCUMENTS,
} from "./missing";

export type { MissingDocumentResult } from "./missing";

export {
  calculateReadinessScore,
  deriveStatus,
  getDocumentRiskSignals,
} from "./readiness";

export type { ReadinessInput } from "./readiness";

export {
  predictQueries,
} from "./queries";

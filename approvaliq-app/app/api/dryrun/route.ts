import type { DryRunResult, RequiredDocument } from "@/types";
import {
  extractDocumentFields,
  getUploadedDocuments,
  detectContradictions,
  findMissingDocuments,
  calculateReadinessScore,
  predictQueries,
  deriveStatus,
} from "@/lib/documents";

// ---------------------------------------------------------------------------
// POST /api/dryrun
//
// Request body:
//   {
//     applicationId?: string        — defaults to "A10293"
//     documentPack?: string         — defaults to "demo-mismatch"
//     requiredDocuments?: RequiredDocument[]  — from live simulation
//   }
//
// Response: DryRunResult
//
// If requiredDocuments arrives empty, falls back to the default list so the
// endpoint is independently testable while Shreya's engine is still landing.
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));

    const applicationId: string = body.applicationId ?? "A10293";
    const documentPack: string = body.documentPack ?? "demo-mismatch";
    const requiredDocuments: RequiredDocument[] = body.requiredDocuments ?? [];

    // 1. Extract fields from the fixture pack
    const extractedFields = extractDocumentFields(documentPack);

    // 2. Get uploaded document ids from the pack
    const uploadedDocuments = getUploadedDocuments(documentPack);

    // 3. Detect contradictions across extracted fields
    const contradictions = detectContradictions(extractedFields);

    // 4. Find missing mandatory documents
    //    requiredDocuments should come from the live simulation result:
    //      simulation.approvals.filter(a => a.applies).flatMap(a => a.requiredDocuments)
    //    Falls back to defaults when not provided.
    const { missing, expected, found } = findMissingDocuments(
      requiredDocuments,
      uploadedDocuments
    );

    // 5. Compute readiness breakdown
    const readiness = calculateReadinessScore({
      extractedFields,
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : [],
      uploadedDocuments,
      contradictions,
    });

    // 6. Low-confidence fields for query prediction
    const lowConfidence = extractedFields.filter((f) => f.confidence < 0.8);

    // 7. Predict officer queries
    const predictedQueries = predictQueries(contradictions, missing, lowConfidence);

    // 8. Derive status — blocking override takes precedence over score
    const status = deriveStatus(contradictions, missing);

    const result: DryRunResult = {
      applicationId,
      documentPack,
      extractedFields,
      documentsExpected: expected,
      documentsFound: found,
      missingDocuments: missing,
      contradictions,
      readiness,
      predictedQueries,
      status,
      extractionMode: "fixture",
    };

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 400 });
  }
}

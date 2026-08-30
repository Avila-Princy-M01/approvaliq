import { getOfficerDetail } from "@/lib/officer/queue";

// ---------------------------------------------------------------------------
// POST /api/maitri/applications
//
// Demo mock of a handoff to Maharashtra's MAITRI single-window system.
// This endpoint exists to prove the payload contract and validation layer —
// it NEVER transmits anything to a live government system.
//
// Every field is validated (all failures collected, not just the first), and
// the referenced officer application is confirmed real via getOfficerDetail.
// The response is an explicit demo-mock acknowledgement.
// ---------------------------------------------------------------------------

interface FieldError {
  field: string;
  error: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === "string");
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json();

    const errors: FieldError[] = [];

    if (!isRecord(body)) {
      errors.push({ field: "body", error: "request body must be a JSON object" });
      return Response.json(
        { error: "Invalid payload", fieldErrors: errors },
        { status: 400 }
      );
    }

    // externalApplicationId — must be non-empty and reference a real officer
    // application (validated through getOfficerDetail) so we never mock a
    // handoff for an application the queue doesn't actually know about.
    if (!isNonEmptyString(body.externalApplicationId)) {
      errors.push({
        field: "externalApplicationId",
        error: "must be a non-empty string",
      });
    } else if (!getOfficerDetail(body.externalApplicationId)) {
      errors.push({
        field: "externalApplicationId",
        error: "referenced application not found",
      });
    }

    // applicant
    const applicant = body.applicant;
    if (!isRecord(applicant)) {
      errors.push({ field: "applicant", error: "must be an object" });
    } else {
      for (const key of ["companyName", "registrationNumber", "district"] as const) {
        if (!isNonEmptyString(applicant[key])) {
          errors.push({
            field: `applicant.${key}`,
            error: "must be a non-empty string",
          });
        }
      }
    }

    // approvals
    if (!Array.isArray(body.approvals) || body.approvals.length === 0) {
      errors.push({ field: "approvals", error: "must be a non-empty array" });
    } else {
      body.approvals.forEach((entry, i) => {
        const field = `approvals[${i}]`;
        if (!isRecord(entry)) {
          errors.push({ field, error: "must be an object" });
          return;
        }
        if (!isNonEmptyString(entry.approvalId)) {
          errors.push({
            field: `${field}.approvalId`,
            error: "must be a non-empty string",
          });
        }
        if (!isNonEmptyString(entry.department)) {
          errors.push({
            field: `${field}.department`,
            error: "must be a non-empty string",
          });
        }
        if (!isStringArray(entry.requiredDocuments)) {
          errors.push({
            field: `${field}.requiredDocuments`,
            error: "must be an array of strings",
          });
        }
        if (!isStringArray(entry.clauseIds)) {
          errors.push({
            field: `${field}.clauseIds`,
            error: "must be an array of strings",
          });
        }
      });
    }

    // readinessScore
    const readinessScore = body.readinessScore;
    if (
      typeof readinessScore !== "number" ||
      readinessScore < 0 ||
      readinessScore > 100
    ) {
      errors.push({
        field: "readinessScore",
        error: "must be a number between 0 and 100 inclusive",
      });
    }

    // risk
    const risk = body.risk;
    if (!isRecord(risk)) {
      errors.push({ field: "risk", error: "must be an object" });
    } else {
      if (typeof risk.submissionRisk !== "number") {
        errors.push({ field: "risk.submissionRisk", error: "must be a number" });
      }
      if (
        risk.regulatoryScrutiny !== "low" &&
        risk.regulatoryScrutiny !== "medium" &&
        risk.regulatoryScrutiny !== "high"
      ) {
        errors.push({
          field: "risk.regulatoryScrutiny",
          error: "must be one of \"low\", \"medium\", \"high\"",
        });
      }
    }

    // auditTrail — must be an array; contents are not validated.
    if (!Array.isArray(body.auditTrail)) {
      errors.push({ field: "auditTrail", error: "must be an array" });
    }

    // engineVersion / ruleSetVersion
    if (!isNonEmptyString(body.engineVersion)) {
      errors.push({
        field: "engineVersion",
        error: "must be a non-empty string",
      });
    }
    if (!isNonEmptyString(body.ruleSetVersion)) {
      errors.push({
        field: "ruleSetVersion",
        error: "must be a non-empty string",
      });
    }

    // All validation failures collected — return them together.
    if (errors.length > 0) {
      return Response.json(
        { error: "Invalid payload", fieldErrors: errors },
        { status: 400 }
      );
    }

    return Response.json({
      accepted: true,
      integrationMode: "demo-mock",
      referenceId: `MOCK-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      message:
        "Application package prepared for handoff to the existing single-window ecosystem.",
      note: "This is a prototype mock. No data is transmitted to any government system.",
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
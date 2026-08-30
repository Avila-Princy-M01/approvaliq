import { NextRequest, NextResponse } from "next/server";
import { getOfficerDetail } from "@/lib/officer/queue";
import type {
  Approval,
  RequiredDocument,
} from "@/types";

/**
 * POST /api/demo-handoff
 *
 * Packages an evaluated application for handoff to the Maitri downstream
 * service for demo purposes — no real government system is connected.
 *
 * _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8_
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId } = body as { applicationId?: string };

    // Validate applicationId
    if (!applicationId || typeof applicationId !== "string" || applicationId.trim() === "") {
      return NextResponse.json(
        { error: { code: "MISSING_APPLICATION_ID", message: "applicationId is required" } },
        { status: 400 }
      );
    }

    const detail = getOfficerDetail(applicationId);

    if (!detail) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Application not found" } },
        { status: 404 }
      );
    }

    // Build the handoff package
    const { queueItem, risk, audit } = detail;

    const requiredDocuments: RequiredDocument[] = [];
    const clauseIds: string[] = [];
    const applicableApprovals: Approval[] = [];

    // Build audit summary
    const auditSummary: Record<string, number> = {};
    for (const event of audit) {
      const action = event.action;
      auditSummary[action] = (auditSummary[action] || 0) + 1;
    }

    const package_ = {
      generatedAt: new Date().toISOString(),
      disclaimer: "Demo integration — no data is transmitted to a live government system.",
      applicant: {
        applicationId: queueItem.applicationId,
        companyName: queueItem.companyName,
        district: queueItem.district,
      },
      applicableApprovals,
      requiredDocuments,
      clauseIds: [...new Set(clauseIds)],
      readinessScore: queueItem.readinessScore,
      submissionRisk: risk.submissionRisk,
      regulatoryScrutiny: risk.regulatoryScrutiny,
      auditSummary,
      engineVersion: "demo-2026.08",
      ruleSetVersion: "2026.08.1",
    };

    return NextResponse.json(package_);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate handoff package" } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  approveApplication,
  rejectApplication,
  requestClarification,
  overrideRecommendation,
} from "@/lib/officer/queue";
import { getAuditTrail } from "@/lib/store/auditStore";

/**
 * POST /api/officer/decision
 *
 * Submits an officer decision action on an application.
 *
 * _Requirements: 6.6, 6.7, 7.7_
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, action, reason, officerName } = body as {
      applicationId?: string;
      action?: string;
      reason?: string;
      officerName?: string;
    };

    // Validate applicationId
    if (!applicationId || typeof applicationId !== "string" || applicationId.trim() === "") {
      return NextResponse.json(
        { error: { code: "MISSING_APPLICATION_ID", message: "applicationId is required" } },
        { status: 400 }
      );
    }

    // Validate action
    if (!action || !["approve", "reject", "clarification_requested", "override"].includes(action)) {
      return NextResponse.json(
        { error: { code: "INVALID_ACTION", message: "Invalid action" } },
        { status: 400 }
      );
    }

    // Validate reason for reject and override
    if ((action === "reject" || action === "override") && (!reason || reason.trim() === "")) {
      return NextResponse.json(
        { error: { code: "REASON_REQUIRED", message: "A reason is required for reject and override actions" } },
        { status: 400 }
      );
    }

    const actor = officerName || "Officer (Demo)";

    // Record audit trail length before the decision
    const trailBefore = getAuditTrail(applicationId).length;

    let auditRecord!: Awaited<ReturnType<typeof approveApplication>>;
    switch (action) {
      case "approve":
        auditRecord = approveApplication(applicationId, actor);
        break;
      case "reject":
        auditRecord = rejectApplication(applicationId, actor, reason!);
        break;
      case "clarification_requested":
        auditRecord = requestClarification(applicationId, actor, reason || "Clarification requested");
        break;
      case "override":
        auditRecord = overrideRecommendation(applicationId, actor, reason!);
        break;
    }

    // Verify audit trail was updated
    const trailAfter = getAuditTrail(applicationId).length;
    if (trailAfter <= trailBefore) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to record audit event" } },
        { status: 500 }
      );
    }

    // Map action to new status
    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      clarification_requested: "clarification-requested",
      override: "approved",
    };

    return NextResponse.json({
      applicationId,
      status: statusMap[action],
      auditEventId: auditRecord.id,
      updatedAt: auditRecord.timestamp,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process decision" } },
      { status: 500 }
    );
  }
}

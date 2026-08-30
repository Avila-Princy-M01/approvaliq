import { NextRequest, NextResponse } from "next/server";
import { getAuditTrail } from "@/lib/store/auditStore";

/**
 * GET /api/officer/audit/[applicationId]
 *
 * Returns the audit trail for an application, sorted ascending by timestamp.
 *
 * _Requirements: 7.1, 7.8_
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const trail = getAuditTrail(applicationId);

    // If no audit trail exists, the application doesn't exist
    if (trail.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Application not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(trail);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch audit trail" } },
      { status: 500 }
    );
  }
}

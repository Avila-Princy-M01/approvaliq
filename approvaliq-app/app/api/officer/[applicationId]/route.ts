import { NextRequest, NextResponse } from "next/server";
import { getOfficerDetail } from "@/lib/officer/queue";

/**
 * GET /api/officer/[applicationId]
 *
 * Returns the full officer detail for one application.
 *
 * _Requirements: 6.1, 6.2_
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const detail = getOfficerDetail(applicationId);

    if (!detail) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Application not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(detail);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch application detail" } },
      { status: 500 }
    );
  }
}

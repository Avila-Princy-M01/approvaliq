import { getOfficerDetail } from "@/lib/officer/queue";

// ---------------------------------------------------------------------------
// GET /api/officer/[id]
//
// Response: { queueItem, risk, audit } for one application, or 404 when the
//           applicationId is not one of the demo applications.
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const detail = getOfficerDetail(id);
    if (!detail) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    return Response.json(detail);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
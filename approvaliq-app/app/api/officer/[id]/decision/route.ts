import {
  approveApplication,
  requestClarification,
  rejectApplication,
  overrideRecommendation,
} from "@/lib/officer/queue";
import { getAuditTrail } from "@/lib/store/auditStore";

// ---------------------------------------------------------------------------
// POST /api/officer/[id]/decision
//
// Request body:
//   {
//     action: "approve" | "request-clarification" | "reject" | "override",
//     reason?: string        — required (>= 10 chars) for clarification,
//                              reject, and override
//   }
//
// Response:
//   { ok: true, audit: AuditRecord[] }   — on success
//   { ok: false, error: string }         — on validation failure (400)
// ---------------------------------------------------------------------------

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const { action, reason } = await req.json();

    switch (action) {
      case "approve":
        approveApplication(id, "officer-demo");
        break;
      case "request-clarification":
        requestClarification(id, "officer-demo", reason);
        break;
      case "reject":
        rejectApplication(id, "officer-demo", reason);
        break;
      case "override":
        overrideRecommendation(id, "officer-demo", reason);
        break;
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    return Response.json({ ok: true, audit: getAuditTrail(id) });
  } catch (e) {
    return Response.json(
      { ok: false, error: (e as Error).message },
      { status: 400 }
    );
  }
}
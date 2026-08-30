import { getOfficerQueue } from "@/lib/officer/queue";

// ---------------------------------------------------------------------------
// GET /api/officer/queue
//
// Response: OfficerQueueItem[] — the full triage-ordered officer queue.
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  try {
    return Response.json(getOfficerQueue());
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
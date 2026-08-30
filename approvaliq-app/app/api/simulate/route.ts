import type { SimulationResult } from "@/types";
import {
  evaluateApprovals,
  calculateSimulationSummary,
} from "@/lib/engine";

// ---------------------------------------------------------------------------
// POST /api/simulate
//
// Request body:
//   { profile: BusinessProfile }
//
// Response: SimulationResult (profile + approvals + summary + metadata)
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  try {
    const { profile } = await req.json();
    if (!profile) {
      return Response.json({ error: "profile is required" }, { status: 400 });
    }

    const approvals = evaluateApprovals(profile);
    const summary = calculateSimulationSummary(approvals);

    const result = {
      profile,
      approvals,
      summary,
      engineVersion: "demo-2026.08",
      ruleSetVersion: "2026.08.1",
      generatedAt: new Date().toISOString(),
    } satisfies SimulationResult;

    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
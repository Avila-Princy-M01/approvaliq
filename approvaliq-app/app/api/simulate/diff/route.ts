import {
  evaluateApprovals,
  calculateSimulationSummary,
  compareSimulations,
} from "@/lib/engine";

// ---------------------------------------------------------------------------
// POST /api/simulate/diff
//
// Request body:
//   {
//     previousProfile: BusinessProfile,
//     currentProfile: BusinessProfile
//   }
//
// Response: SimulationDiff — added/removed approvals & documents, days/fee/risk
//           deltas, and the rule ids whose matched state flipped.
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  try {
    const { previousProfile, currentProfile } = await req.json();
    if (!previousProfile || !currentProfile) {
      return Response.json(
        { error: "previousProfile and currentProfile are required" },
        { status: 400 }
      );
    }

    const prevApprovals = evaluateApprovals(previousProfile);
    const currApprovals = evaluateApprovals(currentProfile);

    const prev = {
      profile: previousProfile,
      approvals: prevApprovals,
      summary: calculateSimulationSummary(prevApprovals),
      engineVersion: "demo-2026.08",
      ruleSetVersion: "2026.08.1",
      generatedAt: new Date().toISOString(),
    };
    const curr = {
      profile: currentProfile,
      approvals: currApprovals,
      summary: calculateSimulationSummary(currApprovals),
      engineVersion: "demo-2026.08",
      ruleSetVersion: "2026.08.1",
      generatedAt: new Date().toISOString(),
    };

    return Response.json(compareSimulations(prev, curr));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
import {
  calculateChangeImpact,
  seedBusinesses,
} from "@/lib/engine/changeImpact";

// ---------------------------------------------------------------------------
// POST /api/change-impact
//
// Request body:
//   {
//     ruleId: string,          — e.g. "factory-license-workers-power"
//     conditionIndex: number,  — index of the condition whose threshold changes
//     newValue: number         — the hypothetical new threshold value
//   }
//
// Response: ChangeImpactResult — old/new value plus the seed businesses whose
//           required-approval set changed under the revised threshold.
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  try {
    const { ruleId, conditionIndex, newValue } = await req.json();
    if (
      typeof ruleId !== "string" ||
      typeof conditionIndex !== "number" ||
      typeof newValue !== "number"
    ) {
      return Response.json(
        {
          error:
            "ruleId (string), conditionIndex (number), and newValue (number) are required",
        },
        { status: 400 }
      );
    }

    const result = calculateChangeImpact(
      ruleId,
      conditionIndex,
      newValue,
      seedBusinesses
    );
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
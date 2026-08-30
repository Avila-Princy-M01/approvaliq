/**
 * Property tests for the Decision Explanation Layer (lib/explanation/explain.ts).
 *
 * Property 5: Decision traces are well-formed
 * **Validates: Requirements 2.1**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildDecisionTraces } from "../lib/explanation/explain";
import { evaluateApprovals } from "../lib/engine/evaluate";
import type { BusinessProfile } from "../types/index";

// ---------------------------------------------------------------------------
// Property 5: Decision traces are well-formed
// ---------------------------------------------------------------------------

describe("Decision Explanation — Property 5: decision traces are well-formed", () => {
  it("every trace has non-empty ruleId, condition, boolean matched, non-empty clauseId, and citation is Citation or null", () => {
    const arbProfile: fc.Arbitrary<BusinessProfile> = fc.record({
      industry: fc.constantFrom("food-processing", "chemicals", "textiles", "engineering"),
      district: fc.constantFrom("Pune", "Nagpur", "Nashik"),
      areaSqFt: fc.integer({ min: 100, max: 50000 }),
      investmentCrore: fc.integer({ min: 1, max: 200 }),
      employees: fc.integer({ min: 1, max: 200 }),
      usesPower: fc.boolean(),
      hasBoiler: fc.boolean(),
      hazardousMaterials: fc.boolean(),
      generatesHazardousWaste: fc.boolean(),
      projectStage: fc.constantFrom("operating", "planning" as const),
    });

    fc.assert(
      fc.property(arbProfile, (profile) => {
        const approvals = evaluateApprovals(profile);

        for (const approval of approvals) {
          const traces = buildDecisionTraces(profile, approval);

          for (const trace of traces) {
            // ruleId must be a non-empty string
            expect(typeof trace.ruleId).toBe("string");
            expect(trace.ruleId.length).toBeGreaterThan(0);

            // condition must be a non-empty string
            expect(typeof trace.condition).toBe("string");
            expect(trace.condition.length).toBeGreaterThan(0);

            // matched must be a boolean
            expect(typeof trace.matched).toBe("boolean");

            // clauseId must be a non-empty string
            expect(typeof trace.clauseId).toBe("string");
            expect(trace.clauseId.length).toBeGreaterThan(0);

            // citation must be a Citation object or null (never undefined)
            expect(trace.citation === null || typeof trace.citation === "object").toBe(true);
            if (trace.citation !== null) {
              expect(typeof trace.citation.clauseId).toBe("string");
              expect(typeof trace.citation.sourceTitle).toBe("string");
              expect(typeof trace.citation.verificationStatus).toBe("string");
            }
          }
        }
      })
    );
  });
});

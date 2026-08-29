/**
 * Property tests for seed business data fixture.
 *
 * **Validates: Requirements 8.2**
 *
 * Property 11: Seed businesses have complete BusinessProfile fields.
 * Every business in the seed fixture must expose the required fields
 * with correct types so the simulation engine can operate on them
 * without defensive null-checks.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import businesses from "../data/seed/businesses.json";
import type { BusinessProfile } from "../types/index";

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/** Returns true iff `b` satisfies every required BusinessProfile field. */
function hasAllRequiredFields(b: unknown): boolean {
  if (b === null || typeof b !== "object") return false;
  const profile = b as Record<string, unknown>;

  // string fields
  if (typeof profile.industry !== "string" || profile.industry.trim() === "") return false;
  if (typeof profile.district !== "string" || profile.district.trim() === "") return false;

  // number fields (must be finite, non-negative)
  if (typeof profile.areaSqFt !== "number" || !Number.isFinite(profile.areaSqFt) || profile.areaSqFt < 0)
    return false;
  if (
    typeof profile.investmentCrore !== "number" ||
    !Number.isFinite(profile.investmentCrore) ||
    profile.investmentCrore < 0
  )
    return false;
  if (
    typeof profile.employees !== "number" ||
    !Number.isFinite(profile.employees) ||
    profile.employees < 0
  )
    return false;

  // boolean fields
  if (typeof profile.usesPower !== "boolean") return false;
  if (typeof profile.hasBoiler !== "boolean") return false;
  if (typeof profile.hazardousMaterials !== "boolean") return false;
  if (typeof profile.generatesHazardousWaste !== "boolean") return false;

  // projectStage enum
  const validStages: BusinessProfile["projectStage"][] = ["planning", "construction", "operating"];
  if (!validStages.includes(profile.projectStage as BusinessProfile["projectStage"])) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Property test — Property 11
// ---------------------------------------------------------------------------

describe("Seed businesses — Property 11: all required BusinessProfile fields are present", () => {
  it("every seed business passes hasAllRequiredFields (property-based)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...businesses), (b) => hasAllRequiredFields(b))
    );
  });
});

// ---------------------------------------------------------------------------
// Unit / coverage tests
// ---------------------------------------------------------------------------

describe("Seed businesses — coverage checks", () => {
  it("has between 12 and 15 businesses", () => {
    expect(businesses.length).toBeGreaterThanOrEqual(12);
    expect(businesses.length).toBeLessThanOrEqual(15);
  });

  it("covers at least 4 distinct industries", () => {
    const industries = new Set(businesses.map((b) => b.industry));
    expect(industries.size).toBeGreaterThanOrEqual(4);
  });

  it("covers at least 3 distinct districts", () => {
    const districts = new Set(businesses.map((b) => b.district));
    expect(districts.size).toBeGreaterThanOrEqual(3);
  });

  it("contains both 'operating' and 'planning' project stages", () => {
    const stages = new Set(businesses.map((b) => b.projectStage));
    expect(stages.has("operating")).toBe(true);
    expect(stages.has("planning")).toBe(true);
  });

  it("all IDs follow the seed-NN format", () => {
    for (const b of businesses) {
      expect(b.id).toMatch(/^seed-\d{2}$/);
    }
  });
});

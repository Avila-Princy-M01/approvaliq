/**
 * Property tests for the Risk Engine (lib/risk/risk.ts).
 *
 * Property 6: Submission risk output is well-formed and level matches score
 * Property 7: Submission risk conditional factors are present when triggered
 * Property 8: Regulatory scrutiny level matches factor count
 * Property 9: Regulatory scrutiny conditional factors are present when triggered
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeSubmissionRisk,
  computeRegulatoryScrutiny,
} from "../lib/risk/risk";
import { simulate } from "../lib/simulation/simulate";
import type {
  DocumentRiskSignals,
  BusinessProfile,
  SimulationResult,
} from "../types/index";

// ---------------------------------------------------------------------------
// Property 6: Submission risk output is well-formed and level matches score
// ---------------------------------------------------------------------------

describe("Risk Engine — Property 6: submission risk output is well-formed", () => {
  it("score in [0,100], level matches thresholds, factors.length >= 1", () => {
    const arbSignals: fc.Arbitrary<DocumentRiskSignals> = fc.record({
      blockingCount: fc.nat(10),
      warningCount: fc.nat(10),
      missingMandatoryCount: fc.nat(10),
      lowConfidenceCount: fc.nat(10),
      verifiedFieldCount: fc.nat(10),
      readinessOverall: fc.integer({ min: 0, max: 100 }),
      status: fc.constantFrom("ready", "blocked", "needs-review" as const),
      topIssue: fc.option(fc.string()),
      evidence: fc.array(fc.string()),
    });

    fc.assert(
      fc.property(arbSignals, (signals) => {
        const result = computeSubmissionRisk(signals);

        // Score must be in [0, 100]
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);

        // Level must match thresholds
        if (result.score >= 70) {
          expect(result.level).toBe("high");
        } else if (result.score >= 40) {
          expect(result.level).toBe("medium");
        } else {
          expect(result.level).toBe("low");
        }

        // Must have at least one factor
        expect(result.factors.length).toBeGreaterThanOrEqual(1);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Submission risk conditional factors are present when triggered
// ---------------------------------------------------------------------------

describe("Risk Engine — Property 7: submission risk conditional factors", () => {
  it("blockingCount > 0 → 'Blocking contradictions' factor present", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (blockingCount) => {
          const signals: DocumentRiskSignals = {
            blockingCount,
            warningCount: 0,
            missingMandatoryCount: 0,
            lowConfidenceCount: 0,
            verifiedFieldCount: 0,
            readinessOverall: 80,
            status: "ready",
            topIssue: null,
            evidence: [],
          };
          const result = computeSubmissionRisk(signals);
          expect(result.factors.some((f) => f.label === "Blocking contradictions")).toBe(true);
        }
      )
    );
  });

  it("missingMandatoryCount > 0 → 'Missing mandatory documents' factor present", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (missingMandatoryCount) => {
          const signals: DocumentRiskSignals = {
            blockingCount: 0,
            warningCount: 0,
            missingMandatoryCount,
            lowConfidenceCount: 0,
            verifiedFieldCount: 0,
            readinessOverall: 80,
            status: "ready",
            topIssue: null,
            evidence: [],
          };
          const result = computeSubmissionRisk(signals);
          expect(result.factors.some((f) => f.label === "Missing mandatory documents")).toBe(true);
        }
      )
    );
  });

  it("readinessOverall < 60 → 'Low readiness score' factor present", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 59 }),
        (readinessOverall) => {
          const signals: DocumentRiskSignals = {
            blockingCount: 0,
            warningCount: 0,
            missingMandatoryCount: 0,
            lowConfidenceCount: 0,
            verifiedFieldCount: 0,
            readinessOverall,
            status: "ready",
            topIssue: null,
            evidence: [],
          };
          const result = computeSubmissionRisk(signals);
          expect(result.factors.some((f) => f.label === "Low readiness score")).toBe(true);
        }
      )
    );
  });

  it("lowConfidenceCount > 0 → 'Low-confidence extractions' factor present", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (lowConfidenceCount) => {
          const signals: DocumentRiskSignals = {
            blockingCount: 0,
            warningCount: 0,
            missingMandatoryCount: 0,
            lowConfidenceCount,
            verifiedFieldCount: 0,
            readinessOverall: 80,
            status: "ready",
            topIssue: null,
            evidence: [],
          };
          const result = computeSubmissionRisk(signals);
          expect(result.factors.some((f) => f.label === "Low-confidence extractions")).toBe(true);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Regulatory scrutiny level matches factor count
// ---------------------------------------------------------------------------

describe("Risk Engine — Property 8: regulatory scrutiny level matches factor count", () => {
  it("level is high when 3+ factors, medium when 1-2, low when 0", () => {
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
        // Count how many factors will be generated
        let expectedFactorCount = 0;
        if (profile.hasBoiler) expectedFactorCount++;
        if (profile.hazardousMaterials || profile.generatesHazardousWaste) expectedFactorCount++;
        if (profile.employees >= 100) expectedFactorCount++;

        // Use a profile with many applicable approvals to test the "multiple approvals" factor
        const simProfile: BusinessProfile = {
          ...profile,
          employees: Math.max(profile.employees, 10),
          usesPower: true,
        };
        const simulation = simulate(simProfile);
        const applicableCount = simulation.approvals.filter((a) => a.applies).length;
        if (applicableCount >= 3) expectedFactorCount++;

        const result = computeRegulatoryScrutiny(profile, simulation);

        // Level must match factor count
        if (expectedFactorCount >= 3) {
          expect(result.level).toBe("high");
        } else if (expectedFactorCount >= 1) {
          expect(result.level).toBe("medium");
        } else {
          expect(result.level).toBe("low");
        }
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Regulatory scrutiny conditional factors are present when triggered
// ---------------------------------------------------------------------------

describe("Risk Engine — Property 9: regulatory scrutiny conditional factors", () => {
  it("hasBoiler: true → 'Boiler installation' factor present", () => {
    fc.assert(
      fc.property(fc.constantFrom("Pune", "Nagpur", "Nashik"), (district) => {
        const profile: BusinessProfile = {
          industry: "textiles",
          district,
          areaSqFt: 5000,
          investmentCrore: 5,
          employees: 30,
          usesPower: true,
          hasBoiler: true,
          hazardousMaterials: false,
          generatesHazardousWaste: false,
          projectStage: "operating",
        };
        const simulation = simulate(profile);
        const result = computeRegulatoryScrutiny(profile, simulation);
        expect(result.factors.some((f) => f.label === "Boiler installation")).toBe(true);
      })
    );
  });

  it("hazardousMaterials: true → 'Hazardous process or waste' factor present", () => {
    const profile: BusinessProfile = {
      industry: "chemicals",
      district: "Nashik",
      areaSqFt: 5000,
      investmentCrore: 5,
      employees: 30,
      usesPower: true,
      hasBoiler: false,
      hazardousMaterials: true,
      generatesHazardousWaste: false,
      projectStage: "operating",
    };
    const simulation = simulate(profile);
    const result = computeRegulatoryScrutiny(profile, simulation);
    expect(result.factors.some((f) => f.label === "Hazardous process or waste")).toBe(true);
  });

  it("generatesHazardousWaste: true → 'Hazardous process or waste' factor present", () => {
    const profile: BusinessProfile = {
      industry: "chemicals",
      district: "Nashik",
      areaSqFt: 5000,
      investmentCrore: 5,
      employees: 30,
      usesPower: true,
      hasBoiler: false,
      hazardousMaterials: false,
      generatesHazardousWaste: true,
      projectStage: "operating",
    };
    const simulation = simulate(profile);
    const result = computeRegulatoryScrutiny(profile, simulation);
    expect(result.factors.some((f) => f.label === "Hazardous process or waste")).toBe(true);
  });

  it("employees >= 100 → 'Large workforce' factor present", () => {
    const profile: BusinessProfile = {
      industry: "metals",
      district: "Solapur",
      areaSqFt: 20000,
      investmentCrore: 20,
      employees: 150,
      usesPower: true,
      hasBoiler: false,
      hazardousMaterials: false,
      generatesHazardousWaste: false,
      projectStage: "operating",
    };
    const simulation = simulate(profile);
    const result = computeRegulatoryScrutiny(profile, simulation);
    expect(result.factors.some((f) => f.label === "Large workforce")).toBe(true);
  });

  it("3+ applicable approvals → 'Multiple applicable approvals' factor present", () => {
    const profile: BusinessProfile = {
      industry: "chemicals",
      district: "Nashik",
      areaSqFt: 5000,
      investmentCrore: 5,
      employees: 30,
      usesPower: true,
      hasBoiler: false,
      hazardousMaterials: true,
      generatesHazardousWaste: false,
      projectStage: "operating",
    };
    const simulation = simulate(profile);
    const applicableCount = simulation.approvals.filter((a) => a.applies).length;
    if (applicableCount >= 3) {
      const result = computeRegulatoryScrutiny(profile, simulation);
      expect(result.factors.some((f) => f.label === "Multiple applicable approvals")).toBe(true);
    }
  });
});

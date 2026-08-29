/**
 * Property tests for the Citation Store (lib/citations).
 *
 * Property 1: Citation round-trip
 * **Validates: Requirements 1.2**
 *
 * Property 2: Unknown clause IDs return null safely
 * **Validates: Requirements 1.3, 1.10**
 *
 * Property 3: Unverified clause IDs filter
 * **Validates: Requirements 1.5**
 *
 * Property 4: getClauseText consistency
 * **Validates: Requirements 1.6**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getCitation,
  getClauseText,
  getAllClauseIds,
  getUnverifiedClauseIds,
} from "../lib/citations/index";
import { citationStore } from "../lib/citations/citations";

// ---------------------------------------------------------------------------
// Smoke test — sanity guard before running property tests
// ---------------------------------------------------------------------------

describe("Citation Store — smoke tests", () => {
  it("getAllClauseIds() returns a non-empty array", () => {
    const ids = getAllClauseIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Property 1: Citation round-trip
// ---------------------------------------------------------------------------

describe("Citation Store — Property 1: citation round-trip", () => {
  it("getCitation returns non-null for every known clauseId with matching clauseId field", () => {
    const ids = getAllClauseIds();
    fc.assert(
      fc.property(fc.constantFrom(...ids), (id) => {
        const citation = getCitation(id);
        return citation !== null && citation.clauseId === id;
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Unknown clause IDs return null safely
// ---------------------------------------------------------------------------

describe("Citation Store — Property 2: unknown clause IDs return null safely", () => {
  it("getCitation returns null (without throwing) for arbitrary strings not in the store", () => {
    const knownIds = new Set(getAllClauseIds());

    fc.assert(
      fc.property(fc.string(), (s) => {
        fc.pre(!knownIds.has(s));
        let result: ReturnType<typeof getCitation>;
        expect(() => {
          result = getCitation(s);
        }).not.toThrow();
        expect(result!).toBeNull();
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Unverified clause IDs filter
// ---------------------------------------------------------------------------

describe("Citation Store — Property 3: unverified clause IDs filter", () => {
  it("every ID from getUnverifiedClauseIds() has verificationStatus 'needs-review'", () => {
    const unverifiedIds = getUnverifiedClauseIds();

    expect(unverifiedIds.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(fc.constantFrom(...unverifiedIds), (id) => {
        const citation = getCitation(id);
        expect(citation).not.toBeNull();
        expect(citation?.verificationStatus).toBe("needs-review");
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: getClauseText consistency
// ---------------------------------------------------------------------------

describe("Citation Store — Property 4: getClauseText consistency", () => {
  it("getClauseText returns a non-null string for every known clause ID", () => {
    const allIds = getAllClauseIds();
    expect(allIds.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(fc.constantFrom(...allIds), (id) => {
        const text = getClauseText(id);
        expect(text).not.toBeNull();
        expect(typeof text).toBe("string");
        expect((text as string).length).toBeGreaterThan(0);
      })
    );
  });

  it("getClauseText is idempotent — same ID always returns the same value", () => {
    const allIds = getAllClauseIds();

    fc.assert(
      fc.property(fc.constantFrom(...allIds), (id) => {
        const first = getClauseText(id);
        const second = getClauseText(id);
        expect(first).toBe(second);
      })
    );
  });
});

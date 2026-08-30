/**
 * Property tests for the Audit Store (lib/store/auditStore.ts).
 *
 * Property 10: Audit trail is append-only and ordered
 * **Validates: Requirements 7.8, 7.9**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { appendAuditEvent, getAuditTrail } from "../lib/store/auditStore";

// ---------------------------------------------------------------------------
// Property 10: Audit trail is append-only and ordered
// ---------------------------------------------------------------------------

describe("Audit Store — Property 10: append-only and ordered", () => {
  it("each appendStrictly increases length by 1 and trail remains sorted ascending by timestamp", () => {
    const applicationId = `test-app-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        // Record the current length before our sequence
        const initialLength = getAuditTrail(applicationId).length;

        for (let i = 0; i < count; i++) {
          const before = getAuditTrail(applicationId).length;
          appendAuditEvent({
            applicationId,
            actor: `test-actor-${i}`,
            actorType: "system",
            action: "evaluation",
            reason: null,
            details: { index: i },
            timestamp: new Date(Date.now() + i).toISOString(),
          });
          const after = getAuditTrail(applicationId).length;
          expect(after).toBe(before + 1);
        }

        // Verify sorted ascending by timestamp
        const trail = getAuditTrail(applicationId);
        expect(trail.length).toBe(initialLength + count);

        for (let i = 1; i < trail.length; i++) {
          expect(trail[i].timestamp >= trail[i - 1].timestamp).toBe(true);
        }
      })
    );
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getScenario } from "@runbookpilot/core";
import { issueApprovalToken, verifyApprovalToken } from "./approval-token.js";

const secret = "test-secret-at-least-32-characters-long";

describe("approval tokens", () => {
  it("binds the action summary and idempotency key to a signed five-minute token", () => {
    const diagnosis = getScenario("bad-release")!.heuristic;
    const issued = issueApprovalToken({
      runId: randomUUID(),
      scenarioId: "bad-release",
      diagnosis,
      secret,
      now: 1_700_000_000
    });
    const verified = verifyApprovalToken(issued.token, secret, 1_700_000_299);
    expect(verified.action.tool).toBe("rollback_release");
    expect(verified.expiresAt - verified.issuedAt).toBe(300);
    expect(verified.idempotencyKey).toMatch(/[0-9a-f-]{36}/);
  });

  it("rejects tampering, forgery, and expiry with explicit errors", () => {
    const issued = issueApprovalToken({
      runId: randomUUID(),
      scenarioId: "bad-release",
      diagnosis: getScenario("bad-release")!.heuristic,
      secret,
      now: 100,
      ttlSeconds: 5
    });
    expect(() => verifyApprovalToken(`${issued.token}x`, secret, 101)).toThrow(/signature/i);
    expect(() => verifyApprovalToken(issued.token, "wrong-secret", 101)).toThrow(/signature/i);
    expect(() => verifyApprovalToken(issued.token, secret, 106)).toThrow(/expired/i);
  });
});

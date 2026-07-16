import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "./policy.js";
import { getScenario } from "./scenarios.js";

describe("deterministic policy", () => {
  it("requires approval for the expected rollback", () => {
    const scenario = getScenario("bad-release")!;
    const decision = evaluatePolicy(scenario, scenario.heuristic.recommendedAction);
    expect(decision).toMatchObject({ allowed: true, requiresApproval: true, risk: "high" });
  });

  it("blocks a target outside the scenario allowlist", () => {
    const scenario = getScenario("bad-release")!;
    const decision = evaluatePolicy(scenario, {
      ...scenario.heuristic.recommendedAction,
      target: "payments-production"
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/allowlist/i);
  });

  it("allows a read-only close without approval", () => {
    const scenario = getScenario("noisy-alert")!;
    expect(evaluatePolicy(scenario, scenario.heuristic.recommendedAction)).toMatchObject({
      allowed: true,
      requiresApproval: false,
      risk: "low"
    });
  });
});

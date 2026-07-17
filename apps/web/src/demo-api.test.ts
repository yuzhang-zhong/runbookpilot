import { describe, expect, it } from "vitest";
import { demoApi } from "./demo-api.js";

describe("GitHub Pages deterministic demo", () => {
  it("keeps a mutation behind approval and verifies recovery", async () => {
    const run = await demoApi.createRun("bad-release");

    expect(run.status).toBe("awaiting_approval");
    expect(run.toolEvents).toHaveLength(4);
    expect(run.approval?.action).toBe("rollback_release");

    const resolved = await demoApi.approve(run.approval!.token);
    expect(resolved.status).toBe("resolved");
    expect(resolved.approval).toBeUndefined();
    expect(resolved.outcome?.recovered).toBe(true);
    expect(resolved.toolEvents.map((item) => item.tool)).toContain("verify_health");
  });

  it("does not invent a local mutation for a dependency outage", async () => {
    const run = await demoApi.createRun("dependency-outage");

    expect(run.status).toBe("escalated");
    expect(run.approval).toBeUndefined();
    expect(run.outcome?.action).toBe("none");
  });
});

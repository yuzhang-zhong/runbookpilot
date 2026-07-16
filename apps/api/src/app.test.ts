import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const app = createApp({
  qwenApiKey: "",
  approvalSecret: "integration-test-secret-at-least-32-characters",
  allowedOrigin: "http://localhost:5173",
  deployment: "local"
});

describe("RunbookPilot API", () => {
  it("reports health without revealing secrets", async () => {
    const response = await app.request("/api/health");
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok", qwenConfigured: false, mode: "simulation" });
    expect(JSON.stringify(body)).not.toContain("integration-test-secret");
  });

  it("runs the complete diagnosis, approval, rollback, and verification flow", async () => {
    const runResponse = await app.request("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenarioId: "bad-release" })
    });
    const run = await runResponse.json();
    expect(runResponse.status).toBe(201);
    expect(run.status).toBe("awaiting_approval");
    expect(run.toolEvents.map((event: { tool: string }) => event.tool)).toEqual([
      "query_metrics",
      "search_logs",
      "inspect_deployment",
      "check_dependencies"
    ]);

    const approve = () =>
      app.request("/api/runs/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approvalToken: run.approval.token })
      });
    const firstResponse = await approve();
    const first = await firstResponse.json();
    const secondResponse = await approve();
    const second = await secondResponse.json();
    expect(first).toMatchObject({ status: "resolved", outcome: { recovered: true } });
    expect(first.toolEvents.map((event: { phase: string }) => event.phase)).toEqual([
      "mutate",
      "verify"
    ]);
    expect(second.outcome).toEqual(first.outcome);
  });

  it("treats prompt injection as untrusted evidence and never bypasses approval", async () => {
    const response = await app.request("/api/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenarioId: "prompt-injection" })
    });
    const run = await response.json();
    expect(run.status).toBe("awaiting_approval");
    expect(run.policy).toMatchObject({ allowed: true, requiresApproval: true });
    expect(
      run.toolEvents.some((event: { resultSummary: string }) =>
        event.resultSummary.includes("untrusted-data")
      )
    ).toBe(true);
  });

  it("fails closed on an altered approval token", async () => {
    const response = await app.request("/api/runs/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approvalToken: "altered.token.with-enough-characters" })
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/invalid/i) });
  });
});

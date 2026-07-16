import { describe, expect, it } from "vitest";
import { getScenario } from "@runbookpilot/core";
import { createMcpRuntime } from "./mcp-runtime.js";

describe("in-process MCP boundary", () => {
  it("lists the seven bounded SRE tools through the MCP protocol", async () => {
    const runtime = await createMcpRuntime(getScenario("bad-release")!);
    try {
      expect((await runtime.listTools()).map((tool) => tool.name)).toEqual([
        "query_metrics",
        "search_logs",
        "inspect_deployment",
        "check_dependencies",
        "restart_canary",
        "rollback_release",
        "verify_health"
      ]);
    } finally {
      await runtime.close();
    }
  });

  it("rejects mutation calls unless the orchestrator verified approval", async () => {
    const runtime = await createMcpRuntime(getScenario("bad-release")!);
    try {
      await expect(
        runtime.callTool("rollback_release", { service: "checkout-api" })
      ).rejects.toThrow(/approval/i);
    } finally {
      await runtime.close();
    }
  });
});

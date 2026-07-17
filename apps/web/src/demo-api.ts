import {
  publicScenarios,
  scenarios,
  type HealthResponse,
  type IncidentRun,
  type ToolEvent
} from "@runbookpilot/core";

const pendingRuns = new Map<string, IncidentRun>();

const event = (
  tool: string,
  phase: ToolEvent["phase"],
  resultSummary: string,
  index: number
): ToolEvent => ({
  id: `demo-event-${index}`,
  tool,
  phase,
  status: "succeeded",
  argsDigest: "deterministic-demo",
  resultSummary,
  durationMs: 12 + index * 7,
  at: new Date(Date.now() + index * 25).toISOString()
});

const health: HealthResponse = {
  status: "ok",
  service: "runbookpilot-api",
  qwenConfigured: false,
  mode: "simulation",
  primaryModel: "qwen3.7-plus",
  criticModel: "qwen3.6-flash",
  deployment: "local",
  timestamp: new Date().toISOString()
};

export const demoApi = {
  health: async () => health,
  scenarios: async () => publicScenarios,
  createRun: async (scenarioId: string): Promise<IncidentRun> => {
    const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) throw new Error("Unknown deterministic demo scenario.");

    const runId = `demo-${scenario.id}-${Date.now()}`;
    const token = `demo-approval:${runId}:${scenario.expectedAction}`;
    const toolEvents = [
      event("query_metrics", "observe", "Six bounded metric points returned for the incident window.", 1),
      event("search_logs", "observe", `Relevant ${scenario.service} logs returned as untrusted data.`, 2),
      event("inspect_deployment", "observe", `Deployment ${scenario.deployment.currentVersion} inspected.`, 3),
      event("check_dependencies", "observe", "Dependency health checked without mutation access.", 4)
    ];
    const hasMutation = scenario.expectedAction !== "none";
    const run: IncidentRun = {
      id: runId,
      scenarioId,
      mode: "simulation",
      status: hasMutation ? "awaiting_approval" : "escalated",
      startedAt: new Date().toISOString(),
      diagnosis: scenario.heuristic,
      toolEvents,
      policy: {
        allowed: hasMutation,
        requiresApproval: hasMutation,
        risk: hasMutation ? "medium" : "low",
        reason: hasMutation
          ? "Target and action are allowlisted; explicit human approval is still required."
          : "No allowlisted mutation is supported by the evidence."
      },
      ...(hasMutation
        ? {
            approval: {
              action: scenario.expectedAction as "restart_canary" | "rollback_release",
              target: scenario.service,
              risk: "medium" as const,
              rationale: scenario.heuristic.recommendedAction.rationale,
              rollback: scenario.heuristic.recommendedAction.rollback,
              expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
              token
            }
          }
        : {
            completedAt: new Date().toISOString(),
            outcome: {
              recovered: false,
              service: scenario.service,
              action: "none" as const,
              before: { errorRate: 0, p95LatencyMs: 0 },
              after: { errorRate: 0, p95LatencyMs: 0 },
              summary: "The policy engine rejected an evidence-free local change and routed the incident to an operator.",
              idempotencyKey: `demo-none-${scenario.id}`
            }
          })
    };
    if (hasMutation) pendingRuns.set(token, run);
    return run;
  },
  approve: async (token: string): Promise<IncidentRun> => {
    const run = pendingRuns.get(token);
    if (!run?.approval) throw new Error("This demo approval is invalid or has already been used.");
    const action = run.approval.action;
    const approvedTarget = run.approval.target;
    const { approval: _approval, ...approvedRun } = run;
    const result: IncidentRun = {
      ...approvedRun,
      status: "resolved",
      completedAt: new Date().toISOString(),
      toolEvents: [
        ...run.toolEvents,
        event(action, "mutate", `${action.replaceAll("_", " ")} completed with the approved target and idempotency key.`, 5),
        event("verify_health", "verify", "Three bounded probes confirmed healthy error rate, latency, and saturation.", 6)
      ],
      outcome: {
        recovered: true,
        service: approvedTarget,
        action,
        before: { errorRate: 18.4, p95LatencyMs: 2840 },
        after: { errorRate: 0.7, p95LatencyMs: 238 },
        summary: "The sandbox mutation completed once, and an independent health check verified recovery.",
        idempotencyKey: `demo-${run.scenarioId}-${action}`
      }
    };
    pendingRuns.delete(token);
    return result;
  }
};

import type { ActionTool, PolicyDecision, ScenarioDefinition } from "./types.js";

const mutableTools = new Set<ActionTool>(["restart_canary", "rollback_release"]);

export function evaluatePolicy(
  scenario: ScenarioDefinition,
  action: { tool: ActionTool; target: string }
): PolicyDecision {
  if (action.tool === "none") {
    return {
      allowed: true,
      requiresApproval: false,
      risk: "low",
      reason: "The plan does not mutate the sandbox."
    };
  }

  if (!mutableTools.has(action.tool)) {
    return {
      allowed: false,
      requiresApproval: false,
      risk: "high",
      reason: "The requested tool is not in the mutation allowlist."
    };
  }

  if (action.target !== scenario.service) {
    return {
      allowed: false,
      requiresApproval: false,
      risk: "high",
      reason: `The target ${action.target} is outside the service allowlist for ${scenario.service}.`
    };
  }

  if (action.tool !== scenario.expectedAction) {
    return {
      allowed: false,
      requiresApproval: false,
      risk: "high",
      reason: "The proposed mutation is inconsistent with the verified sandbox evidence."
    };
  }

  return {
    allowed: true,
    requiresApproval: true,
    risk: action.tool === "rollback_release" ? "high" : "medium",
    reason: "The action is allowlisted and evidence-consistent, but a human must approve every mutation."
  };
}

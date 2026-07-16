import { z } from "zod";

export const severitySchema = z.enum(["SEV-1", "SEV-2", "SEV-3"]);
export type Severity = z.infer<typeof severitySchema>;

export const actionToolSchema = z.enum([
  "restart_canary",
  "rollback_release",
  "none"
]);
export type ActionTool = z.infer<typeof actionToolSchema>;

export const incidentScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  service: z.string(),
  severity: severitySchema,
  summary: z.string(),
  alert: z.string(),
  expectedRootCause: z.string(),
  expectedAction: actionToolSchema,
  injectionPresent: z.boolean().default(false)
});
export type IncidentScenario = z.infer<typeof incidentScenarioSchema>;

export interface MetricPoint {
  at: string;
  value: number;
}

export interface ScenarioDefinition extends IncidentScenario {
  metrics: Record<string, MetricPoint[]>;
  logs: string[];
  deployment: {
    currentVersion: string;
    previousVersion: string;
    deployedAt: string;
    diffSummary: string;
  };
  dependencies: Array<{
    name: string;
    status: "healthy" | "degraded" | "down";
    latencyMs: number;
  }>;
  heuristic: Diagnosis;
}

export const evidenceItemSchema = z.object({
  source: z.enum(["alert", "metrics", "logs", "deployment", "dependency"]),
  fact: z.string(),
  observedAt: z.string()
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const diagnosisSchema = z.object({
  rootCause: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceItemSchema).min(1),
  recommendedAction: z.object({
    tool: actionToolSchema,
    target: z.string(),
    rationale: z.string(),
    rollback: z.string()
  })
});
export type Diagnosis = z.infer<typeof diagnosisSchema>;

export interface ToolEvent {
  id: string;
  tool: string;
  phase: "observe" | "mutate" | "verify";
  status: "running" | "succeeded" | "blocked" | "failed";
  argsDigest: string;
  resultSummary: string;
  durationMs: number;
  at: string;
}

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  risk: "low" | "medium" | "high";
  reason: string;
}

export interface ApprovalRequest {
  action: Exclude<ActionTool, "none">;
  target: string;
  risk: "medium" | "high";
  rationale: string;
  rollback: string;
  expiresAt: string;
  token: string;
}

export interface RecoveryOutcome {
  recovered: boolean;
  service: string;
  action: ActionTool;
  before: Record<string, number>;
  after: Record<string, number>;
  summary: string;
  idempotencyKey: string;
}

export type RunStatus =
  | "investigating"
  | "awaiting_approval"
  | "resolved"
  | "escalated"
  | "failed";

export interface IncidentRun {
  id: string;
  scenarioId: string;
  mode: "qwen" | "simulation";
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  diagnosis: Diagnosis;
  toolEvents: ToolEvent[];
  policy: PolicyDecision;
  approval?: ApprovalRequest;
  outcome?: RecoveryOutcome;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const createRunRequestSchema = z.object({
  scenarioId: z.string().min(1)
});

export const approveRunRequestSchema = z.object({
  approvalToken: z.string().min(20)
});

export interface HealthResponse {
  status: "ok";
  service: "runbookpilot-api";
  qwenConfigured: boolean;
  mode: "qwen" | "simulation";
  primaryModel: string;
  criticModel: string;
  deployment: "local" | "alibaba-function-compute";
  timestamp: string;
}

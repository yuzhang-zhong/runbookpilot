import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { config as loadEnv } from "dotenv";
import OpenAI from "openai";
import { scenarios } from "../packages/core/src/index.js";
import { createIncidentRun } from "../apps/api/src/orchestrator.js";
import type { AppConfig } from "../apps/api/src/config.js";

loadEnv({ override: true, quiet: true });
if (!process.env.DASHSCOPE_API_KEY) {
  throw new Error("DASHSCOPE_API_KEY is required for the Qwen comparison evaluation.");
}

const qwenBaseUrl =
  process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const primaryModel = process.env.QWEN_PRIMARY_MODEL ?? "qwen3.7-plus";
const criticModel = process.env.QWEN_CRITIC_MODEL ?? "qwen3.6-flash";
const config: AppConfig = {
  qwenApiKey: process.env.DASHSCOPE_API_KEY,
  qwenBaseUrl,
  primaryModel,
  criticModel,
  approvalSecret: process.env.APPROVAL_HMAC_SECRET ?? "evaluation-only-secret-at-least-32-characters",
  allowedOrigin: "http://localhost:5173",
  deployment: "local"
};

type BaselineResult = {
  rootCause: string;
  recommendedAction: "restart_canary" | "rollback_release" | "none";
};
type EvaluationMetrics = {
  validModelRun: boolean;
  rootCauseCorrect: boolean;
  actionCorrect: boolean;
  toolCalls: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  error?: string;
};
type EvaluationRow = {
  scenarioId: string;
  agent: EvaluationMetrics;
  baseline: EvaluationMetrics;
};

function parseBaseline(value: unknown): BaselineResult | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const action = candidate.recommendedAction;
  if (
    typeof candidate.rootCause !== "string" ||
    (action !== "restart_canary" && action !== "rollback_release" && action !== "none")
  ) {
    return undefined;
  }
  return { rootCause: candidate.rootCause, recommendedAction: action };
}
const client = new OpenAI({
  apiKey: config.qwenApiKey,
  baseURL: qwenBaseUrl,
  timeout: 15_000,
  maxRetries: 2
});

const rows: EvaluationRow[] = [];
for (const scenario of scenarios) {
  const agentStarted = performance.now();
  const run = await createIncidentRun(scenario.id, config);
  const fallbackUsed = run.toolEvents.some((event) => event.tool === "qwen_fallback");
  const agentLatencyMs = Math.round(performance.now() - agentStarted);

  const baselineStarted = performance.now();
  let baseline: BaselineResult | undefined;
  let baselinePromptTokens = 0;
  let baselineCompletionTokens = 0;
  let baselineError: string | undefined;
  try {
    const response = await client.chat.completions.create({
      model: primaryModel,
      messages: [
        {
          role: "system",
          content:
            "Diagnose the alert without tools. Return JSON with rootCause and recommendedAction. recommendedAction must be restart_canary, rollback_release, or none."
        },
        { role: "user", content: scenario.alert }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });
    baselinePromptTokens = response.usage?.prompt_tokens ?? 0;
    baselineCompletionTokens = response.usage?.completion_tokens ?? 0;
    const content = response.choices[0]?.message.content;
    baseline = parseBaseline(content ? JSON.parse(content) : null);
    if (!baseline) throw new Error("Baseline returned invalid structured output.");
  } catch (error) {
    baselineError = error instanceof Error ? error.message : "Baseline request failed.";
  }

  rows.push({
    scenarioId: scenario.id,
    agent: {
      validModelRun: !fallbackUsed,
      rootCauseCorrect: !fallbackUsed && run.diagnosis.rootCause === scenario.expectedRootCause,
      actionCorrect:
        !fallbackUsed && run.diagnosis.recommendedAction.tool === scenario.expectedAction,
      toolCalls: run.toolEvents.filter((event) => event.tool !== "qwen_risk_review").length,
      latencyMs: agentLatencyMs,
      promptTokens: run.usage?.promptTokens ?? 0,
      completionTokens: run.usage?.completionTokens ?? 0
    },
    baseline: {
      validModelRun: Boolean(baseline),
      rootCauseCorrect: baseline?.rootCause === scenario.expectedRootCause,
      actionCorrect: baseline?.recommendedAction === scenario.expectedAction,
      toolCalls: 0,
      latencyMs: Math.round(performance.now() - baselineStarted),
      promptTokens: baselinePromptTokens,
      completionTokens: baselineCompletionTokens,
      ...(baselineError ? { error: baselineError } : {})
    }
  });
}

function aggregate(kind: "agent" | "baseline") {
  const valid = rows.filter((row) => row[kind].validModelRun);
  const rate = (key: "rootCauseCorrect" | "actionCorrect") =>
    valid.length
      ? Number(((valid.filter((row) => row[kind][key]).length / valid.length) * 100).toFixed(1))
      : null;
  return {
    validRuns: valid.length,
    excludedRuns: rows.length - valid.length,
    rootCauseAccuracyPercent: rate("rootCauseCorrect"),
    actionAccuracyPercent: rate("actionCorrect"),
    averageToolCalls: valid.length
      ? Number((valid.reduce((sum, row) => sum + row[kind].toolCalls, 0) / valid.length).toFixed(1))
      : null,
    averageLatencyMs: valid.length
      ? Math.round(valid.reduce((sum, row) => sum + row[kind].latencyMs, 0) / valid.length)
      : null,
    promptTokens: valid.reduce((sum, row) => sum + row[kind].promptTokens, 0),
    completionTokens: valid.reduce((sum, row) => sum + row[kind].completionTokens, 0)
  };
}

const result = {
  generatedAt: new Date().toISOString(),
  mode: "qwen-cloud-comparison",
  models: { primary: primaryModel, critic: criticModel },
  scenarioCount: rows.length,
  runbookPilot: aggregate("agent"),
  singlePromptBaseline: aggregate("baseline"),
  rows
};

await mkdir("docs/evaluation", { recursive: true });
await writeFile("docs/evaluation/qwen-results.json", `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

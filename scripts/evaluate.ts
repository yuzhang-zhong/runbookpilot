import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { evaluatePolicy, scenarios } from "../packages/core/src/index.js";
import { approveIncidentRun, createIncidentRun } from "../apps/api/src/orchestrator.js";
import type { AppConfig } from "../apps/api/src/config.js";

const config: AppConfig = {
  qwenBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  primaryModel: "qwen3.7-plus",
  criticModel: "qwen3.6-flash",
  approvalSecret: "evaluation-only-secret-at-least-32-characters",
  allowedOrigin: "http://localhost:5173",
  deployment: "local"
};

type Row = {
  scenarioId: string;
  rootCauseCorrect: boolean;
  actionCorrect: boolean;
  unsafeActionBlocked: boolean;
  toolCalls: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
};

const rows: Row[] = [];
for (const scenario of scenarios) {
  const started = performance.now();
  const run = await createIncidentRun(scenario.id, config);
  let toolCalls = run.toolEvents.length;
  if (run.approval) {
    const approved = await approveIncidentRun(run.approval.token, config);
    toolCalls += approved.toolEvents.length;
  }
  const hostileTargetBlocked = !evaluatePolicy(scenario, {
    tool: "rollback_release",
    target: "production-root"
  }).allowed;
  rows.push({
    scenarioId: scenario.id,
    rootCauseCorrect: run.diagnosis.rootCause === scenario.expectedRootCause,
    actionCorrect: run.diagnosis.recommendedAction.tool === scenario.expectedAction,
    unsafeActionBlocked: hostileTargetBlocked,
    toolCalls,
    latencyMs: Math.round(performance.now() - started),
    promptTokens: run.usage?.promptTokens ?? 0,
    completionTokens: run.usage?.completionTokens ?? 0
  });
}

const percent = (count: number) => Number(((count / rows.length) * 100).toFixed(1));
const summary = {
  generatedAt: new Date().toISOString(),
  mode: "deterministic-sandbox",
  scenarioCount: rows.length,
  rootCauseAccuracyPercent: percent(rows.filter((row) => row.rootCauseCorrect).length),
  actionAccuracyPercent: percent(rows.filter((row) => row.actionCorrect).length),
  unsafeActionBlockRatePercent: percent(rows.filter((row) => row.unsafeActionBlocked).length),
  averageToolCalls: Number(
    (rows.reduce((total, row) => total + row.toolCalls, 0) / rows.length).toFixed(1)
  ),
  averageLatencyMs: Math.round(
    rows.reduce((total, row) => total + row.latencyMs, 0) / rows.length
  ),
  promptTokens: rows.reduce((total, row) => total + row.promptTokens, 0),
  completionTokens: rows.reduce((total, row) => total + row.completionTokens, 0),
  rows
};

await mkdir("docs/evaluation", { recursive: true });
await writeFile("docs/evaluation/results.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));

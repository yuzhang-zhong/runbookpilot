import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import {
  approveRunRequestSchema,
  createRunRequestSchema,
  publicScenarios,
  type HealthResponse
} from "@runbookpilot/core";
import { loadConfig, type AppConfig } from "./config.js";
import { approveIncidentRun, createIncidentRun } from "./orchestrator.js";

export function createApp(configOverrides: Partial<AppConfig> = {}) {
  const config = loadConfig(configOverrides);
  const app = new Hono();

  app.use(
    "/api/*",
    cors({
      origin: (origin) => (origin === config.allowedOrigin ? origin : config.allowedOrigin),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
      maxAge: 3600
    })
  );

  app.get("/", (context) =>
    context.json({
      name: "RunbookPilot API",
      track: "Qwen Cloud Hackathon Track 4: Autopilot Agent",
      safety: "Deterministic SRE sandbox. No production systems are connected.",
      health: "/api/health"
    })
  );

  app.get("/api/health", (context) => {
    const response: HealthResponse = {
      status: "ok",
      service: "runbookpilot-api",
      qwenConfigured: Boolean(config.qwenApiKey),
      mode: config.qwenApiKey ? "qwen" : "simulation",
      primaryModel: config.primaryModel,
      criticModel: config.criticModel,
      deployment: config.deployment,
      timestamp: new Date().toISOString()
    };
    return context.json(response);
  });

  app.get("/api/scenarios", (context) => context.json({ scenarios: publicScenarios }));

  app.post("/api/runs", async (context) => {
    const parsed = createRunRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) {
      throw new HTTPException(400, { message: "A valid scenarioId is required." });
    }
    try {
      return context.json(await createIncidentRun(parsed.data.scenarioId, config), 201);
    } catch (error) {
      if (error instanceof Error && error.message === "Scenario not found.") {
        throw new HTTPException(404, { message: error.message });
      }
      throw error;
    }
  });

  app.post("/api/runs/approve", async (context) => {
    const parsed = approveRunRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) {
      throw new HTTPException(400, { message: "A valid approvalToken is required." });
    }
    try {
      return context.json(await approveIncidentRun(parsed.data.approvalToken, config));
    } catch (error) {
      throw new HTTPException(400, {
        message: error instanceof Error ? error.message : "Approval failed."
      });
    }
  });

  app.notFound((context) => context.json({ error: "Not found." }, 404));
  app.onError((error, context) => {
    if (error instanceof HTTPException) {
      return context.json({ error: error.message }, error.status);
    }
    console.error(error);
    return context.json({ error: "The incident run failed safely." }, 500);
  });

  return app;
}

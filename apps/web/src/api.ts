import type { HealthResponse, IncidentRun, IncidentScenario } from "@runbookpilot/core";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers }
  });
  const body = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    throw new Error("error" in (body as object) ? String((body as { error?: string }).error) : "Request failed.");
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  scenarios: async () =>
    (await request<{ scenarios: IncidentScenario[] }>("/api/scenarios")).scenarios,
  createRun: (scenarioId: string) =>
    request<IncidentRun>("/api/runs", {
      method: "POST",
      body: JSON.stringify({ scenarioId })
    }),
  approve: (approvalToken: string) =>
    request<IncidentRun>("/api/runs/approve", {
      method: "POST",
      body: JSON.stringify({ approvalToken })
    })
};

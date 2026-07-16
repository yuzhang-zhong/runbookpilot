# RunbookPilot: Qwen SRE Autopilot

## Inspiration

An incident agent becomes risky at one specific moment: it stops reading and asks to change something.

I built RunbookPilot around that boundary. The agent can inspect a bad release, connect the error spike to a deployment, and prepare a rollback. It still cannot execute the rollback on its own. Code, not model judgment, decides whether the proposal is in scope. A person must approve the exact signed action.

## What it does

RunbookPilot is an SRE incident console for a deterministic sandbox. It ships with eight repeatable cases, including a bad release, memory leak, exhausted database pool, dependency outage, expired certificate, noisy alert, crash loop, and a log-based prompt injection attempt.

For each run, the agent reads metrics, logs, deployment metadata, and dependency health through MCP. Qwen returns a structured root cause, evidence list, confidence score, and proposed action. A deterministic policy then checks the tool, service target, and evidence-consistent action.

Read-only work can continue automatically. A restart or rollback creates a five-minute HMAC-signed approval request. After approval, the MCP server performs the sandbox mutation and a separate health tool checks three recovery probes before the run is marked resolved.

No real cluster or production credential is connected.

## How I built it

The monorepo uses React 19, Vite, Hono, Zod, TypeScript, Vitest, and Playwright. The backend uses the OpenAI SDK against Qwen Cloud's compatible endpoint. `qwen3.7-plus` handles investigation and the repair plan. `qwen3.6-flash` performs a lower-cost risk review. The deterministic policy remains the final authority.

The MCP layer is a real in-process client and server, not a mocked function registry. It exposes four read tools, two mutation tools, and one verification tool. Mutation calls fail inside the MCP server unless the orchestrator has already verified human approval.

The frontend is hosted on GitHub Pages. The API runs as a Node.js 20 web function on Alibaba Cloud Function Compute. The repository includes the `fc3` deployment definition, exact environment variables, CORS restriction, and shutdown runbook.

## Challenges

The hardest part was keeping model output useful without treating it as authority. Logs can contain realistic attack text, so every log result is labeled untrusted data. Qwen never receives a mutation-capable authorization token. Approval binds the run, action, target, rationale, expiry, and idempotency key under an HMAC signature.

Another challenge was reporting results honestly. The checked-in evaluation runs eight deterministic scenarios and currently records 100% expected root-cause matches, 100% expected action matches, and 100% hostile-target blocking. Those are sandbox contract results, not a claim about general incident accuracy. The artifact records zero model tokens because it was generated in offline simulation mode. Qwen-backed results will be stored separately once the cloud key is configured.

## Accomplishments

The complete bad-release path works through the public API: four evidence calls, a bounded diagnosis, policy review, a signed approval gate, rollback, and health verification. Direct MCP mutation calls fail without approval. Forged, altered, and expired tokens fail closed. Repeated approval keeps the same logical action and idempotency key.

Eleven automated tests currently cover policy, tokens, MCP behavior, prompt injection, duplicate approval, and the full recovery flow. Strict type checking and the production build also pass.

## What I learned

The useful unit of autonomy is not "the agent can fix incidents." It is smaller: the agent can gather evidence and prepare one reviewable change. That framing made the interface, tool design, and tests much clearer.

I also learned that a risk-review model is helpful as a second opinion, but it should not become a second source of authority. Deterministic controls are easier to inspect, test, and explain during an incident.

## What's next

Before connecting any real system, I would add a durable idempotency store, short-lived workload identity, per-environment adapters, and a dry-run diff for every provider. The sandbox boundary stays in place until those controls have replay and failure-injection tests.

## Built with

Qwen Cloud, Alibaba Cloud Function Compute, TypeScript, React, Vite, Hono, MCP, Zod, Vitest, Playwright, GitHub Pages, OpenAI TTS, and ffmpeg.

# Architecture

[Back to the project](../README.md) · [Security model](security.md) · [Optional deployment](deployment.md)

## Two execution paths, one operator interface

The public GitHub Pages demo runs entirely in the browser. Its deterministic adapter reproduces the diagnosis, approval checkpoint, and recovery states for eight fixed incidents. It does not call Qwen, open an MCP session, or enforce the API's server-side HMAC gate.

The API-backed path runs the Hono API locally, with Function Compute available as an optional deployment target. Without `DASHSCOPE_API_KEY`, diagnosis is deterministic. With a key, the orchestrator asks Qwen for bounded tool calls and structured output; it executes tools itself through an in-process MCP client and server. The browser never receives cloud credentials or the approval-signing secret.

| Input | Processing and boundary | Inspectable output |
| --- | --- | --- |
| Public demo: a selected sandbox incident | Browser-side deterministic adapter; a simulated approval checkpoint | Diagnosis, read-tool trace, proposed action, and simulated recovery or escalation |
| Local API: a scenario ID, such as `bad-release` | Bounded evidence → diagnosis → deterministic policy → signed human approval for mutations → sandbox health probe | An `IncidentRun` with diagnosis, evidence, proposed action, policy result, tool trace, and outcome when available |

Read tools can run automatically in the API path. A mutation proposal must pass deterministic policy and a human approval request. Only a valid signed token unlocks the MCP mutation boundary. A separate health tool verifies the outcome; an incident can also end in escalation without a mutation.

## Follow the implementation

1. [`apps/web/src/api.ts`](../apps/web/src/api.ts) chooses the browser adapter when `VITE_API_BASE_URL=demo`, or when no endpoint is configured on a `.github.io` host. Otherwise it calls the API.
2. [`apps/web/src/demo-api.ts`](../apps/web/src/demo-api.ts) contains the public simulation. Its demo token is not a server-side authorization control.
3. [`apps/api/src/app.ts`](../apps/api/src/app.ts) accepts scenario requests and approval submissions.
4. [`apps/api/src/orchestrator.ts`](../apps/api/src/orchestrator.ts), [`approval-token.ts`](../apps/api/src/approval-token.ts), and [`mcp-runtime.ts`](../apps/api/src/mcp-runtime.ts) implement the API's evidence loop, signed approval boundary, sandbox tools, and verification.

![Conceptual map of the local or optionally deployed API-backed path](architecture.svg)

This diagram describes the API-backed path, not the current Pages hosting topology. No Function Compute service was created for the published demo; see the [deployment record](deployment.md).

Every SRE data source, mutation, and health probe in both paths uses deterministic sandbox fixtures. Neither path connects to production infrastructure. See [testing](testing.md) for checks of each path and the distinction between simulation and Qwen evaluation.

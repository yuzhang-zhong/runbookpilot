# RunbookPilot

RunbookPilot is a safety-gated SRE incident agent built for Track 4 of the Qwen Cloud Hackathon. It gathers bounded evidence through an in-process MCP connection, asks Qwen for a structured diagnosis and repair plan, applies deterministic policy, waits for a human approval, then performs and verifies a sandbox recovery.

The project does not connect to a real production cluster. Every alert, metric, log, deployment, dependency, mutation, and health probe belongs to a labeled deterministic sandbox.

![RunbookPilot architecture](docs/architecture.svg)

## What is implemented

- React 19 and Vite operator console with eight repeatable incidents
- Hono API shared with Zod schemas in a TypeScript monorepo
- Qwen Cloud model path using `qwen3.7-plus` and a `qwen3.6-flash` risk review
- Real in-process MCP client and server with four read tools, two mutation tools, and one verification tool
- Deterministic mutation policy, exact target allowlist, five-minute HMAC approval tokens, and idempotency keys
- Prompt injection handling that labels logs as untrusted data and keeps authorization outside model control
- Alibaba Cloud Function Compute and GitHub Pages deployment definitions
- Vitest API, policy, token, MCP, and abuse-path tests plus Playwright operator-flow tests
- Reproducible evaluation and OpenAI TTS demo production scripts

## Local development

Requirements: Node.js 20 or newer and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Without `DASHSCOPE_API_KEY`, the API runs in clearly labeled deterministic simulation mode. Copy `.env.example` to `.env` and add a Qwen Cloud key to exercise the model path.

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm eval
pnpm eval:qwen
pnpm test:e2e
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Deployment and Qwen configuration state, with no secrets |
| `GET` | `/api/scenarios` | Public sandbox scenario metadata |
| `POST` | `/api/runs` | Diagnose one scenario from `{ "scenarioId": "bad-release" }` |
| `POST` | `/api/runs/approve` | Verify the signed approval, mutate the sandbox, and check recovery |

## Measured sandbox result

The checked-in result at `docs/evaluation/results.json` was produced by `pnpm eval` on July 16, 2026. Across eight deterministic scenarios it measured 100% expected root-cause matches, 100% expected action matches, and 100% rejection of a hostile out-of-scope target. Average tool use was 5.3 calls per run. Token counts are zero because this specific artifact measures the offline sandbox path, not Qwen Cloud. `pnpm eval:qwen` runs the same fixtures through RunbookPilot and a no-tool, single-prompt Qwen baseline, writing a separate cloud result. Runs that use the deterministic fallback are labeled and excluded from model accuracy.

## Deployment and safety

See [deployment instructions](docs/deployment.md), [security model](docs/security.md), and [test evidence](docs/testing.md). `infra/s.yaml` defines a 512 MB, 120-second Function Compute web function with no provisioned instances or paid storage dependencies. The maximum function instance quota of one is an explicit post-deployment console step because it is a function quota, not a portable function-code property.

## Demo narration

The narration script is generated with the official OpenAI speech API and the `gpt-4o-mini-tts` model using the `marin` voice.

```bash
pnpm demo:tts
pnpm demo:mux -- --screen artifacts/screen-recording.mp4
```

The final video discloses that its narration is AI generated. It contains no music or third-party footage.

## License

MIT

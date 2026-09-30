# RunbookPilot

RunbookPilot is a safety-gated SRE incident agent built for Track 4 of the Qwen Cloud Hackathon. It gathers bounded evidence through an in-process MCP connection, asks Qwen for a structured diagnosis and repair plan, applies deterministic policy, waits for a human approval, then performs and verifies a sandbox recovery.

The project does not connect to a real production cluster. Every alert, metric, log, deployment, dependency, mutation, and health probe belongs to a labeled deterministic sandbox.

**Live deterministic demo:** https://yuzhang-zhong.github.io/runbookpilot/

**Devpost submission:** https://devpost.com/software/runbookpilot

**Demo video:** https://youtu.be/4Qg4nUWINgc

**Build log:** https://github.com/yuzhang-zhong/runbookpilot/blob/main/submission/build-log-final.md

![RunbookPilot architecture](docs/architecture.svg)

## What is implemented

- React 19 and Vite operator console with eight repeatable incidents
- Hono API shared with Zod schemas in a TypeScript monorepo
- Qwen Cloud model path using `qwen3.7-plus` and a `qwen3.6-flash` risk review
- Real in-process MCP client and server with four read tools, two mutation tools, and one verification tool
- Deterministic mutation policy, exact target allowlist, five-minute HMAC approval tokens, and idempotency keys
- Prompt injection handling that labels logs as untrusted data and keeps authorization outside model control
- Alibaba Cloud Function Compute and GitHub Pages deployment definitions
- A GitHub Pages deterministic demo adapter for judging without a billable backend
- Vitest API, policy, token, MCP, and abuse-path tests plus Playwright operator-flow tests
- Reproducible evaluation and OpenAI TTS demo production scripts

## Local development

Requirements: Node.js 20 or newer and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Without `DASHSCOPE_API_KEY`, the API runs in clearly labeled deterministic simulation mode. To exercise the model path, set `DASHSCOPE_API_KEY` in your user environment. Keep the key out of `.env` and source control. The remaining non-secret settings can be copied from `.env.example`.

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm eval
pnpm eval:qwen
pnpm test:e2e
```

## Quick Walkthrough

End-to-end operator flow for one incident (e.g. the `bad-release` scenario):

1. **Pick a scenario.** Open the console and choose one of the eight sandbox incidents. No real production cluster is ever touched; everything is labeled deterministic sandbox data.
2. **Diagnose.** The API gathers bounded evidence through the in-process MCP server (four read tools covering metrics, logs, deployments, and dependencies), then asks Qwen for a structured diagnosis and repair plan, followed by the `qwen3.6-flash` risk review.
3. **Policy gate.** Deterministic policy checks the plan against the exact target allowlist, attaches an idempotency key, and issues a five-minute HMAC approval token. Nothing is mutated yet.
4. **Human approval.** Review the plan in the console and click approve. Only a valid signed approval lets the mutation tools run.
5. **Mutate and verify.** The sandbox mutation runs, and the verification tool checks recovery. Each step appears in the run timeline.

Without `DASHSCOPE_API_KEY`, the same flow runs in clearly labeled deterministic simulation mode, so you can walk through the full operator experience without a model bill.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Deployment and Qwen configuration state, with no secrets |
| `GET` | `/api/scenarios` | Public sandbox scenario metadata |
| `POST` | `/api/runs` | Diagnose one scenario from `{ "scenarioId": "bad-release" }` |
| `POST` | `/api/runs/approve` | Verify the signed approval, mutate the sandbox, and check recovery |

## Measured sandbox result

The offline result at `docs/evaluation/results.json` was produced by `pnpm eval` on July 16, 2026. Across eight deterministic scenarios it measured 100% expected root-cause matches, 100% expected action matches, and 100% rejection of a hostile out-of-scope target. Average tool use was 5.3 calls per run. Token counts are zero because this artifact measures the sandbox path without Qwen Cloud.

The cloud result at `docs/evaluation/qwen-results.json` was produced by `pnpm eval:qwen` on July 16, 2026. All eight RunbookPilot runs and all eight no-tool baseline runs completed without fallback. RunbookPilot reached 100% root-cause accuracy, 100% action accuracy, and a 100% unsafe-action block rate across 16 deterministic policy checks. The single-prompt baseline reached 75% root-cause accuracy and 75% action accuracy. RunbookPilot averaged four read-only tool calls and 11,684 ms per scenario, using 24,192 prompt tokens and 5,257 completion tokens. The result file includes every prediction, latency, token count, validity flag, and safety-check count.

## Deployment and safety

See [deployment instructions](docs/deployment.md), [security model](docs/security.md), and [test evidence](docs/testing.md). `infra/s.yaml` defines a 512 MB, 120-second Function Compute web function with no provisioned instances or paid storage dependencies. On July 16, the account checkout showed USD 9.00 for the advertised trial plan, so no Function Compute order or billable function was created. The public Pages build therefore uses the clearly labeled deterministic demo adapter; the checked-in Qwen evaluation artifact remains the record of real cloud model calls.

## Demo narration

The included narration production script calls the official OpenAI speech API with `gpt-4o-mini-tts` and the `marin` voice.

```bash
pnpm demo:tts
VITE_API_BASE_URL=demo pnpm --filter @runbookpilot/web build
pnpm demo:record
pnpm demo:mux -- --screen artifacts/screen-recording.webm
```

The reproducible Playwright recording follows the 2:47 narration timeline at 1080p, then ffmpeg burns the included captions and combines the OpenAI TTS track into an H.264/AAC MP4. The finished video discloses that its narration is AI generated. It contains no music or third-party footage.

## Contributing

This started as a Qwen Cloud Hackathon entry and stays a small, focused project. Bug fixes, doc improvements, and new deterministic sandbox scenarios are welcome.

- Open an issue first for anything bigger than a typo.
- Run `pnpm typecheck` and `pnpm test` before opening a pull request.
- Keep the safety invariants intact: authorization stays outside model control, mutations only happen on a signed human approval, and no real production clusters are ever touched.

## License

MIT

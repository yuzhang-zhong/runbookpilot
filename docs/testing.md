# Verification record

## Automated checks

`pnpm test` covers deterministic policy decisions, target allowlists, signed approval issuance, token expiry and tampering, the MCP tool catalog, direct mutation rejection, prompt injection, duplicate approval, and the full diagnose, approve, mutate, verify API path.

`pnpm typecheck` validates all packages in strict TypeScript mode. `pnpm build` produces the API and GitHub Pages artifacts. `pnpm test:e2e` exercises the primary desktop and mobile operator flow in Chrome and checks keyboard focus.

## Evaluation contract

`pnpm eval` runs all eight fixed incidents. It records expected root cause and action matches, hostile-target blocking, tool count, latency, and model token usage. The script never substitutes invented numbers for missing Qwen usage. Offline runs report zero model tokens and identify their mode as `deterministic-sandbox`.

The current measured artifact is stored in `docs/evaluation/results.json`. Any cloud-backed evaluation must be stored as a separate artifact with its model names, timestamp, and nonzero usage data.

## Release gate

Before submission, run:

```bash
pnpm check
pnpm eval
pnpm test:e2e
pnpm audit --audit-level high
```

Then test the public application in an unsigned or private browser window at desktop and mobile widths. Confirm that the browser console contains no errors and that the API rejects an origin other than the configured Pages site.

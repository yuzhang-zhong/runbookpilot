# Verification record

## Automated checks

`pnpm test` covers deterministic policy decisions, target allowlists, signed approval issuance, token expiry and tampering, the MCP tool catalog, direct mutation rejection, prompt injection, duplicate approval, and the full diagnose, approve, mutate, verify API path.

`pnpm typecheck` validates all packages in strict TypeScript mode. `pnpm build` produces the API and GitHub Pages artifacts. `pnpm test:e2e` exercises the primary desktop and mobile operator flow in Chrome and checks keyboard focus.

## Evaluation contract

`pnpm eval` runs all eight fixed incidents. It records expected root cause and action matches, hostile-target blocking, tool count, latency, and model token usage. The script never substitutes invented numbers for missing Qwen usage. Offline runs report zero model tokens and identify their mode as `deterministic-sandbox`.

`pnpm eval:qwen` runs the same incidents through Qwen Cloud and a no-tool baseline. It excludes a model run from accuracy if the request times out, returns invalid structured output, or uses the labeled deterministic fallback. For each scenario, it also checks two unsafe proposals against deterministic policy: an unapproved target and an evidence-inconsistent mutation.

The offline artifact is stored in `docs/evaluation/results.json`. The Qwen Cloud comparison is stored separately in `docs/evaluation/qwen-results.json`. The July 16, 2026 cloud run completed all eight scenarios without fallback. RunbookPilot measured 100% root-cause accuracy, 100% action accuracy, and 100% unsafe-action blocking across 16 policy checks. The no-tool baseline measured 75% root-cause accuracy and 75% action accuracy. The cloud artifact records model names, predictions, latency, token usage, safety-check counts, and excluded-run counts.

Set `EVAL_SCENARIO_ID` to one scenario ID when debugging a cloud run. For example, `$env:EVAL_SCENARIO_ID='bad-release'; pnpm eval:qwen` runs only that fixture. Omit the variable for the eight-scenario result used in the README.

## Release gate

Before submission, run:

```bash
pnpm check
pnpm eval
pnpm test:e2e
pnpm audit --audit-level high
```

Then test the public application in an unsigned or private browser window at desktop and mobile widths. Confirm that the browser console contains no errors and that the API rejects an origin other than the configured Pages site.

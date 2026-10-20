# Deployment runbook

The public console runs on GitHub Pages with the browser-side deterministic adapter. **No Function Compute order or billable function was created for this demo.** The July 16, 2026 checkout showed USD 9.00 for the advertised trial plan, so the planned deployment stopped before resource creation. This is a historical project record, not current pricing.

The instructions below describe an **optional API-backed deployment**, not the current public demo. The API can also run locally; see [Start locally](../README.md#start-locally). The checked-in target is Alibaba Cloud Function Compute 3.0 with a Node.js 20 custom-runtime web function.

## Optional Function Compute deployment

1. Review current pricing and trial eligibility before creating resources.
2. Install and authenticate Serverless Devs with a least-privilege Alibaba Cloud access identity.
3. Set local environment variables without committing them:

```text
DASHSCOPE_API_KEY
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
APPROVAL_HMAC_SECRET=<at least 32 random bytes>
ALLOWED_ORIGIN=https://<github-user>.github.io
FC_REGION=ap-southeast-1
```

4. Deploy from the repository root:

```bash
s deploy -t infra/s.yaml
```

5. In the Function Compute console, set the function-level maximum on-demand instance quota to `1`. Leave minimum and provisioned instances at `0`.
6. Confirm that no OSS mount, NAS mount, custom log project, provisioned instance, or paid add-on was created.
7. Call `https://<function-url>/api/health` and save a screenshot that shows `deployment: alibaba-function-compute` and `qwenConfigured: true`.
8. Set a quota alert before opening the public frontend.

The YAML follows Alibaba Cloud's documented `fc3` custom runtime and anonymous HTTP trigger shape. Function-level maximum instance quotas are configured separately in the console or quota API.

## GitHub Pages

The current Pages demo uses the browser adapter when `VITE_API_BASE_URL` is empty; setting it to `demo` also selects that adapter. This path needs no API key and does not provide the API's server-side HMAC approval gate.

For an optional API-backed deployment, add the verified Function Compute endpoint as the repository variable `VITE_API_BASE_URL`. Enable Pages with GitHub Actions as the source. The workflow in `.github/workflows/pages.yml` builds and publishes `apps/web/dist`.

Update `ALLOWED_ORIGIN` on Function Compute to the exact Pages origin. The API does not use wildcard CORS.

## Evidence to collect for an API-backed deployment

These are verification steps for a future deployment, not a claim that these resources or screenshots currently exist:

- Public link to `infra/s.yaml`
- Function details screenshot showing runtime, memory, timeout, and region
- Function quota screenshot showing a maximum of one and no provisioned instances
- Browser screenshot of the successful `/api/health` response
- Public Pages URL running the end-to-end sandbox flow

## Shutdown

For any API-backed deployment you create, choose a shutdown date and remove the HTTP trigger and function when they are no longer needed. Verify the Function Compute resource list and related billing view for remaining RunbookPilot resources. The published browser-only demo has no Function Compute resource to shut down.

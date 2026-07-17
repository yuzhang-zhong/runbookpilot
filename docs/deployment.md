# Deployment runbook

The public console is designed for GitHub Pages. The API is designed for Alibaba Cloud Function Compute 3.0 as a Node.js 20 custom-runtime web function.

## Function Compute

1. Claim the eligible Function Compute trial before creating resources.
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

Add the Function Compute endpoint as the repository variable `VITE_API_BASE_URL`. Enable Pages with GitHub Actions as the source. The workflow in `.github/workflows/pages.yml` builds and publishes `apps/web/dist`.

Update `ALLOWED_ORIGIN` on Function Compute to the exact Pages origin. The API does not use wildcard CORS.

## Proof package

- Public link to `infra/s.yaml`
- Function details screenshot showing runtime, memory, timeout, and region
- Function quota screenshot showing a maximum of one and no provisioned instances
- Browser screenshot of the successful `/api/health` response
- Public Pages URL running the end-to-end sandbox flow

## Shutdown

Keep the function available through August 11, 2026 for judging. On August 12, delete the HTTP trigger and function, then verify that the Function Compute resource list and related billing view show no remaining RunbookPilot resources.

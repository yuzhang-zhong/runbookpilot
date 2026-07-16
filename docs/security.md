# Security model

RunbookPilot separates investigation from authorization. Qwen can request read tools and propose a structured action, but it cannot approve or execute a mutation.

## Trust boundaries

1. Alerts and scenario identifiers are bounded inputs.
2. Metrics, logs, deployment records, and dependency status are returned through MCP.
3. Log text is labeled `untrusted-data`. A log line cannot change policy, authorize a tool, or expand scope.
4. Qwen returns only a structured diagnosis, evidence list, confidence value, and action summary. Hidden reasoning is never requested or exposed.
5. The deterministic policy checks the tool, exact service target, and expected evidence-consistent action.
6. Every mutation requires a human approval token signed with HMAC SHA-256.
7. The MCP server independently rejects mutation calls unless the orchestrator has verified approval.
8. A post-mutation health tool verifies recovery before the run is marked resolved.

## Approval token

The token binds the run, scenario, action tool, target, rationale, rollback statement, diagnosis, issue time, five-minute expiry, and UUID idempotency key. The signature uses a server-only secret. Malformed, forged, altered, or expired tokens fail closed with an explicit client error.

Replaying a valid token returns the same logical action and idempotency key. The deterministic sandbox action is repeat safe. A production adapter would persist the key in a durable store before executing an external change.

## Deliberate limitations

- No Kubernetes credentials, SSH keys, or production APIs are present.
- No arbitrary shell tool exists.
- No target can be supplied outside the selected incident service.
- No model-provided tool definition is trusted.
- No mutation is exposed through the public API without a verified signed token.
- Simulation mode is visible in both `/api/health` and the operator console.

Report security issues privately before public disclosure. Do not include live credentials or customer data in a report.

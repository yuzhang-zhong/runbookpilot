# The Line My SRE Agent Cannot Cross

The demo incident starts with a familiar pattern. Checkout latency jumps from 238 milliseconds to 2.84 seconds. Errors rise to 18.4 percent. A deployment landed six minutes earlier.

RunbookPilot can connect those facts and propose a rollback. It cannot perform that rollback yet. That pause is the main feature.

## Start with authority, not intelligence

I split the system into two decisions. Qwen answers, "What probably happened, and what single action fits the evidence?" Deterministic code answers, "Is this exact action allowed here?"

The distinction matters. A fluent diagnosis is not authorization. The policy checks three things: the requested tool is one of two mutation tools, the target exactly matches the incident service, and the action matches the scenario evidence. Any mismatch ends the run without a change.

Even a valid proposal needs a person. The API creates an approval token containing the run, scenario, action, target, rationale, rollback statement, full structured diagnosis, issue time, five-minute expiry, and an idempotency key. HMAC SHA-256 signs the payload. Alter one field and verification fails.

## MCP is an execution boundary

The project uses a real in-process MCP client and server. Four tools only read: `query_metrics`, `search_logs`, `inspect_deployment`, and `check_dependencies`. Two tools change the sandbox: `restart_canary` and `rollback_release`. `verify_health` checks the result.

I did not rely only on the orchestrator to hide change tools from Qwen. The MCP server itself rejects mutation calls unless it is created with an authorization state that only follows successful approval verification. That gave me a direct abuse-path test instead of an architectural promise.

Logs get their own trust label. `search_logs` returns `trust: untrusted-data` and a warning that log content cannot change policy. One scenario includes a line that tells the agent to ignore its rules and roll back another service. The line remains evidence. It never becomes an instruction.

## Qwen's role

The primary path connects the OpenAI SDK to Qwen Cloud's compatible endpoint. `qwen3.7-plus` selects from the read-only MCP tools and returns a structured diagnosis. I cap model-directed tool use at two rounds, then the orchestrator completes any missing allowlisted read checks exactly once. `qwen3.6-flash` reviews the plan for evidence mismatch, unsafe scope, and influence from untrusted logs.

The review is useful context, not a permit. The deterministic policy still makes the final decision. If Qwen times out or returns invalid JSON, the demo falls back to a labeled deterministic diagnosis so judges can inspect the rest of the safety workflow without mistaking it for a live model result.

## Measuring the sandbox honestly

There are eight fixed incidents. The evaluation records root-cause match, action match, hostile-target blocking, tool count, latency, and token usage.

The deterministic run shows 100 percent for the two expected-match measures and 100 percent hostile-target blocking, with 5.3 tool calls on average. That artifact says `deterministic-sandbox` and reports zero prompt and completion tokens.

The separate Qwen Cloud comparison completed all eight agent runs without fallback. RunbookPilot matched all eight expected root causes and actions. Deterministic policy rejected 16 of 16 unsafe proposals, covering an unapproved target and an evidence-inconsistent mutation for every fixture. The no-tool baseline reached 75 percent root-cause accuracy and 75 percent action accuracy. The cloud artifact records 24,192 prompt tokens, 5,257 completion tokens, four read-only tool calls per incident, and 11,684 milliseconds average latency.

These numbers describe eight fixed incidents. They do not establish general SRE accuracy. Keeping the raw predictions and validity flags public makes the limited claim reproducible.

## Shipping the demo

The operator console is React and Vite. It keeps the alert, metrics, evidence, tool trace, policy result, approval request, and recovery probes on one screen. Status changes use `aria-live`; controls work by keyboard; the layout collapses for a phone; reduced-motion preferences disable nonessential animation.

The static console is prepared for GitHub Pages. The Hono API is prepared for a 512 MB Alibaba Cloud Function Compute web function using the Node.js 20 custom runtime. The deployment creates no OSS or NAS mount and no provisioned instance. A separate console step caps the function at one on-demand instance.

For the three-minute video, the repository contains the narration, captions, OpenAI `gpt-4o-mini-tts` script using the `marin` voice, and an ffmpeg mux command. The video identifies the narration as AI generated.

## What must happen before a real adapter

This project deliberately stops at a sandbox. A production version would need durable idempotency storage, workload identity with short expiry, provider-specific dry runs, audit retention, and failure-injection tests for every adapter. It would also need a clear operational answer for what happens when approval succeeds but the network fails before the result is stored.

Until those pieces exist, the safe claim is narrow: RunbookPilot demonstrates how Qwen can investigate an incident and prepare a bounded change while authorization remains testable, deterministic, and human controlled.

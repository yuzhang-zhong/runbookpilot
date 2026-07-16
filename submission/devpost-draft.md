# RunbookPilot: Qwen SRE Autopilot

## Inspiration

Modern SRE teams face alert fatigue and complex incidents. AI agents can help, but autonomous remediation creates safety concerns. We wanted to create an innovative solution that combines powerful AI diagnosis with robust human oversight.

## What it does

RunbookPilot analyzes alerts, metrics, logs, deployments, and dependencies. It uses Qwen to identify the root cause and recommend a repair. A policy engine validates the action, requests human approval, performs the change, and verifies recovery.

## How we built it

We used React, TypeScript, Hono, MCP, Qwen Cloud, and Alibaba Cloud Function Compute. The application includes eight scenarios and comprehensive testing. It demonstrates a seamless end-to-end workflow with an intuitive industrial interface.

## Challenges

The main challenge was balancing autonomy and safety while building a polished project in a short period. We solved this with layered guardrails and deterministic controls.

## Accomplishments

We are proud of the complete experience, strong safety model, and excellent evaluation results.

## What we learned

We learned that AI agents are most useful when paired with clear boundaries and human judgment.

## What's next

We plan to add more integrations, more scenarios, and enterprise features.

# Architecture

The browser never receives Alibaba Cloud or approval signing secrets. It calls the Hono API on Function Compute. The orchestrator asks Qwen for bounded tool calls and structured output, but executes tools itself through an in-process MCP client and server.

Read tools can run automatically. A mutation proposal passes through deterministic policy and a human approval request. Only a valid signed token unlocks the MCP mutation boundary. A separate health tool verifies the outcome.

The SRE data source and every mutation shown in the demo are deterministic sandbox fixtures. They are intentionally isolated from real infrastructure.

The renderable architecture asset is [architecture.svg](architecture.svg).

# Humanizer audit

Prompt used: **What makes the below so obviously AI generated?**

## Devpost draft findings

- The opening repeats broad claims about alert fatigue and AI safety without a concrete incident or engineering decision.
- Phrases such as "innovative solution," "powerful AI," "robust human oversight," "seamless end-to-end workflow," and "intuitive industrial interface" sound promotional because they are not tied to evidence.
- Every section has nearly the same length and follows a predictable claim, implementation, outcome rhythm.
- "Comprehensive testing," "strong safety model," and "excellent evaluation results" are vague. The text should name the tested failure modes and distinguish offline sandbox results from Qwen Cloud results.
- The challenges section skips the hard technical details: authorization outside model control, MCP mutation enforcement, signed approvals, prompt injection, and deterministic verification.
- "We are proud" and "we learned" add little unless followed by a specific surprising result.
- The future plan is a generic list. A credible next step should describe the adapter boundary and the storage required before connecting real systems.

## Build article draft findings

- The early version sounded like a product announcement rather than a build record.
- It described the stack before explaining why the safety boundary has that shape.
- It blurred a model's proposed action with the system's authority to execute it.
- It risked overstating an eight-scenario deterministic benchmark as evidence of general SRE performance.
- It needed more first-person engineering detail, including what the implementation refuses to do.

## Rewrite decisions

- Start with the exact moment where automation must stop: a plausible rollback proposal.
- Replace abstract benefits with tool names, token fields, policy checks, and measured results.
- State that the current checked-in benchmark is offline and uses zero model tokens.
- Use varied paragraph lengths and direct sentences.
- Remove template-like summaries, inflated adjectives, vague attribution, and dash-heavy asides.
- End with a narrow, technically honest next step.

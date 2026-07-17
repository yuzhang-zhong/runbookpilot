import { describe, expect, it } from "vitest";
import { diagnosisSchema } from "@runbookpilot/core";
import { normalizeQwenDiagnosis } from "./orchestrator.js";

describe("Qwen diagnosis normalization", () => {
  it("normalizes common structured-output variations without changing the proposed action", () => {
    const normalized = normalizeQwenDiagnosis({
      rootCause: "bad_release",
      summary: "Errors started after the deployment.",
      confidence: "High",
      evidence: [
        {
          source: "deployment",
          observation: "Release 2026.07.16.4 preceded the error spike."
        }
      ],
      recommendedAction: {
        tool: "rollback_release",
        target: "checkout-api"
      }
    });

    expect(diagnosisSchema.parse(normalized)).toMatchObject({
      confidence: 0.9,
      evidence: [
        {
          source: "deployment",
          fact: "Release 2026.07.16.4 preceded the error spike.",
          observedAt: expect.any(String)
        }
      ],
      recommendedAction: {
        tool: "rollback_release",
        target: "checkout-api",
        rationale: expect.any(String),
        rollback: expect.any(String)
      }
    });
  });
});

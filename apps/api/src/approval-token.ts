import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  actionToolSchema,
  diagnosisSchema,
  type Diagnosis
} from "@runbookpilot/core";
import { z } from "zod";

const payloadSchema = z.object({
  version: z.literal(1),
  runId: z.string().uuid(),
  scenarioId: z.string(),
  action: z.object({
    tool: actionToolSchema.exclude(["none"]),
    target: z.string(),
    rationale: z.string(),
    rollback: z.string()
  }),
  diagnosis: diagnosisSchema,
  idempotencyKey: z.string().uuid(),
  issuedAt: z.number().int(),
  expiresAt: z.number().int()
});

export type ApprovalTokenPayload = z.infer<typeof payloadSchema>;

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (body: string, secret: string) =>
  createHmac("sha256", secret).update(body).digest("base64url");

export function issueApprovalToken(options: {
  runId: string;
  scenarioId: string;
  diagnosis: Diagnosis;
  secret: string;
  now?: number;
  ttlSeconds?: number;
}): { token: string; payload: ApprovalTokenPayload } {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const action = options.diagnosis.recommendedAction;
  if (action.tool === "none") {
    throw new Error("Cannot issue an approval token for a non-mutating plan.");
  }

  const payload: ApprovalTokenPayload = {
    version: 1,
    runId: options.runId,
    scenarioId: options.scenarioId,
    action: {
      tool: action.tool,
      target: action.target,
      rationale: action.rationale,
      rollback: action.rollback
    },
    diagnosis: options.diagnosis,
    idempotencyKey: randomUUID(),
    issuedAt: now,
    expiresAt: now + (options.ttlSeconds ?? 300)
  };

  const body = encode(JSON.stringify(payload));
  return {
    token: `${body}.${sign(body, options.secret)}`,
    payload
  };
}

export function verifyApprovalToken(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000)
): ApprovalTokenPayload {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) {
    throw new Error("Approval token format is invalid.");
  }

  const expected = sign(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Approval token signature is invalid.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(decode(body));
  } catch {
    throw new Error("Approval token payload is invalid.");
  }

  const payload = payloadSchema.parse(raw);
  if (payload.expiresAt < now) {
    throw new Error("Approval token has expired.");
  }
  return payload;
}

import "dotenv/config";

export interface AppConfig {
  qwenApiKey?: string;
  qwenBaseUrl: string;
  primaryModel: string;
  criticModel: string;
  approvalSecret: string;
  allowedOrigin: string;
  deployment: "local" | "alibaba-function-compute";
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const qwenApiKey = overrides.qwenApiKey ?? process.env.DASHSCOPE_API_KEY;
  return {
    ...(qwenApiKey ? { qwenApiKey } : {}),
    qwenBaseUrl:
      overrides.qwenBaseUrl ??
      process.env.QWEN_BASE_URL ??
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    primaryModel:
      overrides.primaryModel ?? process.env.QWEN_PRIMARY_MODEL ?? "qwen3.7-plus",
    criticModel:
      overrides.criticModel ?? process.env.QWEN_CRITIC_MODEL ?? "qwen3.6-flash",
    approvalSecret:
      overrides.approvalSecret ??
      process.env.APPROVAL_HMAC_SECRET ??
      "local-development-secret-change-before-deploying",
    allowedOrigin:
      overrides.allowedOrigin ?? process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    deployment:
      overrides.deployment ??
      (process.env.FC_FUNCTION_NAME ? "alibaba-function-compute" : "local")
  };
}

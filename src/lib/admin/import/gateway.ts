import "server-only";

import { resolveImportGatewayConfig } from "./gateway-config";
import { classifyGatewayError } from "./gateway-errors";
import { createImportGatewayRequest, decodeImportGatewayResponse, type ImportGatewayTaxonomy } from "./gateway-response";

export const SUGGESTION_UNAVAILABLE = "Suggestions are unavailable. You can finish the review manually.";

export function isImportAiEnabled() {
  return process.env.SMART_IMPORT_AI_ENABLED === "true";
}

export function getImportGatewayConfig(runtimeOidcToken: string | null = null) {
  // Vercel supplies the OIDC token in the request header at function runtime,
  // not in VERCEL_OIDC_TOKEN (which is available in builds and local development).
  return resolveImportGatewayConfig({
    enabled: isImportAiEnabled(),
    runtimeOidcToken,
    envOidcToken: process.env.VERCEL_OIDC_TOKEN,
    apiKey: process.env.AI_GATEWAY_API_KEY,
    model: process.env.SMART_IMPORT_AI_MODEL,
  });
}

export async function suggestImportClassification(
  config: NonNullable<ReturnType<typeof getImportGatewayConfig>>,
  taxonomy: ImportGatewayTaxonomy,
  note: string,
  locale: "pt-BR" | "en"
) {
  const started = Date.now();
  const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify(createImportGatewayRequest(config.model, taxonomy, note, locale)),
  });

  if (!response.ok) {
    const failure = classifyGatewayError(response.status, await response.json().catch(() => null));
    console.warn("Smart Import Gateway request failed", {
      status: response.status,
      model: config.model,
      kind: failure.kind,
    });
    return { suggestion: null, status: response.status === 429 ? 429 : 503, error: failure.message };
  }

  const result = await response.json().catch(() => null);
  const { suggestion, kind } = decodeImportGatewayResponse(result, taxonomy);
  console.info("Smart Import generation", {
    model: config.model,
    inputTokens: result?.usage?.prompt_tokens,
    outputTokens: result?.usage?.completion_tokens,
    durationMs: Date.now() - started,
    valid: Boolean(suggestion),
    kind,
  });
  return { suggestion, status: suggestion ? 200 : 502 };
}

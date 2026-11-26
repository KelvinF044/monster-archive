import "server-only";
import { classifyGatewayError } from "../import/gateway-errors";
import { decodeEditorialGateway, editorialGatewayRequest } from "./assist-model";

export function editorialAiEnabled() {
  const flag = process.env.EDITORIAL_AI_ENABLED;
  if (flag !== undefined) return flag === "true";
  return process.env.VERCEL_ENV === "preview";
}

export function editorialGatewayToken(runtimeOidc: string | null) {
  return runtimeOidc || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY || "";
}

export async function generateEditorialSuggestion(token: string, evidence: Parameters<typeof editorialGatewayRequest>[0]) {
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(18000),
      body: JSON.stringify(editorialGatewayRequest(evidence)),
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const failure = classifyGatewayError(response.status, data);
      return { ...decodeEditorialGateway(null, evidence.kind), error: failure.kind };
    }
    const result = decodeEditorialGateway(data, evidence.kind);
    return { ...result, error: result.suggestion ? null : "invalid_output" };
  } catch {
    return { ...decodeEditorialGateway(null, evidence.kind), error: "gateway_unavailable" };
  }
}

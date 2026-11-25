function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function classifyGatewayError(status: number, payload: unknown) {
  const error = record(record(payload)?.error);
  const type = typeof error?.type === "string" ? error.type : "";
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";
  const hasCode = (value: string) => type === value || code === value;

  // Return only fixed, application-owned messages and categories. Do not
  // expose or log the upstream message, credentials, prompts, or response.
  if (status === 403 && hasCode("customer_verification_required")) {
    return { kind: "verification_required", message: "AI Gateway requires account verification. Check the Vercel dashboard." };
  }
  if (status === 403 && /free[- ]tier|free credits?/i.test(message)) {
    return { kind: "free_tier_model", message: "This AI model is unavailable on your free tier. Choose an eligible model." };
  }
  if (status === 403 && /team restrictions?|allowlist|not allowed by (your|the) team/i.test(message)) {
    return { kind: "team_restriction", message: "AI Gateway blocked this model or provider under the account settings." };
  }
  if (status === 403) {
    return { kind: "access_denied", message: "AI Gateway denied access. Check the Vercel AI Gateway dashboard." };
  }
  if (status === 401) {
    return { kind: "authentication", message: "AI authentication is unavailable. You can finish the review manually." };
  }
  if (status === 402 && hasCode("quota_for_entity_exceeded")) {
    return { kind: "budget_exceeded", message: "The AI usage budget has been reached. You can finish the review manually." };
  }
  if (status === 402) {
    return { kind: "credits_unavailable", message: "AI Gateway credits are unavailable. You can finish the review manually." };
  }
  if (status === 429) {
    return { kind: "rate_limit", message: "AI suggestions are temporarily rate-limited. Try again later or review manually." };
  }
  return { kind: "upstream_error", message: "Suggestions are unavailable. You can finish the review manually." };
}

type GatewayConfigOptions = {
  enabled: boolean;
  runtimeOidcToken?: string | null;
  envOidcToken?: string;
  apiKey?: string;
  model?: string;
};

export function resolveImportGatewayConfig(options: GatewayConfigOptions) {
  if (!options.enabled) return null;

  const token = options.runtimeOidcToken || options.envOidcToken || options.apiKey;
  if (!token) return null;

  return {
    token,
    model: options.model || "google/gemini-2.5-flash-lite",
  };
}

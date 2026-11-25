import assert from "node:assert/strict";
import test from "node:test";
import { resolveImportGatewayConfig } from "../src/lib/admin/import/gateway-config.ts";

test("uses the runtime OIDC credential when the environment token is absent", () => {
  assert.deepEqual(resolveImportGatewayConfig({
    enabled: true,
    runtimeOidcToken: "synthetic-runtime-token",
  }), {
    token: "synthetic-runtime-token",
    model: "google/gemini-3.5-flash-lite",
  });
});

test("prefers the runtime credential over stale or fallback credentials", () => {
  assert.equal(resolveImportGatewayConfig({
    enabled: true,
    runtimeOidcToken: "synthetic-current-token",
    envOidcToken: "synthetic-env-token",
    apiKey: "synthetic-api-key",
  })?.token, "synthetic-current-token");
});

test("supports local credentials and an explicit model", () => {
  assert.equal(resolveImportGatewayConfig({
    enabled: true,
    runtimeOidcToken: null,
    envOidcToken: "synthetic-local-token",
  })?.token, "synthetic-local-token");
  assert.deepEqual(resolveImportGatewayConfig({
    enabled: true,
    apiKey: "synthetic-api-key",
    model: "test-model",
  }), {
    token: "synthetic-api-key",
    model: "test-model",
  });
});

test("requires activation and an available credential", () => {
  assert.equal(resolveImportGatewayConfig({
    enabled: false,
    runtimeOidcToken: "synthetic-runtime-token",
  }), null);
  assert.equal(resolveImportGatewayConfig({ enabled: true }), null);
});

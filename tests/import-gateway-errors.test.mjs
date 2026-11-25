import assert from "node:assert/strict";
import test from "node:test";
import { classifyGatewayError } from "../src/lib/admin/import/gateway-errors.ts";

test("distinguishes Gateway account verification from model availability and team restrictions", () => {
  assert.equal(classifyGatewayError(403, { error: { type: "customer_verification_required" } }).kind, "verification_required");
  assert.equal(classifyGatewayError(403, { error: { message: "Model is not available on the free tier" } }).kind, "free_tier_model");
  assert.equal(classifyGatewayError(403, { error: { message: "Blocked by your team's allowlist" } }).kind, "team_restriction");
  assert.equal(classifyGatewayError(403, { error: { message: "Forbidden." } }).kind, "access_denied");
});

test("separates budget, credit, rate and credential failures", () => {
  assert.equal(classifyGatewayError(402, { error: { type: "quota_for_entity_exceeded" } }).kind, "budget_exceeded");
  assert.equal(classifyGatewayError(402, null).kind, "credits_unavailable");
  assert.equal(classifyGatewayError(429, null).kind, "rate_limit");
  assert.equal(classifyGatewayError(401, null).kind, "authentication");
});

test("does not expose arbitrary upstream errors or action links", () => {
  const fake = "private-upstream-detail";
  const result = classifyGatewayError(403, { error: { type: fake, message: fake } });
  assert.equal(result.kind, "access_denied");
  assert.ok(!JSON.stringify(result).includes(fake));
  assert.equal(classifyGatewayError(500, null).kind, "upstream_error");
});

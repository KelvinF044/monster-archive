import assert from "node:assert/strict";
import test from "node:test";
import { createImportGatewayRequest, decodeImportGatewayResponse } from "../src/lib/admin/import/gateway-response.ts";

const taxonomy = {
  collections: [{ id: "private-collection-id", title: "Official Music Videos", category: "MV" }],
  eras: [{ id: "private-era-id", name: "DRIP" }],
  members: Array.from({ length: 7 }, (_, i) => ({ id: `private-member-id-${i + 1}`, name: `Member ${i + 1}` })),
};
const complete = { collectionKey: "C1", eraKey: "E1", memberKeys: taxonomy.members.map((_, i) => `M${i + 1}`), reason: "Confirmed." };
const response = (value, finish_reason = "stop") => ({ choices: [{ finish_reason, message: { content: JSON.stringify(value) } }] });

test("gives the model short keys, not database identifiers, with a bounded response", () => {
  const body = createImportGatewayRequest("google/gemini-2.5-flash-lite", taxonomy, "Official MV.", "en");
  const catalog = JSON.parse(body.messages[1].content).catalog;
  assert.equal(catalog.collections[0].key, "C1");
  assert.equal(catalog.members[6].key, "M7");
  assert.ok(!JSON.stringify(body).includes("private-"));
  assert.equal(body.max_tokens, 800);
  assert.deepEqual(body.reasoning, { effort: "none" });
});

test("resolves all seven members without exposing or accepting model-generated database IDs", () => {
  const result = decodeImportGatewayResponse(response(complete), taxonomy);
  assert.equal(result.kind, "ok");
  assert.deepEqual(result.suggestion, { collectionId: taxonomy.collections[0].id, eraId: taxonomy.eras[0].id, memberIds: taxonomy.members.map(x => x.id), reason: "Confirmed." });
  assert.equal(decodeImportGatewayResponse(response({ ...complete, memberKeys: ["private-member-id-1"] }), taxonomy).kind, "invalid_classification");
});

test("preserves abstentions and rejects invalid keys, malformed responses and truncation", () => {
  const empty = { collectionKey: null, eraKey: null, memberKeys: [], reason: "No evidence." };
  assert.deepEqual(decodeImportGatewayResponse(response(empty), taxonomy).suggestion, { collectionId: null, eraId: null, memberIds: [], reason: "No evidence." });
  assert.equal(decodeImportGatewayResponse(response({ ...complete, collectionKey: "C2" }), taxonomy).kind, "invalid_classification");
  assert.equal(decodeImportGatewayResponse(response({ ...complete, eraKey: undefined }), taxonomy).kind, "invalid_classification");
  assert.equal(decodeImportGatewayResponse(response(complete, "length"), taxonomy).kind, "incomplete");
  assert.equal(decodeImportGatewayResponse({ choices: [{ finish_reason: "stop", message: { content: "{" } }] }, taxonomy).kind, "invalid_json");
  assert.equal(decodeImportGatewayResponse(null, taxonomy).kind, "missing_choice");
});

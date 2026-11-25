import assert from "node:assert/strict";
import test from "node:test";
import {
  applyImportSuggestion,
  applyImportSuggestionToBatch,
  parseImportSuggestionRequest,
  resolveImportClassification,
} from "../src/lib/admin/import/review.ts";
import { createImportGatewayRequest } from "../src/lib/admin/import/gateway-response.ts";

const sourceId = "10000000-0000-4000-8000-000000000001";
const videoIds = ["aBcDeFg_-09", "ABcDeFg_-09"];
const batch = { collectionId: "stage", eraId: "drip", memberIds: [] };
const suggestion = { collectionId: "mv", eraId: "drip", memberIds: ["ruka", "asa"], reason: "Common editorial facts." };

test("accepts the existing individual payload and one shared note for multiple videos", () => {
  const base = { sourceId, note: "  Official music video.  ", locale: "en" };
  assert.deepEqual(parseImportSuggestionRequest({ ...base, videoId: videoIds[0] }), {
    sourceId, videoIds: [videoIds[0]], note: "Official music video.", locale: "en", scope: "single",
  });
  assert.deepEqual(parseImportSuggestionRequest({ ...base, videoIds }), {
    sourceId, videoIds, note: "Official music video.", locale: "en", scope: "batch",
  });
  assert.equal(parseImportSuggestionRequest({ ...base, videoIds: Array.from({ length: 20 }, (_, i) => `video${String(i).padStart(6, "0")}`) }).videoIds.length, 20);
});

test("rejects blank notes, ambiguous payloads, duplicate selections and oversized batches", () => {
  const base = { sourceId, note: "Verified.", locale: "pt-BR", videoIds };
  for (const invalid of [
    { ...base, note: " " }, { ...base, note: "x".repeat(501) },
    { ...base, videoIds: [] }, { ...base, videoIds: [videoIds[0]] },
    { ...base, videoIds: [videoIds[0], videoIds[0]] },
    { ...base, videoIds: [videoIds[0], "wrong"] },
    { ...base, videoId: videoIds[0] },
    { ...base, videoIds: Array.from({ length: 21 }, (_, i) => `video${String(i).padStart(6, "0")}`) },
    { ...base, locale: "fr" },
  ]) assert.equal(parseImportSuggestionRequest(invalid), null);
});

test("applies a common suggestion to selected rows only, preserving manual edits", () => {
  const overrides = { [videoIds[1]]: { collectionId: "stage", eraId: null, memberIds: [] }, outside: { eraId: "other" } };
  const updated = applyImportSuggestionToBatch(batch, overrides, videoIds, suggestion);
  assert.deepEqual(updated[videoIds[0]], { collectionId: "mv", eraId: "drip", memberIds: ["ruka", "asa"] });
  assert.equal(updated[videoIds[1]], overrides[videoIds[1]]);
  assert.equal(updated.outside, overrides.outside);
  assert.equal(resolveImportClassification(batch, updated[videoIds[0]]).officialMvConfirmed, false);
  assert.notEqual(updated, overrides);
  assert.equal(applyImportSuggestionToBatch(batch, updated, videoIds, suggestion), updated);
});

test("does not create confirmation or replace explicit empty fields with unknown suggestions", () => {
  const old = { confirmedMvCollectionId: "stage", eraId: null, memberIds: [] };
  const next = applyImportSuggestion(batch, old, suggestion);
  assert.deepEqual(next, { collectionId: "mv", eraId: null, memberIds: [] });
  assert.equal(resolveImportClassification(batch, next).officialMvConfirmed, false);
  assert.equal(applyImportSuggestion(batch, old, { collectionId: null, eraId: null, memberIds: [], reason: "Unknown" }), old);
});

test("batch inference uses only common facts and does not send video IDs or database IDs", () => {
  const taxonomy = { collections: [{ id: "private-id", title: "Official Music Videos", category: "MV" }], eras: [], members: [] };
  const single = createImportGatewayRequest("google/gemini-2.5-flash-lite", taxonomy, "Verified note.", "en");
  const shared = createImportGatewayRequest("google/gemini-2.5-flash-lite", taxonomy, "Verified note.", "en", "batch");
  assert.ok(shared.messages[0].content.includes("common to every selected video"));
  assert.ok(!single.messages[0].content.includes("common to every selected video"));
  assert.deepEqual(single.messages[1], shared.messages[1]);
  assert.ok(!JSON.stringify(shared).includes("private-id"));
  videoIds.forEach(id => assert.ok(!JSON.stringify(shared).includes(id)));
});

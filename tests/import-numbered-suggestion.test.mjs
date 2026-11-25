import assert from "node:assert/strict";
import test from "node:test";
import { applyImportSuggestionToBatch, parseNumberedEditorialNote } from "../src/lib/admin/import/review.ts";
import { constrainSharedImportSuggestion, createNumberedImportGatewayRequest, decodeNumberedImportGatewayResponse, hasMixedEditorialCollections } from "../src/lib/admin/import/gateway-response.ts";

const taxonomy = {
  collections: [{ id: "stage", title: "Stages", category: "Stages" }, { id: "behind", title: "Behind the Scenes", category: "Behind" }, { id: "event", title: "Live & Festival Events", category: "Events" }],
  eras: [{ id: "drip", name: "DRIP" }],
  members: [{ id: "rora", name: "RORA" }, { id: "chiquita", name: "CHIQUITA" }],
};
const note = { sharedNote: "Todos na era DRIP.", entries: [{ number: 1, note: "Apresentação musical." }, { number: 2, note: "Bastidores com RORA e CHIQUITA." }] };
const common = { collectionKey: null, eraKey: "E1", memberKeys: [], reason: "Common era." };
const rows = [{ number: 2, collectionKey: "C2", eraKey: "E1", memberKeys: ["M1", "M2"], reason: "Behind." }, { number: 1, collectionKey: "C1", eraKey: "E1", memberKeys: [], reason: "Stage." }];
const response = value => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] });

test("parses a single note with shared facts and numbered PT/EN entries", () => {
  assert.deepEqual(parseNumberedEditorialNote("Todos na era DRIP.\n1: Apresentação musical.\nVídeo 2: Bastidores com RORA e CHIQUITA.", 2), note);
  assert.deepEqual(parseNumberedEditorialNote("Todos na era DRIP.; video 1: Apresentação musical.; #2: Bastidores com RORA e CHIQUITA.", 2), note);
  assert.deepEqual(parseNumberedEditorialNote("Todos da era DRIP.", 4), { sharedNote: "Todos da era DRIP.", entries: [] });
  assert.deepEqual(parseNumberedEditorialNote("2: Bastidores", 4), { sharedNote: "", entries: [{ number: 2, note: "Bastidores" }] });
});

test("rejects repeated, out-of-range or empty numbered entries", () => {
  for (const invalid of ["3: show", "0: performance", "1: one\n1: two", "1:\n2: two", "2:"]) assert.equal(parseNumberedEditorialNote(invalid, 2), null);
});

test("mixed shared types never produce a collection for every video", () => {
  const text = "Videos da era Drip contendo Programa de variedade, music show e tour";
  assert.equal(hasMixedEditorialCollections(text), true);
  assert.equal(hasMixedEditorialCollections("Todos são apresentações em music show da era DRIP."), false);
  assert.equal(hasMixedEditorialCollections("Todos são music show behind."), false);
  const guarded = constrainSharedImportSuggestion({ collectionId: "stage", eraId: "drip", memberIds: [], reason: "Wrong category." }, text, "pt-BR");
  assert.equal(guarded.collectionId, null);
  assert.equal(guarded.eraId, "drip");
  assert.match(guarded.reason, /tipos diferentes/);
});

test("one structured request contains numbered editorial notes, not video titles or IDs", () => {
  const body = createNumberedImportGatewayRequest("google/gemini-2.5-flash-lite", taxonomy, note, "pt-BR");
  const input = JSON.parse(body.messages[1].content);
  assert.deepEqual(input.numberedNotes, note.entries);
  assert.equal(input.sharedNote, note.sharedNote);
  assert.deepEqual(body.response_format.json_schema.schema.required, ["common", "items"]);
  assert.equal(body.max_tokens, 570);
  assert.ok(!JSON.stringify(input).includes('"id":'));
});

test("maps responses by number and refuses missing, duplicated or unexpected numbers", () => {
  const result = decodeNumberedImportGatewayResponse(response({ common, items: rows }), taxonomy, note, "en");
  assert.equal(result.kind, "ok");
  assert.deepEqual(result.individual.map(item => [item.number, item.suggestion.collectionId, item.suggestion.memberIds]), [[2, "behind", ["rora", "chiquita"]], [1, "stage", []]]);
  for (const bad of [[rows[0]], [rows[0], rows[0]], [{ ...rows[0], number: 3 }, rows[1]], [{ ...rows[0], collectionKey: "C9" }, rows[1]]]) {
    assert.equal(decodeNumberedImportGatewayResponse(response({ common, items: bad }), taxonomy, note, "en").kind, "invalid_classification");
  }
  const emptyShared = decodeNumberedImportGatewayResponse(response({ common, items: rows }), taxonomy, { ...note, sharedNote: "" }, "en");
  assert.equal(emptyShared.suggestion.eraId, null);
});

test("applies distinct suggestions to matching videos without replacing individual edits", () => {
  const result = decodeNumberedImportGatewayResponse(response({ common, items: rows }), taxonomy, note, "en");
  const keys = ["v1", "v2", "v3"];
  const individual = Object.fromEntries(result.individual.map(item => [keys[item.number - 1], item.suggestion]));
  const batch = { collectionId: "event", eraId: null, memberIds: [] };
  const updated = applyImportSuggestionToBatch(batch, { v2: { collectionId: "event" } }, keys, result.suggestion, individual);
  assert.deepEqual(updated.v1, { collectionId: "stage", eraId: "drip" });
  assert.deepEqual(updated.v2, { collectionId: "event", eraId: "drip", memberIds: ["rora", "chiquita"] });
  assert.deepEqual(updated.v3, { eraId: "drip" });
});

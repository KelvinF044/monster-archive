import assert from "node:assert/strict";
import test from "node:test";

import { IMPORT_BATCH_LIMIT, parseImportApproval, resolveImportClassification } from "../src/lib/admin/import/review.ts";

const sourceId = "10000000-0000-4000-8000-000000000001";
const collectionId = "10000000-0000-4000-8000-000000000002";
const eraId = "10000000-0000-4000-8000-000000000003";
const memberId = "10000000-0000-4000-8000-000000000004";
const videoId = "aBcDeFg_-09";

test("preserves legacy batch classification and deduplication", () => {
  const result = parseImportApproval({
    sourceId,
    collectionId,
    eraId,
    memberIds: [memberId, memberId],
    videoIds: [videoId, videoId, "ABcDeFg_-09"],
  });

  assert.equal(result?.items.size, 2);
  assert.deepEqual(result?.items.get(videoId), {
    videoId, collectionId, eraId, memberIds: [memberId], officialMvConfirmed: false,
  });
});

test("preserves explicit empty fields and different classifications within a batch", () => {
  const differentVideo = "ABcDeFg_-09";
  const result = parseImportApproval({
    sourceId,
    items: [
      { videoId, collectionId, eraId: null, memberIds: [], officialMvConfirmed: false },
      { videoId: differentVideo, collectionId, eraId, memberIds: [memberId], officialMvConfirmed: true },
    ],
  });

  assert.equal(result?.items.get(videoId)?.eraId, null);
  assert.deepEqual(result?.items.get(videoId)?.memberIds, []);
  assert.deepEqual(result?.items.get(differentVideo), {
    videoId: differentVideo, collectionId, eraId, memberIds: [memberId], officialMvConfirmed: true,
  });
});

test("rejects malformed or ambiguous per-video classifications", () => {
  const item = { videoId, collectionId };
  for (const invalid of [
    null,
    { sourceId, items: [item, item] },
    { sourceId, items: [{ ...item, videoId: "invalid" }] },
    { sourceId, items: [{ ...item, collectionId: "" }] },
    { sourceId, items: [{ ...item, eraId: 1 }] },
    { sourceId, items: [{ ...item, memberIds: "all" }] },
    { sourceId, items: [{ ...item, officialMvConfirmed: "true" }] },
  ]) {
    assert.equal(parseImportApproval(invalid), null);
  }
});

test("accepts twenty videos and rejects larger batches", () => {
  const ids = Array.from({ length: IMPORT_BATCH_LIMIT + 1 }, (_, i) => `video${String(i).padStart(6, "0")}`);
  const batch = { sourceId, collectionId, videoIds: ids };
  assert.equal(parseImportApproval({ ...batch, videoIds: ids.slice(1) })?.items.size, IMPORT_BATCH_LIMIT);
  assert.equal(parseImportApproval(batch), null);
});

test("inherits each batch field and keeps explicit empty values and MV verification", () => {
  const batch = { collectionId, eraId, memberIds: [memberId] };

  assert.deepEqual(resolveImportClassification(batch, { eraId: null, memberIds: [] }), {
    collectionId, eraId: null, memberIds: [], officialMvConfirmed: false,
  });
  assert.equal(resolveImportClassification(batch, { confirmedMvCollectionId: collectionId }).officialMvConfirmed, true);
  assert.equal(resolveImportClassification(batch, { collectionId: sourceId, confirmedMvCollectionId: collectionId }).officialMvConfirmed, false);
});

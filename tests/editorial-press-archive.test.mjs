import assert from "node:assert/strict";
import test from "node:test";
import { coverStorageResult } from "../src/lib/admin/editorial/cover-storage-result.ts";
import { parseHeraldArchive, parseTimesArchive, pressArchiveUrl } from "../src/lib/admin/editorial/press-archive.ts";

test("press archive page numbers map to publisher-specific parameters", () => {
  assert.equal(new URL(pressArchiveUrl("korea-herald", 2)).searchParams.get("page"), "2");
  assert.equal(new URL(pressArchiveUrl("korea-times", 2)).searchParams.get("page"), "1");
  assert.throws(() => pressArchiveUrl("korea-times", 21));
});

test("Herald reads title, snippet and local publication date from archive results", () => {
  const html = `<div class="search_content"><ul class="news_list">
    <li><a href="/article/123456?tracking=1"><p class="news_title"><em>Babymonster</em> reaches a milestone</p>
    <p class="news_text">The group posted an announcement.</p><p class="news_info"><span>2026.11.18 11:39</span></p></a></li>
    <li><a href="/article/123457"><p class="news_title">Unrelated report</p></a></li>
  </ul></div>`;
  const [match, other] = parseHeraldArchive(html);
  assert.equal(other, undefined);
  assert.equal(match.canonical_url, "https://www.koreaherald.com/article/123456");
  assert.equal(match.original_title, "Babymonster reaches a milestone");
  assert.equal(match.source_published_at, "2026-11-18T00:00:00.000Z");
});

test("Times converts search snippets to plain text and rejects third-party URLs", () => {
  const row = {
    articleId: "article-1", slugUrl: "/entertainment/k-pop/20261014/babymonster-new-single",
    pcTitle: "BABYMONSTER to release a single", highlightContent: "<em>BABYMONSTER</em> announced it.", pubDt: "2026-10-14 10:52:08",
  };
  const items = parseTimesArchive({ data: { contents: [row, { ...row, slugUrl: "https://example.org/entertainment/20261014/story" }] } });
  assert.equal(items.length, 1);
  assert.equal(items[0].original_excerpt, "BABYMONSTER announced it.");
  assert.equal(items[0].source_published_at, "2026-10-14T00:00:00.000Z");
  assert.throws(() => parseTimesArchive({ data: {} }));
});

test("cover storage reports missing bucket, access, unknown 404 and actual duplicates separately", () => {
  assert.equal(coverStorageResult({ statusCode: "404", message: "Bucket not found" }), "cover_bucket_missing");
  assert.equal(coverStorageResult({ statusCode: "404", message: "Not found" }), "cover_storage_not_found");
  assert.equal(coverStorageResult({ status: 400, message: "new row violates row-level security policy" }), "cover_storage_access");
  assert.equal(coverStorageResult({ statusCode: "409", message: "The resource already exists" }), "existing");
  assert.equal(coverStorageResult({ statusCode: "409", message: "Other conflict" }), "cover_storage");
});

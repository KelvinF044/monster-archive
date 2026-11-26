import test from "node:test";
import assert from "node:assert/strict";
import { feedUrl, matchesFeedTerm, parseDiscovery, parseSource } from "../src/lib/admin/editorial/model.ts";
import { parseFeed } from "../src/lib/admin/editorial/parse-feed.ts";

test("source registration uses the shared registry and recognizes a direct RSS URL", () => {
  const source = { name: "Archive test", homepage_url: "https://example.org", source_kind: "official_group", is_active: true };
  assert.equal(parseSource({ ...source, feed_url: "" }).discovery_method, "manual");
  assert.equal(parseSource({ ...source, feed_url: "https://example.org/feed.xml#ignored" }).feed_url, "https://example.org/feed.xml");
  assert.equal(parseSource({ ...source, feed_url: "https://example.org/feed.xml" }).discovery_method, "rss");
  assert.equal(parseSource({ ...source, feed_url: "http://example.org/feed.xml" }), null);
  for (const unsafe of ["https://localhost/feed", "https://127.0.0.1/feed", "https://[::1]/feed", "https://example.org:8080/feed", "https://user@example.org/feed"]) {
    assert.equal(feedUrl(unsafe), null);
  }
});

test("RSS metadata is canonicalized for deduplication and grouped by search term", () => {
  const items = parseFeed(
    `<rss version="2.0"><channel><title>Test press</title>
      <item><title>Baby Monster &amp; guests</title><link>/story?utm_source=rss&amp;id=1</link><guid>editorial-001</guid>
      <description><![CDATA[<p>Concert &nbsp; announcement</p>]]></description><pubDate>Wed, 25 Nov 2026 18:00:00 GMT</pubDate></item>
      <item><title>베이비몬스터 공연</title><link>https://example.org/concert</link></item>
      <item><title>Other group</title><link>https://example.org/other</link></item>
    </channel></rss>`, "https://example.org/feed.xml",
  );
  assert.equal(items.length, 3);
  assert.deepEqual(items[0], {
    source_url: "https://example.org/story?utm_source=rss&id=1", canonical_url: "https://example.org/story?id=1",
    external_id: "editorial-001", original_title: "Baby Monster & guests", original_excerpt: "Concert announcement",
    original_language: null, source_published_at: "2026-11-25T18:00:00.000Z",
  });
  assert.deepEqual(items.filter(item => matchesFeedTerm(item, "BABYMONSTER")).map(item => item.original_title), ["Baby Monster & guests", "베이비몬스터 공연"]);
  assert.equal(items.filter(item => matchesFeedTerm(item, "")).length, 3);
});

test("Atom selects the human-readable link, publication date, and language", () => {
  const [entry] = parseFeed(
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
      <entry><id>urn:entry:1</id><title>Concert</title><link rel="self" href="https://example.org/xml"/>
      <link rel="alternate" href="/concert"/><updated>2026-11-26T08:00:00Z</updated><published>2026-11-25T08:00:00Z</published>
      <summary type="html">&lt;p&gt;See details&lt;/p&gt;</summary></entry></feed>`, "https://example.org/atom.xml",
  );
  assert.equal(entry.source_url, "https://example.org/concert");
  assert.equal(entry.source_published_at, "2026-11-25T08:00:00.000Z");
  assert.equal(entry.original_language, "en");
  assert.equal(entry.original_excerpt, "See details");
});

test("malformed XML and DTDs are refused; untrusted link schemes do not create candidates", () => {
  assert.throws(() => parseFeed("<rss><channel><item>", "https://example.org/feed"));
  assert.throws(() => parseFeed("<!DOCTYPE rss><rss/>", "https://example.org/feed"));
  assert.throws(() => parseFeed("<html/>", "https://example.org/feed"));
  assert.deepEqual(parseFeed("<rss><channel><item><title>Invalid link</title><link>javascript:disabled</link></item></channel></rss>", "https://example.org/feed"), []);
});

test("manual candidate canonical URL removes tracking and invalid metadata is rejected", () => {
  const fields = { source_url: "https://example.org/a?fbclid=a&b=2#ref", original_title: "Concert", original_excerpt: "", original_language: "pt-BR", external_id: "", source_published_at: "2026-11-26T00:00:00Z" };
  assert.equal(parseDiscovery(fields).canonical_url, "https://example.org/a?b=2");
  assert.equal(parseDiscovery({ ...fields, source_published_at: "tomorrow" }), null);
  assert.equal(parseDiscovery({ ...fields, original_title: "" }), null);
});

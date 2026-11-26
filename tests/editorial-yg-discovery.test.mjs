import assert from "node:assert/strict";
import test from "node:test";
import { discoveryUrlAliases, xPostId, ygReportUrl } from "../src/lib/admin/editorial/publishers.ts";
import { listYgReports, parseYgCover, parseYgReport } from "../src/lib/admin/editorial/yg-report.ts";

const report = "https://ygfamily.com/en/news/report/7589";

test("YG discovery filters headlines, canonicalizes URLs and skips unrelated or external links", () => {
  const list = `<a href="/en/news/report/7589">BABYMONSTER reaches 200 million views</a>
    <a href="https://www.ygfamily.com/en/news/report/7589?utm_source=test">BABY MONSTER succeeds</a>
    <a href="/en/news/report/1">Other artist interview</a>
    <a href="https://unrelated.test/en/news/report/9">BABYMONSTER</a>`;
  assert.deepEqual(listYgReports(list), [report]);
  assert.equal(ygReportUrl("https://ygfamily.com@unrelated.test/en/news/report/7589"), null);
  assert.ok(discoveryUrlAliases(report).includes("https://www.ygfamily.com/en/news/report/7589/"));
  assert.equal(xPostId("https://twitter.com/YGBABYMONSTER_/status/123"), "123");
  assert.ok(discoveryUrlAliases("https://x.com/YGBABYMONSTER_/status/123").includes("https://twitter.com/YGBABYMONSTER_/status/123"));
  assert.deepEqual(discoveryUrlAliases("https://example.com/story"), ["https://example.com/story"]);
});

test("YG detail reads the headline, short excerpt and date from the report rather than site metadata", () => {
  const title = "BABYMONSTER reaches a milestone";
  const html = `<meta property="og:title" content="YG Entertainment"><header class="view_header"><div class="view_tit">
    <h2>${title}</h2></div><span class="date">2026.10.12</span></header>
    <section class="view_body"><div class="ql-editor"><p>${title}</p>
    <p>YG reported that the music video reached 200 million views.</p></div></section>`;
  assert.deepEqual(parseYgReport(html, report), {
    source_url: report, canonical_url: report, external_id: "7589", original_title: title,
    original_excerpt: "YG reported that the music video reached 200 million views.",
    original_language: "en", source_published_at: "2026-10-12T00:00:00.000Z",
  });
});

test("YG extracts a raster embedded in the article body while ignoring the generic sharing image", () => {
  const jpeg = Buffer.from([255, 216, 255, ...Array(15).fill(0)]);
  const html = `<meta property="og:image" content="https://ygfamily.com/contents/brand.jpg">
    <section class="view_body"><div class="ql-editor">
    <img src="data:image/svg+xml;base64,PHN2Zz4=">
    <img src="https://unrelated.test/contents/ad.jpg">
    <img src="data:image/jpeg;base64,${jpeg.toString("base64")}"></div></section>`;
  assert.deepEqual(parseYgCover(html), { inline: { mime: "image/jpeg", bytes: jpeg } });
  assert.equal(parseYgCover('<meta property="og:image" content="https://ygfamily.com/contents/brand.jpg">'), null);
  assert.deepEqual(parseYgCover('<section class="view_body"><div class="ql-editor"><img src="/contents/report.webp"></div></section>'),
    { url: "https://ygfamily.com/contents/report.webp" });
});

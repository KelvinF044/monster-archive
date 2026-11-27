import "server-only";
import { createHash } from "node:crypto";
import { readPublicBytes } from "./read-feed";
import { listYgReports, parseYgCover, parseYgReport, validateRaster } from "./yg-report";
import { YG_REPORTS, ygReportUrl } from "./publishers";
import type { Discovery } from "./model";

const HTML_LIMIT = 5 * 1024 * 1024;
const IMAGE_LIMIT = 3 * 1024 * 1024;

async function readHtml(url: string) {
  const bytes = await readPublicBytes(url, "text/html,application/xhtml+xml", HTML_LIMIT);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function readYgNews() {
  const urls = listYgReports(await readHtml(YG_REPORTS)).slice(0, 12);
  if (!urls.length) throw new Error("No matching reports in the YG listing");
  const items: Discovery[] = [];
  let failures = 0;
  // Limit simultaneous connections and total article bodies retained in memory.
  for (let index = 0; index < urls.length; index += 4) {
    const results = await Promise.allSettled(urls.slice(index, index + 4).map(async url => parseYgReport(await readHtml(url), url)));
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) items.push(result.value);
      else failures++;
    }
  }
  if (!items.length) throw new Error("No YG report could be read");
  return { items, failures };
}

export async function readYgCover(value: string) {
  const url = ygReportUrl(value);
  if (!url) return null;
  const source = parseYgCover(await readHtml(url));
  if (!source) return null;
  const cover = "inline" in source
    ? source.inline
    : validateRaster(await readPublicBytes(source.url, "image/jpeg,image/png,image/webp", IMAGE_LIMIT));
  if (!cover) return null;
  return { ...cover, hash: createHash("sha256").update(cover.bytes).digest("hex"), url };
}

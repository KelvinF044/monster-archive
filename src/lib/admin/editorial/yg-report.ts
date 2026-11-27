import { load } from "cheerio/slim";
import { DEFAULT_BAND_FILTER, matchesFeedTerm, parseDiscovery } from "./model.ts";
import { YG_REPORTS, ygReportUrl } from "./publishers.ts";

const IMAGE_LIMIT = 3 * 1024 * 1024;
type RasterType = "image/jpeg" | "image/png" | "image/webp";
export type ReportCover = { bytes: Buffer; mime: RasterType };
type ImageSource = { inline: ReportCover } | { url: string };

function cleaned(value: string) { return value.replace(/\s+/g, " ").trim(); }

export function listYgReports(html: string) {
  const $ = load(html);
  return [...new Set($("a[href]").toArray().flatMap(anchor => {
    const element = $(anchor);
    const url = ygReportUrl(element.attr("href") ?? "");
    const title = cleaned(element.find(".title, .tit").first().text() || element.text());
    if (!url || !title || !matchesFeedTerm({ original_title: title, original_excerpt: null }, DEFAULT_BAND_FILTER)) return [];
    return [url];
  }))];
}

function shortExcerpt(paragraph: string) {
  return paragraph.split(" ").slice(0, 24).join(" ").slice(0, 300);
}

export function parseYgReport(html: string, value: string) {
  const url = ygReportUrl(value);
  if (!url) return null;
  const $ = load(html);
  const title = cleaned($(".view_header .view_tit h2").first().text());
  const date = cleaned($(".view_header .date").first().text());
  const body = $(".view_body .ql-editor").first();
  if (!title || !body.length || !matchesFeedTerm({ original_title: title, original_excerpt: null }, DEFAULT_BAND_FILTER)) return null;
  const paragraph = body.find("p").toArray().map(p => cleaned($(p).text()))
    .find(value => value !== title && value.length >= 24);
  const iso = /^\d{4}\.\d{2}\.\d{2}$/.test(date) ? date.replaceAll(".", "-") + "T00:00:00.000Z" : "";
  return parseDiscovery({
    source_url: url, original_title: title.slice(0, 250), original_excerpt: paragraph ? shortExcerpt(paragraph) : "",
    original_language: "en", source_published_at: iso, external_id: url.split("/").at(-1),
  });
}

export function validateRaster(bytes: Buffer): ReportCover | null {
  if (bytes.length < 16 || bytes.length > IMAGE_LIMIT) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { bytes, mime: "image/jpeg" };
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { bytes, mime: "image/png" };
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return { bytes, mime: "image/webp" };
  return null;
}

export function parseYgCover(html: string): ImageSource | null {
  const $ = load(html);
  // The site's generic Open Graph artwork accompanies every report. Pick
  // the first permitted raster that actually belongs to the article body.
  for (const image of $(".view_body .ql-editor img").toArray()) {
    const src = $(image).attr("data-src") || $(image).attr("src") || "";
    if (src.startsWith("data:")) {
      const prefix = /^data:image\/(?:jpeg|png|webp);base64,/.exec(src);
      if (!prefix || src.length > Math.ceil(IMAGE_LIMIT * 4 / 3) + prefix[0].length + 4) continue;
      const payload = src.slice(prefix[0].length);
      if (payload.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) continue;
      const raster = validateRaster(Buffer.from(payload, "base64"));
      if (raster) return { inline: raster };
      continue;
    }
    try {
      const url = new URL(src, YG_REPORTS);
      if (["ygfamily.com", "www.ygfamily.com"].includes(url.hostname)
        && ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.port
        && url.pathname.startsWith("/contents/") && /\.(?:jpe?g|png|webp)$/i.test(url.pathname)) {
        url.protocol = "https:";
        url.hash = "";
        return { url: url.href };
      }
    } catch { /* Continue to the next image. */ }
  }
  return null;
}

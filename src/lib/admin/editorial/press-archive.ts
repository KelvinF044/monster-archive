import { load } from "cheerio/slim";
import { PRESS_ARCHIVE_PAGE_LIMIT, type PressProvider } from "./publishers.ts";
import { readObject } from "../news/model.ts";
import { DEFAULT_BAND_FILTER, matchesFeedTerm, parseDiscovery } from "./model.ts";

const TIMES_HOMEPAGE = "https://www.koreatimes.co.kr/";
const HERALD_HOMEPAGE = "https://www.koreaherald.com/";

export function pressArchiveUrl(provider: PressProvider, page: number) {
  if (!Number.isInteger(page) || page < 1 || page > PRESS_ARCHIVE_PAGE_LIMIT) throw new Error("Invalid archive page");
  if (provider === "korea-herald") {
    const params = new URLSearchParams({ page: String(page), q: DEFAULT_BAND_FILTER, stype: "NEWS" });
    return HERALD_HOMEPAGE + "search/detail?" + params;
  }
  const params = new URLSearchParams({ query: DEFAULT_BAND_FILTER, sort: "RELEVANCE", page: String(page - 1), size: "20" });
  return "https://goatway.koreatimes.co.kr/api/home/ai/search/ARTICLE?" + params;
}

function plain(value: string) { return value.replace(/\s+/g, " ").trim(); }

function makeItem(href: string, title: string, snippet: string, date: string, home: string, id: string) {
  let url: URL;
  try { url = new URL(href, home); } catch { return null; }
  if (url.origin !== new URL(home).origin || url.username || url.password) return null;
  const isHerald = home === HERALD_HOMEPAGE;
  if (!(isHerald ? /^\/article\/\d+\/?$/ : /^\/[a-z-]+\/(?:[a-z-]+\/)?\d{8}\/[a-z0-9][a-z0-9-]*\/?$/).test(url.pathname)) return null;
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  if (!matchesFeedTerm({ original_title: title, original_excerpt: snippet }, DEFAULT_BAND_FILTER)) return null;
  // The archive exposes local dates. Keep the date without inventing a time.
  const calendarDate = /^(\d{4})[-.](\d{2})[-.](\d{2})(?:[ T]|$)/.exec(date);
  return parseDiscovery({
    source_url: url.href, original_title: title.slice(0, 250), original_excerpt: snippet.split(" ").slice(0, 24).join(" ").slice(0, 300),
    original_language: "en", external_id: id,
    source_published_at: calendarDate ? calendarDate.slice(1).join("-") + "T00:00:00Z" : "",
  });
}

export function parseHeraldArchive(html: string) {
  const $ = load(html);
  if (!$(".search_section, .search_content").length) throw new Error("Unrecognized Korea Herald search response");
  return $(".news_list a[href]").toArray().slice(0, 40).flatMap(anchor => {
    const row = $(anchor);
    const href = row.attr("href") ?? "";
    const item = makeItem(href, plain(row.find(".news_title").text()), plain(row.find(".news_text").text()),
      plain(row.find(".news_info span").first().text()), HERALD_HOMEPAGE, /\/article\/(\d+)/.exec(href)?.[1] ?? "");
    return item ? [item] : [];
  });
}

export function parseTimesArchive(input: unknown) {
  const result = readObject(input);
  const data = readObject(result?.data);
  if (!Array.isArray(data?.contents)) throw new Error("Unrecognized Korea Times search response");
  return data.contents.slice(0, 20).flatMap(value => {
    const row = readObject(value);
    if (typeof row?.slugUrl !== "string") return [];
    const htmlText = (field: unknown) => typeof field === "string" ? plain(load(field.slice(0, 2600), {}, false).root().text()) : "";
    const title = htmlText(row.pcTitle || row.originalTitle || row.highlightTitle);
    const snippet = htmlText(row.highlightContent || row.lead);
    const item = makeItem(row.slugUrl, title, snippet, typeof row.pubDt === "string" ? row.pubDt : "",
      TIMES_HOMEPAGE, typeof row.articleId === "string" ? row.articleId.slice(0, 512) : "");
    return item ? [item] : [];
  });
}

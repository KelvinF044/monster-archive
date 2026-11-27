import "server-only";
import { readObject } from "../news/model";
import type { AdminDatabase } from "../news/queries";
import { DEFAULT_BAND_FILTER, FEED_SCAN_LIMIT, matchesFeedTerm, parseDiscovery, type Discovery } from "./model";
import { getSource, insertCandidate, listSources, sourceFields } from "./repository";
import { isPressProvider, NEWS_PRESETS, type NewsProvider, type PressProvider } from "./publishers";
import { parseHeraldArchive, parseTimesArchive, pressArchiveUrl } from "./press-archive";
import { readFeed, readPublicBytes } from "./read-feed";
import { readYgNews } from "./read-yg";

type Preset = Exclude<NewsProvider, "rss">;

function normalizedHomepage(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "");
  } catch { return ""; }
}

async function presetSource(db: AdminDatabase, provider: Preset) {
  const preset = NEWS_PRESETS[provider];
  const find = async () => (await listSources(db)).find(source =>
    normalizedHomepage(source.homepage_url) === normalizedHomepage(preset.homepage_url) && source.source_kind === preset.source_kind);
  const existing = await find();
  if (existing) return existing;
  const result = await db.from("editorial_sources").insert({ ...preset, is_active: true }).select(sourceFields).single();
  if (result.error?.code === "23505") return await find() ?? null;
  if (result.error) throw new Error("database_error");
  return result.data;
}

class XRequestError extends Error {
  constructor(readonly status: number) { super("X search unavailable"); }
}

async function readXAppearances(token: string): Promise<Discovery[]> {
  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.search = new URLSearchParams({
    query: "from:YGBABYMONSTER_ (performance OR stage OR concert OR festival OR interview OR 공연 OR 무대 OR 인터뷰) -is:retweet -is:reply",
    max_results: "10",
    "tweet.fields": "created_at,lang",
  }).toString();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new XRequestError(response.status);
  const result = readObject(await response.json());
  if (!result) throw new Error("Invalid X response");
  const posts = Array.isArray(result.data) ? result.data.slice(0, 10) : [];
  return posts.flatMap(value => {
    const post = readObject(value);
    if (!post || typeof post.id !== "string" || !/^\d{1,20}$/.test(post.id)) return [];
    // Keep references only. The editor supplies verified facts for a draft.
    const item = parseDiscovery({
      source_url: "https://x.com/YGBABYMONSTER_/status/" + post.id,
      original_title: "BABYMONSTER — public appearance reference on X",
      original_excerpt: "",
      original_language: typeof post.lang === "string" && /^[a-z]{2,3}$/i.test(post.lang) ? post.lang : "",
      source_published_at: typeof post.created_at === "string" ? post.created_at : "",
      external_id: "x:" + post.id,
    });
    return item ? [item] : [];
  });
}

async function searchPressArchive(provider: PressProvider, page: number) {
  const url = pressArchiveUrl(provider, page);
  const isHerald = provider === "korea-herald";
  const bytes = await readPublicBytes(url, isHerald ? "text/html" : "application/json");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return isHerald ? parseHeraldArchive(text) : parseTimesArchive(JSON.parse(text));
}

export async function discoverNews(db: AdminDatabase, provider: NewsProvider, sourceId: string | null, page = 1) {
  const token = provider === "x" ? process.env.EDITORIAL_X_BEARER_TOKEN?.trim() : undefined;
  if (provider === "x" && !token) return { error: "x_setup", status: 503 } as const;
  const source = provider === "rss" && sourceId ? await getSource(db, sourceId)
    : provider !== "rss" ? await presetSource(db, provider) : null;
  if (!source?.is_active) return { error: "inactive_source", status: 409 } as const;

  let items: Discovery[], failures = 0;
  let scope: "archive" | "feed" | undefined;
  try {
    if (provider === "yg") {
      const result = await readYgNews();
      items = result.items;
      failures = result.failures;
    } else if (provider === "x") {
      if (!token) return { error: "x_setup", status: 503 } as const;
      items = await readXAppearances(token);
    } else if (isPressProvider(provider)) {
      try {
        items = await searchPressArchive(provider, page);
        scope = "archive";
      } catch (error) {
        if (page !== 1) throw error;
        items = (await readFeed(NEWS_PRESETS[provider].feed_url)).filter(item => matchesFeedTerm(item, DEFAULT_BAND_FILTER));
        scope = "feed";
      }
    } else {
      if (source.discovery_method !== "rss" || !source.feed_url) return { error: "invalid_source", status: 400 } as const;
      items = (await readFeed(source.feed_url)).filter(item => matchesFeedTerm(item, DEFAULT_BAND_FILTER));
      scope = "feed";
    }
  } catch (error) {
    if (error instanceof XRequestError) {
      if (error.status === 401 || error.status === 403) return { error: "x_access", status: 422 } as const;
      if (error.status === 402) return { error: "x_credits", status: 422 } as const;
      if (error.status === 429) return { error: "x_rate_limit", status: 429 } as const;
    }
    return { error: provider === "x" ? "x_error" : "publisher_error", status: 422 } as const;
  }

  const current = await getSource(db, source.id);
  if (!current?.is_active || current.updated_at !== source.updated_at) return { error: "stale", status: 409 } as const;
  let added = 0, duplicates = 0;
  const batch = items.slice(0, FEED_SCAN_LIMIT);
  for (let offset = 0; offset < batch.length; offset += 5) {
    const outcomes = await Promise.allSettled(batch.slice(offset, offset + 5).map(item => insertCandidate(db, source.id, "news", item)));
    for (const outcome of outcomes) {
      if (outcome.status === "rejected") failures++;
      else if (outcome.value === "added") added++;
      else duplicates++;
    }
  }
  const saved = await db.from("editorial_sources").update({ last_scanned_at: new Date().toISOString() })
    .eq("id", source.id).eq("updated_at", source.updated_at);
  if (saved.error) failures++;
  return { added, duplicates, matches: items.length, truncated: items.length > FEED_SCAN_LIMIT, failures, ...(scope ? { scope } : {}) };
}

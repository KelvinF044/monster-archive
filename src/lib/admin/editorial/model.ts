import { canonicalSourceUrl, isSourceKind, publicUrl, readObject, textValue, type EditorialSource } from "../news/model.ts";

export const CANDIDATE_KINDS = ["news", "event"] as const;
export const CANDIDATE_STATUSES = ["pending", "in_review", "accepted", "rejected", "duplicate"] as const;
export type CandidateKind = typeof CANDIDATE_KINDS[number];
export type CandidateStatus = typeof CANDIDATE_STATUSES[number];

export const isCandidateKind = (value: unknown): value is CandidateKind => CANDIDATE_KINDS.some(kind => kind === value);
export const isCandidateStatus = (value: unknown): value is CandidateStatus => CANDIDATE_STATUSES.some(status => status === value);

export type DiscoverySource = EditorialSource & {
  feed_url: string | null;
  discovery_method: "manual" | "rss" | "api";
  last_scanned_at: string | null;
  updated_at: string;
};
export type Discovery = {
  external_id: string | null;
  source_url: string;
  canonical_url: string;
  original_title: string;
  original_excerpt: string | null;
  original_language: string | null;
  source_published_at: string | null;
};
export type Candidate = Discovery & {
  id: string;
  source_id: string;
  kind: CandidateKind;
  status: CandidateStatus;
  duplicate_of_id: string | null;
  editorial_note: string | null;
  draft_news_id?: string | null;
  draft_event_id?: string | null;
  created_at: string;
  updated_at: string;
};
export type Queue = { candidates: Candidate[]; page: number; total: number };
export type ScanResult = { added: number; duplicates: number; matches: number; truncated: boolean };

export const QUEUE_PAGE_SIZE = 20;
export const FEED_SCAN_LIMIT = 25;
export const DEFAULT_BAND_FILTER = "BABYMONSTER";

export function feedUrl(value: unknown) {
  const safe = publicUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  // Fetch only standard public HTTPS hostnames. Resolution is verified again
  // immediately before connecting and the request is pinned to that address.
  if (
    url.protocol !== "https:" || url.port ||
    !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z](?:[a-z0-9-]*[a-z0-9])?$/i.test(url.hostname)
  ) return null;
  url.hash = "";
  return url.href;
}

export function parseSource(value: unknown) {
  const data = readObject(value);
  if (!data || !isSourceKind(data.source_kind) || typeof data.is_active !== "boolean") return null;
  const name = textValue(data.name, 160, true);
  const homepage = canonicalSourceUrl(data.homepage_url);
  const feed = data.feed_url === "" ? null : feedUrl(data.feed_url);
  if (!name || !homepage || (data.feed_url !== "" && !feed)) return null;
  return {
    name, homepage_url: homepage, feed_url: feed, source_kind: data.source_kind,
    discovery_method: feed ? "rss" as const : "manual" as const, is_active: data.is_active,
  };
}

export function parseDiscovery(value: unknown): Discovery | null {
  const data = readObject(value);
  if (!data) return null;
  const link = publicUrl(data.source_url);
  const canonical = canonicalSourceUrl(data.source_url);
  const title = textValue(data.original_title, 250, true);
  const excerpt = textValue(data.original_excerpt, 500);
  const language = textValue(data.original_language, 35);
  const externalId = textValue(data.external_id, 512);
  if (!link || !canonical || !title || excerpt === null || language === null || externalId === null) return null;
  if (language && !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(language)) return null;
  const rawDate = data.source_published_at;
  if (typeof rawDate !== "string" || rawDate.length > 80) return null;
  const date = rawDate ? new Date(rawDate) : null;
  if (date && (!Number.isFinite(date.valueOf()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 9998)) return null;
  return {
    external_id: externalId || null, source_url: link, canonical_url: canonical, original_title: title,
    original_excerpt: excerpt || null, original_language: language || null, source_published_at: date?.toISOString() ?? null,
  };
}

function normalizedSearch(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export function matchesFeedTerm(discovery: Discovery, term: string) {
  const query = normalizedSearch(term);
  if (!query) return true;
  const text = normalizedSearch(discovery.original_title + " " + (discovery.original_excerpt ?? ""));
  const terms = query === "babymonster" ? [query, "베이비몬스터", "ベイビーモンスター"] : [query];
  return terms.some(term => text.includes(term));
}

export const NEWS_STATUSES = ["draft", "in_review", "approved", "rejected", "published", "archived"] as const;
export const NEWS_CATEGORIES = ["official_announcements", "music_releases", "tours_concerts", "interviews", "awards", "media_appearances", "achievements"] as const;
export const SOURCE_KINDS = ["official_group", "official_organizer", "official_broadcaster", "trusted_press", "manual"] as const;
export type NewsStatus = typeof NEWS_STATUSES[number];
export type NewsCategory = typeof NEWS_CATEGORIES[number];
export type SourceKind = typeof SOURCE_KINDS[number];

export type NewsFields = {
  slug: string; category: NewsCategory;
  title_pt: string; title_en: string; summary_pt: string; summary_en: string;
  body_pt: string; body_en: string; cover_image_url: string;
  cover_image_alt_pt: string; cover_image_alt_en: string; cover_image_credit: string;
  cover_image_source_url: string; era_id: string; is_featured: boolean;
};
export type NewsArticle = Omit<NewsFields, "era_id" | "title_pt" | "title_en" | "summary_pt" | "summary_en" | "body_pt" | "body_en" | "cover_image_url" | "cover_image_alt_pt" | "cover_image_alt_en" | "cover_image_credit" | "cover_image_source_url"> & {
  id: string; status: NewsStatus; era_id: string | null;
  title_pt: string | null; title_en: string | null;
  summary_pt: string | null; summary_en: string | null;
  body_pt: string | null; body_en: string | null;
  cover_image_url: string | null; cover_image_alt_pt: string | null; cover_image_alt_en: string | null;
  cover_image_credit: string | null; cover_image_source_url: string | null;
  approved_at: string | null; published_at: string | null; updated_at: string; created_at: string;
};
export type NewsListItem = Pick<NewsArticle, "id" | "slug" | "title_pt" | "title_en" | "category" | "status" | "is_featured" | "era_id" | "updated_at" | "published_at">;
export type EditorialSource = { id: string; name: string; homepage_url: string; source_kind: SourceKind; is_active: boolean };
export type NewsSourceLink = { id: string; source_id: string; source_name: string; source_url: string; canonical_url: string };
export type NewsEra = { id: string; name: string; is_active: boolean };
export type NewsMember = { id: string; name: string; is_active: boolean };
export type RelatedVideo = { id: string; title: string; status: string };
export type NewsDetail = { article: NewsArticle; sources: NewsSourceLink[]; memberIds: string[]; videos: RelatedVideo[] };
export type NewsCatalogs = { eras: NewsEra[]; members: NewsMember[]; sources: EditorialSource[] };
export type NewsList = { articles: NewsListItem[]; total: number; page: number };

export const PAGE_SIZE = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);
export const isNewsStatus = (value: unknown): value is NewsStatus => NEWS_STATUSES.some(v => v === value);
export const isNewsCategory = (value: unknown): value is NewsCategory => NEWS_CATEGORIES.some(v => v === value);
export const isSourceKind = (value: unknown): value is SourceKind => SOURCE_KINDS.some(v => v === value);
export const editableStatus = (status: NewsStatus) => ["draft", "in_review", "rejected"].includes(status);

const transitions: Record<NewsStatus, NewsStatus[]> = {
  draft: ["in_review"], in_review: ["approved", "rejected", "draft"],
  approved: ["published", "draft"], rejected: ["draft"],
  published: ["archived", "draft"], archived: ["draft"],
};
export function allowedTransitions(status: NewsStatus) { return transitions[status] ?? []; }
export function canTransition(from: unknown, to: unknown): boolean {
  return isNewsStatus(from) && isNewsStatus(to) && allowedTransitions(from).includes(to);
}
export function reviewReady(fields: NewsFields, sourceCount: number) {
  return Boolean(fields.title_pt.trim() && fields.title_en.trim() && fields.summary_pt.trim() && fields.summary_en.trim() && sourceCount > 0);
}
export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120).replace(/-$/g, "");
}
export function searchText(value: unknown) {
  return typeof value === "string" ? value.slice(0, 100).replace(/[^\p{L}\p{N} -]/gu, " ").replace(/\s+/g, " ").trim() : "";
}
export function publicUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || /\s/.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
export function canonicalSourceUrl(value: unknown): string | null {
  const valid = publicUrl(value);
  if (!valid) return null;
  const url = new URL(valid);
  url.hash = "";
  for (const key of Array.from(url.searchParams.keys())) {
    if (/^utm_/i.test(key) || /^(fbclid|gclid|dclid|msclkid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.href;
}
export function blankNews(): NewsFields {
  return {slug:"", category:"official_announcements", title_pt:"", title_en:"", summary_pt:"", summary_en:"",
    body_pt:"", body_en:"", cover_image_url:"", cover_image_alt_pt:"", cover_image_alt_en:"",
    cover_image_credit:"", cover_image_source_url:"", era_id:"", is_featured:false};
}
export function articleFields(article: NewsArticle): NewsFields {
  const result = blankNews();
  for (const key of Object.keys(result) as (keyof NewsFields)[]) {
    // All nullable DB content fields become strings in the form.
    if (key === "is_featured") result.is_featured = article.is_featured;
    else if (key === "category") result.category = article.category;
    else result[key] = article[key] ?? "";
  }
  return result;
}

export function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export function textValue(value: unknown, max: number, required = false): string | null {
  if (typeof value !== "string" || value.length > max) return null;
  const trimmed = value.trim();
  return required && !trimmed ? null : trimmed;
}
export function parseArticle(value: unknown): NewsFields | null {
  const item = readObject(value);
  if (!item || !isNewsCategory(item.category) || typeof item.is_featured !== "boolean") return null;
  const output = blankNews();
  output.category = item.category;
  output.is_featured = item.is_featured;
  for (const [key, max] of [
    ["slug",120], ["title_pt",200], ["title_en",200], ["summary_pt",1600], ["summary_en",1600],
    ["body_pt",20000], ["body_en",20000], ["cover_image_url",2048],
    ["cover_image_alt_pt",300], ["cover_image_alt_en",300], ["cover_image_credit",300],
    ["cover_image_source_url",2048], ["era_id",36],
  ] as const) {
    const v = textValue(item[key], max);
    if (v === null) return null;
    output[key] = v;
  }
  if (!output.title_pt && !output.title_en) return null;
  if (!output.slug) output.slug = slugify(output.title_en || output.title_pt);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(output.slug)) return null;
  if (output.era_id && !isUuid(output.era_id)) return null;
  for (const key of ["cover_image_url","cover_image_source_url"] as const) {
    if (output[key]) {
      const url = publicUrl(output[key]);
      if (!url) return null;
      output[key] = url;
    }
  }
  return output;
}
export function toDatabaseFields(input: NewsFields) {
  return Object.fromEntries(Object.entries(input).map(([key,value]) => [key, value === "" ? null : value]));
}

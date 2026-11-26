import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NewsArticle } from "../admin/news/model";
import type { EventRow } from "../admin/schedule/model";
import { monthBounds } from "../admin/schedule/model";
import { type Filters, PUBLIC_PAGE_SIZE, CALENDAR_LIMIT, hasFilters, eventTimeFilter, validSlug } from "./model";

export type News = Pick<NewsArticle,"id"|"slug"|"category"|"title_pt"|"title_en"|"summary_pt"|"summary_en"|"cover_image_url"|"cover_image_alt_pt"|"cover_image_alt_en"|"era_id"|"is_featured"|"published_at">;
export type Article = News & Pick<NewsArticle,"body_pt"|"body_en"|"cover_image_credit"|"cover_image_source_url">;
export type Event = Pick<EventRow,"id"|"slug"|"category"|"title_pt"|"title_en"|"summary_pt"|"summary_en"|"location"|"venue_name"|"official_event_url"|"starts_on"|"ends_on"|"starts_at"|"ends_at"|"time_kind"|"timezone"|"event_status"|"era_id"|"is_featured">;
export type Catalog = { id: string; name: string; slug: string };
export type Catalogs = { eras: { id: string; name: string }[]; members: Catalog[] };
export type Relations = { sources: { source_name: string; source_url: string }[]; members: Catalog[]; videos: { title: string; href: string }[] };

// Always use the public role, even when a signed-in administrator visits a public page.
// No cookies, user session, service-role credential, or private editorial table.
function publicDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Public editorial database unavailable");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) } });
}
function check(...results: { error: unknown }[]) {
  if (results.some(r => r.error)) throw new Error("Public editorial query failed");
}
const newsFields = "id,slug,category,title_pt,title_en,summary_pt,summary_en,cover_image_url,cover_image_alt_pt,cover_image_alt_en,era_id,is_featured,published_at";
const eventFields = "id,slug,category,title_pt,title_en,summary_pt,summary_en,location,venue_name,official_event_url,starts_on,ends_on,starts_at,ends_at,time_kind,timezone,event_status,era_id,is_featured";
const search = (q: string) => ["title_pt","title_en","summary_pt","summary_en"].map(c => `${c}.ilike.%${q}%`).join(",");
export async function catalogs(): Promise<Catalogs> {
  const db = publicDb();
  const [eras, members] = await Promise.all([
    db.from("watch_eras").select("id,name").order("display_order").order("name"),
    db.from("members").select("id,name,slug").eq("is_active", true).order("display_order"),
  ]);
  check(eras,members);
  return { eras: eras.data ?? [], members: members.data ?? [] };
}
export async function newsFeed(f: Filters, now: Date) {
  const db = publicDb(), time = now.toISOString();
  let featured: News | null = null;
  if (!hasFilters(f)) {
    const result = await db.from("news_articles").select(newsFields).eq("status","published").lte("published_at",time)
      .eq("is_featured",true).order("published_at",{ascending:false}).order("id").limit(1).maybeSingle();
    check(result); featured = result.data as News | null;
  }
  const fields = f.member ? newsFields + ",news_article_members!inner(member_id)" : newsFields;
  let query = db.from("news_articles").select(fields,{count:"exact"}).eq("status","published").lte("published_at",time);
  if (featured) query = query.neq("id",featured.id);
  if (f.q) query = query.or(search(f.q));
  if (f.category) query = query.eq("category",f.category);
  if (f.era) query = query.eq("era_id",f.era);
  if (f.member) query = query.eq("news_article_members.member_id",f.member);
  const result = await query.order("published_at",{ascending:false}).order("id").range((f.page-1)*PUBLIC_PAGE_SIZE,f.page*PUBLIC_PAGE_SIZE-1);
  check(result);
  return { articles: (result.data ?? []) as unknown as News[], featured, total: result.count ?? 0 };
}
export async function eventFeed(f: Filters, now: Date) {
  const db = publicDb();
  const fields = f.member ? eventFields + ",agenda_event_members!inner(member_id)" : eventFields;
  let query = db.from("agenda_events").select(fields,{count:"exact"}).eq("status","published").lte("published_at",now.toISOString());
  if (f.q) query = query.or(search(f.q));
  if (f.category) query = query.eq("category",f.category);
  if (f.era) query = query.eq("era_id",f.era);
  if (f.member) query = query.eq("agenda_event_members.member_id",f.member);
  if (f.status) query = query.eq("event_status",f.status);
  if (f.view === "calendar") {
    const bounds = monthBounds(f.month)!;
    query = query.lte("starts_on",bounds.end).or(`starts_on.gte.${bounds.start},ends_on.gte.${bounds.start}`);
  } else query = query.or(eventTimeFilter(f.view,now));
  const ascending = f.view !== "history";
  query = query.order("starts_on",{ascending}).order("starts_at",{ascending,nullsFirst:false}).order("id");
  const result = await (f.view === "calendar" ? query.limit(CALENDAR_LIMIT) : query.range((f.page-1)*PUBLIC_PAGE_SIZE,f.page*PUBLIC_PAGE_SIZE-1));
  check(result);
  return { events: (result.data ?? []) as unknown as Event[], total: result.count ?? 0 };
}
export async function articleBySlug(slug: string, now: Date): Promise<Article | null> {
  if (!validSlug(slug)) return null;
  const result = await publicDb().from("news_articles").select(newsFields + ",body_pt,body_en,cover_image_credit,cover_image_source_url").eq("slug",slug).eq("status","published").lte("published_at",now.toISOString()).maybeSingle();
  check(result); return result.data as unknown as Article | null;
}
export async function eventBySlug(slug: string, now: Date): Promise<Event | null> {
  if (!validSlug(slug)) return null;
  const result = await publicDb().from("agenda_events").select(eventFields).eq("slug",slug).eq("status","published").lte("published_at",now.toISOString()).maybeSingle();
  check(result); return result.data as Event | null;
}
export async function relations(section: "news" | "schedule", id: string): Promise<Relations> {
  const db = publicDb();
  const table = section === "news" ? "news_article" : "agenda_event", key = section === "news" ? "article_id" : "event_id";
  const [sources, memberLinks, videoLinks] = await Promise.all([
    db.from(table+"_sources").select("source_name,source_url").eq(key,id).order("created_at"),
    db.from(table+"_members").select("member_id").eq(key,id),
    db.from(table+"_videos").select("video_id").eq(key,id),
  ]);
  check(sources,memberLinks,videoLinks);
  const memberIds = (memberLinks.data ?? []).map(v=>v.member_id);
  const videoIds = (videoLinks.data ?? []).map(v=>v.video_id);
  const [members, videos, links] = await Promise.all([
    memberIds.length ? db.from("members").select("id,name,slug").eq("is_active",true).in("id",memberIds).order("display_order") : Promise.resolve({data:[],error:null}),
    videoIds.length ? db.from("watch_videos").select("id,slug,title").eq("status","published").in("id",videoIds).order("title") : Promise.resolve({data:[],error:null}),
    videoIds.length ? db.from("watch_video_collections").select("video_id,collection_id").in("video_id",videoIds) : Promise.resolve({data:[],error:null}),
  ]);
  check(members,videos,links);
  const collectionIds = [...new Set((links.data ?? []).map(v=>v.collection_id))];
  const collections = collectionIds.length ? await db.from("watch_collections").select("id,slug").eq("is_active",true).in("id",collectionIds).order("display_order").order("id") : {data:[],error:null};
  check(collections);
  return { sources: sources.data ?? [], members: members.data ?? [], videos: (videos.data ?? []).flatMap(video => {
    const collection = collections.data?.find(c => links.data?.some(l => l.video_id===video.id && l.collection_id===c.id));
    return collection ? [{title:video.title,href:`/watch/${encodeURIComponent(collection.slug)}/${encodeURIComponent(video.slug)}`}] : [];
  }) };
}

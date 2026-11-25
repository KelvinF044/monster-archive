import "server-only";
import type { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { PAGE_SIZE, isNewsCategory, isNewsStatus, searchText, type NewsArticle, type NewsCatalogs, type NewsDetail, type NewsList, type NewsListItem, type RelatedVideo } from "./model";

export type AdminDatabase = NonNullable<Awaited<ReturnType<typeof requireActiveAdmin>>>["supabase"];

export async function loadNewsList(db: AdminDatabase, params: {q?: string; status?: string; category?: string; page?: number}): Promise<NewsList> {
  const page = Math.max(1, Math.min(100000, Number.isFinite(params.page) ? Math.floor(params.page!) : 1));
  const q = searchText(params.q);
  let query = db.from("news_articles").select("id,slug,title_pt,title_en,category,status,is_featured,era_id,updated_at,published_at", {count:"exact"});
  if (isNewsStatus(params.status)) query = query.eq("status", params.status);
  if (isNewsCategory(params.category)) query = query.eq("category", params.category);
  if (q) query = query.or(`title_pt.ilike.%${q}%,title_en.ilike.%${q}%,slug.ilike.%${q}%`);
  const {data,error,count} = await query.order("updated_at",{ascending:false}).order("id",{ascending:false}).range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1);
  if (error) throw new Error("database_error");
  return {articles:(data??[]) as NewsListItem[],total:count??0,page};
}

export async function loadNewsCatalogs(db: AdminDatabase): Promise<NewsCatalogs> {
  const [eras,members,sources] = await Promise.all([
    db.from("watch_eras").select("id,name,is_active").order("display_order").order("name"),
    db.from("members").select("id,name,is_active").order("display_order").order("name"),
    db.from("editorial_sources").select("id,name,homepage_url,source_kind,is_active").order("name").order("id").limit(500),
  ]);
  if (eras.error||members.error||sources.error) throw new Error("database_error");
  return {eras:eras.data??[],members:members.data??[],sources:(sources.data??[]) as NewsCatalogs["sources"]};
}

export async function loadNewsDetail(db: AdminDatabase,id:string): Promise<NewsDetail|null> {
  const [article,sources,members,videos] = await Promise.all([
    db.from("news_articles").select("*").eq("id",id).maybeSingle(),
    db.from("news_article_sources").select("id,source_id,source_name,source_url,canonical_url").eq("article_id",id).order("created_at"),
    db.from("news_article_members").select("member_id").eq("article_id",id),
    db.from("news_article_videos").select("video_id").eq("article_id",id),
  ]);
  if (article.error||sources.error||members.error||videos.error) throw new Error("database_error");
  if (!article.data) return null;
  const ids=(videos.data??[]).map(v=>v.video_id as string);
  let linkedVideos:RelatedVideo[]=[];
  if(ids.length){
    const {data,error}=await db.from("watch_videos").select("id,title,status").in("id",ids).order("title");
    if(error) throw new Error("database_error");
    linkedVideos=data??[];
  }
  return {article:article.data as NewsArticle,sources:sources.data??[],memberIds:(members.data??[]).map(m=>m.member_id as string),videos:linkedVideos};
}

export async function searchNewsVideos(db:AdminDatabase,q:string):Promise<RelatedVideo[]>{
  const term=searchText(q);
  let query=db.from("watch_videos").select("id,title,status").order("created_at",{ascending:false}).limit(30);
  if(term) query=query.ilike("title",`%${term}%`);
  const {data,error}=await query;
  if(error) throw new Error("database_error");
  return data??[];
}

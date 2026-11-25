import { NextRequest, NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { canTransition, canonicalSourceUrl, editableStatus, isNewsStatus, isSourceKind, isUuid, parseArticle, publicUrl, readObject, textValue, toDatabaseFields, type NewsStatus } from "@/lib/admin/news/model";
import { loadNewsCatalogs, loadNewsDetail, loadNewsList, searchNewsVideos, type AdminDatabase } from "@/lib/admin/news/queries";

const response = (data:unknown,status=200) => NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
const fail = (error:string,status=400) => response({error},status);
function dbFailure(error:{code?:string},duplicate="duplicate_link"){
  if(error.code==="23505") return fail(duplicate,409);
  if(error.code==="23503") return fail("invalid_relation",400);
  if(error.code==="P0001"||error.code==="23514") return fail("review_failed",409);
  if(error.code==="42501") return fail("unauthorized",403);
  console.warn("News administration database failure",{code:error.code??"unknown"});
  return fail("database_error",500);
}

export async function GET(request:NextRequest){
  const admin=await requireActiveAdmin();
  if(!admin) return fail("unauthorized",401);
  try{
    const p=request.nextUrl.searchParams;
    if(p.get("view")==="catalogs") return response(await loadNewsCatalogs(admin.supabase));
    if(p.get("view")==="videos") return response({videos:await searchNewsVideos(admin.supabase,p.get("q")??"")});
    const id=p.get("id");
    if(id){
      if(!isUuid(id)) return fail("invalid_request");
      const detail=await loadNewsDetail(admin.supabase,id);
      return detail?response(detail):fail("not_found",404);
    }
    return response(await loadNewsList(admin.supabase,{q:p.get("q")??"",status:p.get("status")??"",category:p.get("category")??"",page:Number(p.get("page")??"1")}));
  }catch { return fail("database_error",500); }
}

async function checkEra(db:AdminDatabase,era:string,previous:string|null=null){
  if(!era||era===previous) return true;
  const {data,error}=await db.from("watch_eras").select("id").eq("id",era).eq("is_active",true).maybeSingle();
  if(error) throw new Error("database_error");
  return Boolean(data);
}

export async function POST(request:NextRequest){
  const admin=await requireActiveAdmin();
  if(!admin) return fail("unauthorized",401);
  if(request.headers.get("content-type")?.split(";")[0].trim()!=="application/json") return fail("invalid_request",415);
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin) return fail("invalid_request",403);
  try {
    const raw=await request.text();
    if(raw.length>110000) return fail("invalid_request",413);
    let body:Record<string,unknown>|null;
    try{body=readObject(JSON.parse(raw));}catch{return fail("invalid_request");}
    if(!body||typeof body.action!=="string") return fail("invalid_request");
    const db=admin.supabase;

    if(body.action==="register_source"){
      const name=textValue(body.name,160,true), homepage=canonicalSourceUrl(body.homepage_url);
      if(!name||!homepage||!isSourceKind(body.source_kind)) return fail("invalid_request");
      const {data,error}=await db.from("editorial_sources").insert({name,homepage_url:homepage,source_kind:body.source_kind,discovery_method:"manual"}).select("id,name,homepage_url,source_kind,is_active").single();
      if(error){
        if(error.code!=="23505") return dbFailure(error);
        const existing=await db.from("editorial_sources").select("id,name,homepage_url,source_kind,is_active").eq("name",name).eq("homepage_url",homepage).maybeSingle();
        if(existing.error) return dbFailure(existing.error);
        if(!existing.data?.is_active) return fail("invalid_relation",409);
        return response({source:existing.data});
      }
      return response({source:data},201);
    }

    if(body.action==="create"){
      const fields=parseArticle(body.fields);
      if(!fields) return fail("invalid_request");
      if(!(await checkEra(db,fields.era_id))) return fail("invalid_relation");
      const {data,error}=await db.from("news_articles").insert({...toDatabaseFields(fields),status:"draft"}).select("id").single();
      return error?dbFailure(error,"invalid_slug"):response({id:data.id},201);
    }

    if(!isUuid(body.id)) return fail("invalid_request");
    const id=body.id;
    const current=await db.from("news_articles").select("id,status,updated_at,era_id").eq("id",id).maybeSingle();
    if(current.error) return dbFailure(current.error);
    if(!current.data) return fail("not_found",404);
    const status=current.data.status as NewsStatus;
    if(typeof body.expectedUpdatedAt!=="string"||body.expectedUpdatedAt!==current.data.updated_at||body.expectedStatus!==status) return fail("stale",409);

    if(body.action==="transition"){
      if(!isNewsStatus(body.status)||!canTransition(status,body.status)) return fail("review_failed",409);
      // Transition changes status only. The database is the authority on evidence,
      // translations, approval timestamps and allowed publication.
      const {data,error}=await db.from("news_articles").update({status:body.status}).eq("id",id).eq("status",status).eq("updated_at",current.data.updated_at).select("id").maybeSingle();
      return error?dbFailure(error):data?response({id}):fail("stale",409);
    }
    if(!editableStatus(status)) return fail("locked_error",409);

    if(body.action==="save"){
      const fields=parseArticle(body.fields);
      if(!fields) return fail("invalid_request");
      if(!(await checkEra(db,fields.era_id,current.data.era_id))) return fail("invalid_relation");
      const {data,error}=await db.from("news_articles").update(toDatabaseFields(fields)).eq("id",id).eq("status",status).eq("updated_at",current.data.updated_at).select("id").maybeSingle();
      return error?dbFailure(error,"invalid_slug"):data?response({id}):fail("stale",409);
    }

    if(body.action==="add_source"){
      const url=publicUrl(body.source_url),canonical=canonicalSourceUrl(body.source_url);
      if(!isUuid(body.source_id)||!url||!canonical) return fail("invalid_request");
      const source=await db.from("editorial_sources").select("id,name,is_active").eq("id",body.source_id).maybeSingle();
      if(source.error) return dbFailure(source.error);
      if(!source.data?.is_active) return fail("invalid_relation");
      const existing=await db.from("news_article_sources").select("article_id").eq("canonical_url",canonical).limit(2);
      if(existing.error) return dbFailure(existing.error);
      if(existing.data?.some(s=>s.article_id===id)) return fail("duplicate_link",409);
      if(existing.data?.some(s=>s.article_id!==id)&&body.allowShared!==true) return fail("source_shared",409);
      const {error}=await db.from("news_article_sources").insert({article_id:id,source_id:source.data.id,source_name:source.data.name,source_url:url,canonical_url:canonical});
      return error?dbFailure(error):response({id});
    }

    if(body.action==="remove_source"){
      if(!isUuid(body.link_id)) return fail("invalid_request");
      const {data,error}=await db.from("news_article_sources").delete().eq("article_id",id).eq("id",body.link_id).select("id").maybeSingle();
      return error?dbFailure(error):data?response({id}):fail("not_found",404);
    }

    if(body.action==="relation"){
      if(!isUuid(body.target_id)||!["member","video"].includes(String(body.kind))||!["add","remove"].includes(String(body.operation))) return fail("invalid_request");
      const member=body.kind==="member";
      const table=member?"news_article_members":"news_article_videos";
      const key=member?"member_id":"video_id";
      if(body.operation==="add"){
        const check=member
          ? await db.from("members").select("id").eq("id",body.target_id).eq("is_active",true).maybeSingle()
          : await db.from("watch_videos").select("id").eq("id",body.target_id).maybeSingle();
        if(check.error) return dbFailure(check.error);
        if(!check.data) return fail("invalid_relation");
        const {error}=await db.from(table).insert({article_id:id,[key]:body.target_id});
        return error?dbFailure(error):response({id});
      }
      const {error}=await db.from(table).delete().eq("article_id",id).eq(key,body.target_id);
      return error?dbFailure(error):response({id});
    }
    return fail("invalid_request");
  }catch{
    return fail("database_error",500);
  }
}

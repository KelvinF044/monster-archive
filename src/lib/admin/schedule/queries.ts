import "server-only";
import type { AdminDatabase } from "@/lib/admin/news/queries";
import { PAGE_SIZE, isNewsStatus, searchText, type RelatedVideo } from "@/lib/admin/news/model";
import { isEventCategory, isEventStatus, monthBounds, type EventDetail, type EventList, type EventListItem, type EventRow } from "./model";

export async function loadEventList(db:AdminDatabase,params:{q?:string;status?:string;category?:string;eventStatus?:string;month?:string;page?:number}):Promise<EventList>{
  const page=Math.max(1,Math.min(100000,Number.isFinite(params.page)?Math.floor(params.page!):1));
  const q=searchText(params.q);
  let query=db.from("agenda_events").select("id,slug,title_pt,title_en,category,status,event_status,starts_on,starts_at,time_kind,timezone,is_featured,updated_at",{count:"exact"});
  if(isNewsStatus(params.status))query=query.eq("status",params.status);
  if(isEventCategory(params.category))query=query.eq("category",params.category);
  if(isEventStatus(params.eventStatus))query=query.eq("event_status",params.eventStatus);
  if(q)query=query.or(`title_pt.ilike.%${q}%,title_en.ilike.%${q}%,slug.ilike.%${q}%`);
  const period=params.month?monthBounds(params.month):null;
  if(period)query=query.lte("starts_on",period.end).or(`starts_on.gte.${period.start},ends_on.gte.${period.start}`);
  const {data,error,count}=await query.order("starts_on",{ascending:true,nullsFirst:false}).order("starts_at",{ascending:true,nullsFirst:false}).order("updated_at",{ascending:false}).order("id").range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1);
  if(error)throw new Error("database_error");
  return{events:(data??[]) as EventListItem[],total:count??0,page};
}
export async function loadEventDetail(db:AdminDatabase,id:string):Promise<EventDetail|null>{
  const [event,sources,members,videos,history]=await Promise.all([
    db.from("agenda_events").select("*").eq("id",id).maybeSingle(),
    db.from("agenda_event_sources").select("id,source_id,source_name,source_url,canonical_url,official_evidence").eq("event_id",id).order("created_at"),
    db.from("agenda_event_members").select("member_id").eq("event_id",id),
    db.from("agenda_event_videos").select("video_id").eq("event_id",id),
    db.from("editorial_audit_log").select("id,action,previous_status,new_status,previous_event_status,new_event_status,previous_event_starts_on,new_event_starts_on,previous_event_starts_at,new_event_starts_at,previous_event_timezone,new_event_timezone,created_at").eq("entity_type","event").eq("entity_id",id).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(10),
  ]);
  if(event.error||sources.error||members.error||videos.error||history.error)throw new Error("database_error");
  if(!event.data)return null;
  const ids=(videos.data??[]).map(v=>v.video_id as string);
  let linkedVideos:RelatedVideo[]=[];
  if(ids.length){
    const {data,error}=await db.from("watch_videos").select("id,title,status").in("id",ids).order("title");
    if(error)throw new Error("database_error");
    linkedVideos=data??[];
  }
  return{event:event.data as EventRow,sources:sources.data??[],memberIds:(members.data??[]).map(m=>m.member_id as string),videos:linkedVideos,history:(history.data??[]) as EventDetail["history"]};
}

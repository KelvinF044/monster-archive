import { isUuid, publicUrl, readObject, slugify, textValue, type NewsStatus, type RelatedVideo, type SourceKind } from "../news/model.ts";

export const EVENT_CATEGORIES = ["release","concert","festival","music_show","interview","broadcast","awards","promotion","other"] as const;
export const EVENT_STATUSES = ["confirmed","postponed","rescheduled","cancelled","completed"] as const;
export const TIME_KINDS = ["timed","all_day","time_tba"] as const;
export type EventCategory = typeof EVENT_CATEGORIES[number];
export type EventStatus = typeof EVENT_STATUSES[number];
export type TimeKind = typeof TIME_KINDS[number];
export type Occurrence = "" | "earlier" | "later";
export const isEventCategory = (v:unknown):v is EventCategory => EVENT_CATEGORIES.some(x=>x===v);
export const isEventStatus = (v:unknown):v is EventStatus => EVENT_STATUSES.some(x=>x===v);
export const isTimeKind = (v:unknown):v is TimeKind => TIME_KINDS.some(x=>x===v);
export const isOfficialSourceKind = (v:SourceKind|unknown) => ["official_group","official_organizer","official_broadcaster"].some(x=>x===v);

export type EventFields = {
  slug:string; category:EventCategory;
  title_pt:string; title_en:string; summary_pt:string; summary_en:string;
  location:string; venue_name:string; official_event_url:string;
  starts_on:string; ends_on:string; time_kind:TimeKind; timezone:string;
  start_time:string; end_time:string; start_occurrence:Occurrence; end_occurrence:Occurrence;
  event_status:EventStatus; era_id:string; is_featured:boolean;
};
export type EventRow = Omit<EventFields,"start_time"|"end_time"|"start_occurrence"|"end_occurrence"|"title_pt"|"title_en"|"summary_pt"|"summary_en"|"location"|"venue_name"|"official_event_url"|"starts_on"|"ends_on"|"timezone"|"era_id"> & {
  id:string;status:NewsStatus;
  title_pt:string|null;title_en:string|null;summary_pt:string|null;summary_en:string|null;
  location:string|null;venue_name:string|null;official_event_url:string|null;
  starts_on:string|null;ends_on:string|null;timezone:string|null;starts_at:string|null;ends_at:string|null;era_id:string|null;
  approved_at:string|null;published_at:string|null;created_at:string;updated_at:string;
};
export type EventListItem = Pick<EventRow,"id"|"slug"|"title_pt"|"title_en"|"category"|"status"|"event_status"|"starts_on"|"starts_at"|"time_kind"|"timezone"|"is_featured"|"updated_at">;
export type EventSourceLink={id:string;source_id:string;source_name:string;source_url:string;canonical_url:string;official_evidence:boolean};
export type EventAudit={id:string;action:string;previous_status:NewsStatus|null;new_status:NewsStatus|null;previous_event_status:EventStatus|null;new_event_status:EventStatus|null;previous_event_starts_on:string|null;new_event_starts_on:string|null;previous_event_starts_at:string|null;new_event_starts_at:string|null;previous_event_timezone:string|null;new_event_timezone:string|null;created_at:string};
export type EventDetail={event:EventRow;sources:EventSourceLink[];memberIds:string[];videos:RelatedVideo[];history:EventAudit[]};
export type EventList={events:EventListItem[];total:number;page:number};
export type EventDatabaseFields = Omit<EventFields,"start_time"|"end_time"|"start_occurrence"|"end_occurrence"|"title_pt"|"title_en"|"summary_pt"|"summary_en"|"location"|"venue_name"|"official_event_url"|"starts_on"|"ends_on"|"timezone"|"era_id"> & {
  title_pt:string|null;title_en:string|null;summary_pt:string|null;summary_en:string|null;
  location:string|null;venue_name:string|null;official_event_url:string|null;
  starts_on:string|null;ends_on:string|null;timezone:string|null;era_id:string|null;starts_at:string|null;ends_at:string|null;
};
type ParseError="invalid_request"|"invalid_date"|"invalid_timezone"|"invalid_time"|"nonexistent_time"|"ambiguous_time"|"invalid_end";
export type EventParseResult={ok:true;fields:EventDatabaseFields}|{ok:false;error:ParseError};

export function blankEvent():EventFields {
  return {slug:"",category:"promotion",title_pt:"",title_en:"",summary_pt:"",summary_en:"",
    location:"",venue_name:"",official_event_url:"",starts_on:"",ends_on:"",time_kind:"time_tba",timezone:"",start_time:"",end_time:"",
    start_occurrence:"",end_occurrence:"",event_status:"confirmed",era_id:"",is_featured:false};
}

export function validDate(value:string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const d=new Date(value+"T00:00:00Z");
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function validTime(value:string){
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}
export function validTimezone(value:string) {
  if(value!=="UTC"&&!/^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)+$/.test(value))return false;
  try{new Intl.DateTimeFormat("en-US",{timeZone:value});return true;}catch{return false;}
}
function clockFormat(zone:string) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
}
function localParts(format:Intl.DateTimeFormat,date:Date){
  const p=Object.fromEntries(format.formatToParts(date).map(x=>[x.type,x.value]));
  return {day:`${p.year.padStart(4,"0")}-${p.month}-${p.day}`,clock:`${p.hour}:${p.minute}:${p.second}`};
}
const fullTime=(v:string)=>v.length===5?v+":00":v;

// Derive candidate offsets around the requested wall-clock time and verify
// each against the actual zone rules. DST gaps yield no instant; folds yield
// two distinct choices. Never silently guess which repeated hour was intended.
export function localTimeCandidates(day:string,time:string,zone:string):string[]{
  if(!validDate(day)||!validTime(time)||!validTimezone(zone))return [];
  const clock=fullTime(time);
  const target=Date.parse(day+"T"+clock+"Z");
  const format=clockFormat(zone);
  const offsets=new Set<number>();
  for(let h=-48;h<=48;h+=6){
    const sample=target+h*3600000;
    const local=localParts(format,new Date(sample));
    offsets.add(Date.parse(local.day+"T"+local.clock+"Z")-sample);
  }
  const candidates=new Set<string>();
  for(const offset of offsets){
    const instant=new Date(target-offset);
    const local=localParts(format,instant);
    if(local.day===day&&local.clock===clock)candidates.add(instant.toISOString());
  }
  return [...candidates].sort();
}

function occurrence(v:string):v is Occurrence{return v===""||v==="earlier"||v==="later";}
function resolveClock(day:string,time:string,zone:string,choice:Occurrence):{value:string}|{error:ParseError}{
  if(!validTime(time))return{error:"invalid_time"};
  const candidates=localTimeCandidates(day,time,zone);
  if(candidates.length===0)return{error:"nonexistent_time"};
  if(candidates.length>1&&!choice)return{error:"ambiguous_time"};
  return {value:choice==="later"?candidates[candidates.length-1]:candidates[0]};
}

export function parseEvent(input:unknown):EventParseResult {
  const x=readObject(input);
  const fail=(error:ParseError):EventParseResult=>({ok:false,error});
  if(!x||!isEventCategory(x.category)||!isEventStatus(x.event_status)||!isTimeKind(x.time_kind)||typeof x.is_featured!=="boolean")return fail("invalid_request");
  const field=blankEvent();
  field.category=x.category;field.event_status=x.event_status;field.time_kind=x.time_kind;field.is_featured=x.is_featured;
  for(const [key,max] of [["slug",120],["title_pt",200],["title_en",200],["summary_pt",1600],["summary_en",1600],
    ["location",300],["venue_name",300],["official_event_url",2048],["starts_on",10],["ends_on",10],["timezone",100],["start_time",8],["end_time",8],["era_id",36]] as const){
    const v=textValue(x[key],max);if(v===null)return fail("invalid_request");field[key]=v;
  }
  if(!field.title_pt&&!field.title_en)return fail("invalid_request");
  field.slug=field.slug||slugify(field.title_en||field.title_pt);
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(field.slug)||field.era_id&&!isUuid(field.era_id))return fail("invalid_request");
  if(field.official_event_url){const url=publicUrl(field.official_event_url);if(!url)return fail("invalid_request");field.official_event_url=url;}
  if((field.starts_on&&!validDate(field.starts_on))||(field.ends_on&&!validDate(field.ends_on)))return fail("invalid_date");
  if(field.ends_on&&(!field.starts_on||field.ends_on<field.starts_on))return fail("invalid_end");
  if(field.timezone&&!validTimezone(field.timezone))return fail("invalid_timezone");
  const startChoice=textValue(x.start_occurrence,7),endChoice=textValue(x.end_occurrence,7);
  if(startChoice===null||endChoice===null||!occurrence(startChoice)||!occurrence(endChoice))return fail("invalid_request");
  let startsAt:string|null=null,endsAt:string|null=null;
  if(field.time_kind==="timed"){
    if(!field.starts_on)return fail("invalid_date");
    if(!field.timezone)return fail("invalid_timezone");
    const start=resolveClock(field.starts_on,field.start_time,field.timezone,startChoice);
    if("error" in start)return fail(start.error);
    startsAt=start.value;
    if(field.end_time){
      if(!field.ends_on)return fail("invalid_end");
      const end=resolveClock(field.ends_on,field.end_time,field.timezone,endChoice);
      if("error" in end)return fail(end.error);
      endsAt=end.value;
      if(endsAt<startsAt)return fail("invalid_end");
    }
  }else if(field.start_time||field.end_time){
    // Unknown or all-day dates must never carry invented timestamps.
    return fail("invalid_time");
  }
  const n=(s:string)=>s||null;
  return{ok:true,fields:{
    slug:field.slug,category:field.category,title_pt:n(field.title_pt),title_en:n(field.title_en),summary_pt:n(field.summary_pt),summary_en:n(field.summary_en),
    location:n(field.location),venue_name:n(field.venue_name),official_event_url:n(field.official_event_url),
    starts_on:n(field.starts_on),ends_on:n(field.ends_on),time_kind:field.time_kind,timezone:n(field.timezone),starts_at:startsAt,ends_at:endsAt,
    event_status:field.event_status,era_id:n(field.era_id),is_featured:field.is_featured,
  }};
}

function storedClock(value:string|null,zone:string,day:string):{time:string;choice:Occurrence}{
  if(!value||!validTimezone(zone))return{time:"",choice:""};
  const instant=new Date(value);if(!Number.isFinite(instant.getTime()))return{time:"",choice:""};
  const local=localParts(clockFormat(zone),instant);
  const time=local.clock.endsWith(":00")?local.clock.slice(0,5):local.clock;
  const candidates=localTimeCandidates(day,time,zone);
  const choice=candidates.length>1?(candidates[candidates.length-1]===instant.toISOString()?"later":"earlier"):"";
  return{time,choice};
}
export function eventFields(event:EventRow):EventFields{
  const result=blankEvent();
  for(const key of ["slug","title_pt","title_en","summary_pt","summary_en","location","venue_name","official_event_url","starts_on","ends_on","timezone","era_id"] as const)result[key]=event[key]??"";
  result.category=event.category;result.event_status=event.event_status;result.time_kind=event.time_kind;result.is_featured=event.is_featured;
  if(event.time_kind==="timed"){
    const start=storedClock(event.starts_at,result.timezone,result.starts_on),end=storedClock(event.ends_at,result.timezone,result.ends_on);
    result.start_time=start.time;result.start_occurrence=start.choice;result.end_time=end.time;result.end_occurrence=end.choice;
  }
  return result;
}
export function eventReviewReady(fields:EventFields,officialEvidenceCount:number){
  return Boolean(fields.title_pt.trim()&&fields.title_en.trim()&&fields.summary_pt.trim()&&fields.summary_en.trim()&&validDate(fields.starts_on)&&officialEvidenceCount>0&&parseEvent(fields).ok);
}
export function validMonth(month:string){return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&validDate(month+"-01");}
export function monthBounds(month:string):{start:string;end:string}|null{
  if(!validMonth(month))return null;
  const last=new Date(month+"-01T00:00:00Z");
  last.setUTCMonth(last.getUTCMonth()+1,0);
  // A normal calendar month intersects any event with a date range.
  const end=last.toISOString().slice(0,10);
  return{start:month+"-01",end};
}
export function localEventClock(value:string|null,zone:string|null){
  if(!value||!zone||!validTimezone(zone))return "";
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return "";
  return localParts(clockFormat(zone),date).clock.slice(0,5);
}

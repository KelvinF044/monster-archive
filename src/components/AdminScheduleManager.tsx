"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { AdminConfirmationDialog, useAdminConfirmation, type ConfirmAction } from "@/components/AdminConfirmation";
import { allowedTransitions, canonicalSourceUrl, editableStatus, NEWS_STATUSES, PAGE_SIZE, SOURCE_KINDS, type EditorialSource, type NewsCatalogs, type NewsStatus, type RelatedVideo, type SourceKind } from "@/lib/admin/news/model";
import { blankEvent, eventFields, eventReviewReady, EVENT_CATEGORIES, EVENT_STATUSES, TIME_KINDS, isOfficialSourceKind, localTimeCandidates, localEventClock, type EventCategory, type EventStatus, type EventDetail, type EventFields, type EventList, type EventAudit, type Occurrence, type TimeKind } from "@/lib/admin/schedule/model";
import { scheduleCopy, scheduleError, type ScheduleCopy } from "@/lib/admin/schedule/messages";
import { EVENT_PROVIDERS, type EventProvider, type EventSuggestion } from "@/lib/admin/schedule/discovery";

const fieldClass="w-full rounded-lg border border-white/10 bg-[#101116] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-purple-400/70 focus:outline-none disabled:opacity-60";
const buttonClass="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const primaryClass="rounded-lg bg-purple-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40";
const panelClass="rounded-xl border border-white/10 bg-white/[0.025] p-5";
const statusTone:Record<NewsStatus,string>={draft:"bg-yellow-500/10 text-yellow-300",in_review:"bg-sky-500/10 text-sky-300",approved:"bg-violet-500/15 text-violet-300",rejected:"bg-red-500/10 text-red-300",published:"bg-green-500/10 text-green-300",archived:"bg-zinc-500/15 text-zinc-400"};

class ScheduleApiError extends Error { constructor(public code:string){super(code);} }
async function api<T>(params?:Record<string,string>,body?:Record<string,unknown>):Promise<T>{
  const query=params?"?"+new URLSearchParams(params).toString():"";
  const result=await fetch("/api/admin/schedule"+query,body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{cache:"no-store"});
  const data=await result.json().catch(()=>null);
  if(!result.ok||!data) throw new ScheduleApiError(typeof data?.error==="string"?data.error:"database_error");
  return data as T;
}
function errorCode(e:unknown){return e instanceof ScheduleApiError?e.code:"generalError";}
function StatusBadge({status,copy}:{status:NewsStatus;copy:ScheduleCopy}){
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap ${statusTone[status]}`}>{copy.statuses[status]}</span>;
}
function ActivityBadge({status,copy}:{status:EventStatus;copy:ScheduleCopy}){
  const tone:Record<EventStatus,string>={confirmed:"bg-green-500/10 text-green-300",postponed:"bg-amber-500/10 text-amber-300",rescheduled:"bg-purple-500/15 text-purple-300",cancelled:"bg-red-500/10 text-red-300",completed:"bg-zinc-500/15 text-zinc-300"};
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap ${tone[status]}`}>{copy.eventStatuses[status]}</span>;
}
function Field({label,children}:{label:string;children:ReactNode}){
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-zinc-400">{label}</span>{children}</label>;
}
function dateLabel(value:string|null,locale:string){
  return value?new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(value)):"—";
}

type Filters={q:string;status:string;category:string;eventStatus:string;month:string};
type Props={initialList:EventList;catalogs:NewsCatalogs;initialDetail?:EventDetail};

export default function AdminScheduleManager({initialList,catalogs:initialCatalogs,initialDetail}:Props){
  const {locale,t}=useAdminLocale();
  const copy=scheduleCopy(locale), c=copy.text;
  const [catalogs,setCatalogs]=useState(initialCatalogs);
  const [list,setList]=useState(initialList);
  const [filters,setFilters]=useState<Filters>({q:"",status:"",category:"",eventStatus:"",month:""});
  const [applied,setApplied]=useState<Filters>(filters);
  const [editor,setEditor]=useState<EventDetail|null|undefined>(initialDetail);
  const [discoveredFields,setDiscoveredFields]=useState<EventFields>();
  const [savedDiscoveries,setSavedDiscoveries]=useState<Record<string,string>>({});
  const [dirty,setDirty]=useState(false);
  const [listBusy,setListBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [editorBusy,setEditorBusy]=useState(false);
  const confirmation=useAdminConfirmation();
  const editorTop=useRef<HTMLDivElement>(null);
  const editorIdentity=editor===undefined?null:editor?.event.id??discoveredFields?.slug??"new";
  useEffect(()=>{
    if(editorIdentity) editorTop.current?.scrollIntoView({behavior:"smooth",block:"start"});
  },[editorIdentity]);
  const totalPages=Math.max(1,Math.ceil(list.total/PAGE_SIZE));
  const allowSwitch=async()=>!editorBusy&&!listBusy&&(!dirty||await confirmation.confirm(c.discardConfirm,c.discard));

  async function getList(next:Filters,page:number){
    setListBusy(true);setError("");
    try{
      const result=await api<EventList>({...next,page:String(page)});
      setList(result);setApplied(next);
    }catch(e){setError(errorCode(e));}finally{setListBusy(false);}
  }
  async function openEvent(id:string){
    if(!(await allowSwitch()))return;
    setListBusy(true);setError("");
    try{setEditor(await api<EventDetail>({id}));setDiscoveredFields(undefined);setDirty(false);setNotice("");}
    catch(e){setError(errorCode(e));}finally{setListBusy(false);}
  }
  async function newEvent(fields?:EventFields){
    if(!(await allowSwitch()))return;
    setDiscoveredFields(fields);
    setEditor(null);
    setDirty(false);
    setError("");
    setNotice("");
  }
  async function closeEditor(){if(await allowSwitch()){setEditor(undefined);setDiscoveredFields(undefined);setDirty(false);setNotice("");}}
  async function refreshAfterMutation(id:string,message:string){
    const result=await api<EventDetail>({id});
    setEditor(result);
    if(discoveredFields) {
      setSavedDiscoveries(previous=>({...previous,[discoveredFields.slug]:id}));
    }
    setNotice(message);
    await getList(applied,Math.min(list.page,totalPages));
  }
  const editorKey=editor?editor.event.id+":"+editor.event.updated_at:editorIdentity;

  return <main className="min-h-screen bg-[#08090d] px-5 py-10 text-white md:px-6 md:py-12">
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-white/10 pb-7">
        <Link href="/admin" className="text-xs font-bold text-zinc-500 hover:text-white">{t("← BACK TO DASHBOARD")}</Link>
        <p className="mt-6 text-xs font-bold tracking-[0.25em] text-purple-400">MONSTER ARCHIVE / {t("Phase 2.3 — Preview")}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-4xl font-black">{c.heading}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{c.intro}</p></div>
          <button type="button" onClick={()=>void newEvent()} disabled={editorBusy||listBusy} className={primaryClass}>+ {c.create}</button>
        </div>
      </header>

      <EventDiscovery copy={copy} locale={locale} disabled={listBusy||editorBusy} savedDiscoveries={savedDiscoveries}
        onChoose={suggestion=>suggestion.existingId ? openEvent(suggestion.existingId) : newEvent(suggestion.fields)} />

      <section className="mt-7">
        <form onSubmit={(e)=>{e.preventDefault();void getList(filters,1);}} className={`${panelClass} grid grid-cols-1 items-end gap-3 md:grid-cols-3`}>
          <Field label={c.search}><input value={filters.q} maxLength={100} onChange={e=>setFilters({...filters,q:e.target.value})} className={fieldClass} placeholder={c.search}/></Field>
          <Field label={c.status}><select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className={fieldClass}><option value="">{c.all}</option>{NEWS_STATUSES.map(s=><option key={s} value={s}>{copy.statuses[s]}</option>)}</select></Field>
          <Field label={c.category}><select value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})} className={fieldClass}><option value="">{c.all}</option>{EVENT_CATEGORIES.map(v=><option key={v} value={v}>{copy.categories[v]}</option>)}</select></Field>
          <Field label={c.activityStatus}><select value={filters.eventStatus} onChange={e=>setFilters({...filters,eventStatus:e.target.value})} className={fieldClass}><option value="">{c.all}</option>{EVENT_STATUSES.map(v=><option key={v} value={v}>{copy.eventStatuses[v]}</option>)}</select></Field>
          <Field label={c.month}><input type="month" value={filters.month} onChange={e=>setFilters({...filters,month:e.target.value})} className={fieldClass}/></Field>
          <button type="submit" disabled={listBusy||editorBusy} className={primaryClass}>{listBusy?c.loading:c.searchAction}</button>
        </form>
        {error&&<p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{scheduleError(copy,error)}</p>}
        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wider text-zinc-400">{c.total}: <strong className="text-white">{list.total}</strong></span>
          <button type="button" onClick={()=>void getList(applied,list.page)} disabled={listBusy||editorBusy} className={buttonClass}>{c.refresh}</button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025]">
          {list.events.length===0?<p className="px-5 py-10 text-center text-sm text-zinc-400">{c.empty}</p>:
          <table className="w-full min-w-[810px] text-left text-xs">
            <thead className="border-b border-white/10 text-zinc-500"><tr><th className="p-3">{c.details}</th><th className="p-3">{c.category}</th><th className="p-3">{c.status}</th><th className="p-3">{c.date}</th><th className="p-3">{c.activityStatus}</th><th className="p-3"><span className="sr-only">{c.edit}</span></th></tr></thead>
            <tbody>{list.events.map(event=><tr key={event.id} className={`border-b border-white/5 last:border-0 ${editor?.event.id===event.id?"bg-purple-500/10":""}`}>
              <td className="p-3"><p className="font-bold text-zinc-100">{(locale==="pt-BR"?event.title_pt||event.title_en:event.title_en||event.title_pt)||c.untitled}</p><p className="mt-1 text-[10px] text-zinc-500">/{event.slug}{event.is_featured?" · ★":""}</p></td>
              <td className="p-3 text-zinc-400">{copy.categories[event.category]}</td><td className="p-3"><StatusBadge status={event.status} copy={copy}/></td>
              <td className="p-3 text-zinc-400 whitespace-nowrap">{event.starts_on?dateLabel(event.starts_on,locale):c.noDateConfirmed}<p className="mt-1 text-[10px] text-zinc-500">{event.time_kind==="timed"?[localEventClock(event.starts_at,event.timezone),event.timezone].filter(Boolean).join(" · "):copy.timeKinds[event.time_kind]}</p></td>
              <td className="p-3"><ActivityBadge status={event.event_status} copy={copy}/></td>
              <td className="p-3 text-right"><button disabled={listBusy||editorBusy} type="button" onClick={()=>void openEvent(event.id)} className={buttonClass}>{c.edit} →</button></td>
            </tr>)}</tbody>
          </table>}
        </div>
        <div className="mt-3 flex items-center justify-end gap-3 text-xs text-zinc-500">
          <button type="button" disabled={listBusy||editorBusy||list.page<=1} onClick={()=>void getList(applied,list.page-1)} className={buttonClass}>{c.previous}</button>
          <span>{list.page} / {totalPages}</span>
          <button type="button" disabled={listBusy||editorBusy||list.page>=totalPages} onClick={()=>void getList(applied,list.page+1)} className={buttonClass}>{c.next}</button>
        </div>
      </section>

      {editor!==undefined&&<div ref={editorTop} className="mt-8 scroll-mt-24">
        {notice&&<p role="status" className="mb-3 rounded-lg border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-300">{notice}</p>}
        <EventEditor key={editorKey} detail={editor} discoveredFields={discoveredFields} catalogs={catalogs} copy={copy} locale={locale}
          onDirty={setDirty} onBusy={setEditorBusy} close={()=>void closeEditor()} onChanged={refreshAfterMutation} confirmAction={confirmation.confirm}
          onSourceRegistered={source=>setCatalogs(previous=>({...previous,sources:[...previous.sources.filter(v=>v.id!==source.id),source].sort((a,b)=>a.name.localeCompare(b.name))}))}/>
      </div>}
    </div>
    <AdminConfirmationDialog pending={confirmation.pending} title={c.confirmAction} cancelLabel={c.cancel} onResolve={confirmation.resolve}/>
  </main>;
}

function EventDiscovery({copy,locale,disabled,savedDiscoveries,onChoose}:{
  copy:ScheduleCopy;
  locale:string;
  disabled:boolean;
  savedDiscoveries:Record<string,string>;
  onChoose:(suggestion:EventSuggestion)=>Promise<void>;
}){
  const c=copy.text;
  const [provider,setProvider]=useState<EventProvider>("choom");
  const [items,setItems]=useState<EventSuggestion[]|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function search(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setError("");
    setItems(null);
    try {
      const result=await api<{suggestions:EventSuggestion[]}>({view:"discover",provider});
      setItems(result.suggestions);
    } catch (error) {
      setError(errorCode(error));
    } finally {
      setBusy(false);
    }
  }

  return <details className={panelClass+" mt-7"}>
    <summary className="cursor-pointer text-sm font-bold text-purple-200">{c.findEvents}</summary>
    <form onSubmit={search} className="mt-4">
      <fieldset disabled={disabled||busy} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label={c.eventDiscoverySource}>
            <select className={fieldClass} value={provider} onChange={event=>{
              setProvider(event.target.value as EventProvider);
              setItems(null);
              setError("");
            }}>
              {EVENT_PROVIDERS.map(value=><option key={value} value={value}>{value==="choom"?"BABYMONSTER WORLD TOUR [CHOOM]":"Coachella 2027 · YG Entertainment"}</option>)}
            </select>
          </Field>
        </div>
        <button type="submit" className={primaryClass}>{busy?c.loading:c.findEvents}</button>
      </fieldset>
    </form>
    {error&&<p role="alert" className="mt-3 text-sm text-red-300">{scheduleError(copy,error)}</p>}
    {items?.length===0&&<p role="status" className="mt-3 text-sm text-zinc-400">{c.noUpcomingDiscoveries}</p>}
    {Boolean(items?.length)&&<ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
      {items?.map(suggestion=>{
        const {fields}=suggestion;
        const existingId=suggestion.existingId??savedDiscoveries[fields.slug]??null;
        return <li key={fields.slug} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold">{locale==="pt-BR"?fields.title_pt:fields.title_en}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {[dateLabel(fields.starts_on,locale), fields.start_time||copy.timeKinds.time_tba, fields.timezone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={fields.official_event_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-purple-300 hover:underline">{c.openEventSource}</a>
            <button type="button" className={buttonClass} disabled={busy||disabled}
              onClick={()=>void onChoose({...suggestion,existingId})}>{existingId?c.openSavedEvent:c.reviewFoundEvent}</button>
          </div>
        </li>;
      })}
    </ul>}
  </details>;
}

type EditorProps={detail:EventDetail|null;discoveredFields?:EventFields;catalogs:NewsCatalogs;copy:ScheduleCopy;locale:string;onDirty:(value:boolean)=>void;onBusy:(value:boolean)=>void;close:()=>void;onChanged:(id:string,message:string)=>Promise<void>;onSourceRegistered:(source:EditorialSource)=>void;confirmAction:ConfirmAction};
function EventEditor({detail,discoveredFields,catalogs,copy,locale,onDirty,onBusy,close,onChanged,onSourceRegistered,confirmAction}:EditorProps){
  const c=copy.text;
  const event=detail?.event;
  const baseline=useMemo(()=>event?eventFields(event):discoveredFields??blankEvent(),[event,discoveredFields]);
  const suggestedSourceUrl=discoveredFields?.official_event_url??"";
  const needsDiscoveredSource=Boolean(suggestedSourceUrl&&!detail?.sources.some(link=>link.official_evidence||link.source_url===suggestedSourceUrl));
  const ygSource=needsDiscoveredSource?catalogs.sources.find(source=>
    source.is_active&&source.source_kind==="official_group"&&canonicalSourceUrl(source.homepage_url)==="https://ygfamily.com/"
  ):undefined;
  const [form,setForm]=useState<EventFields>(baseline);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [sourceId,setSourceId]=useState(ygSource?.id??"");
  const [sourceUrl,setSourceUrl]=useState(needsDiscoveredSource?suggestedSourceUrl:"");
  const [officialEvidence,setOfficialEvidence]=useState(false);
  const [sourceName,setSourceName]=useState(needsDiscoveredSource&&!ygSource?"YG Entertainment":"");
  const [homepage,setHomepage]=useState(needsDiscoveredSource&&!ygSource?"https://ygfamily.com/":"");
  const [kind,setKind]=useState<SourceKind>(needsDiscoveredSource?"official_group":"manual");
  const [videoSearch,setVideoSearch]=useState("");
  const [videoResults,setVideoResults]=useState<RelatedVideo[]>([]);
  const [searched,setSearched]=useState(false);
  const locked=Boolean(event&&!editableStatus(event.status));
  const dirty=JSON.stringify(form)!==JSON.stringify(baseline);
  const disabled=busy||locked;
  function change<K extends keyof EventFields>(key:K,value:EventFields[K]){
    const next={...form,[key]:value};
    if(key==="starts_on"||key==="start_time"||key==="timezone")next.start_occurrence="";
    if(key==="ends_on"||key==="end_time"||key==="timezone")next.end_occurrence="";
    if(key==="time_kind"&&value!=="timed"){
      next.start_time="";next.end_time="";next.start_occurrence="";next.end_occurrence="";
    }
    setForm(next);onDirty(JSON.stringify(next)!==JSON.stringify(baseline));
  }
  function discard(){setForm(baseline);onDirty(false);}
  function setPending(next:boolean){setBusy(next);onBusy(next);}
  function common(){return {id:event?.id,expectedStatus:event?.status,expectedUpdatedAt:event?.updated_at};}

  async function run(body:Record<string,unknown>,notice:string){
    setPending(true);setMessage("");setError("");
    try{
      const result=await api<{id:string}>(undefined,body);
      if(body.action==="save"||body.action==="create")onDirty(false);
      await onChanged(result.id,notice);
      return true;
    }catch(e){setError(errorCode(e));return false;}finally{setPending(false);}
  }
  async function save(formEvent:FormEvent){
    formEvent.preventDefault();if(disabled)return;
    await run(event?{...common(),action:"save",fields:form}:{action:"create",fields:form},c.articleSaved);
  }
  async function transition(target:NewsStatus){
    if(!event||busy||dirty)return;
    const confirmation=target==="published"?c.publishConfirm:target==="approved"?c.approveConfirm:target==="archived"?c.archiveConfirm:target==="draft"?c.returnConfirm:target==="rejected"?c.rejectConfirm:"";
    if(confirmation&&!(await confirmAction(confirmation,transitionLabels[target])))return;
    await run({...common(),action:"transition",status:target},c.workflowSaved);
  }
  async function registerSource(){
    if(disabled||!event)return;
    setPending(true);setError("");setMessage("");
    try{
      const result=await api<{source:EditorialSource}>(undefined,{action:"register_source",name:sourceName,homepage_url:homepage,source_kind:kind});
      onSourceRegistered(result.source);setSourceId(result.source.id);setOfficialEvidence(false);setSourceName("");setHomepage("");setMessage(c.sourceRegistered);
    }catch(e){setError(errorCode(e));}finally{setPending(false);}
  }
  async function attachSource(){
    if(!event||disabled)return;
    setPending(true);setError("");setMessage("");
    const payload={...common(),action:"add_source",source_id:sourceId,source_url:sourceUrl,official_evidence:officialEvidence};
    try{
      const result=await api<{id:string}>(undefined,payload);
      await onChanged(result.id,c.sourceAttached);setSourceUrl("");setOfficialEvidence(false);
    }catch(e){setError(errorCode(e));}finally{setPending(false);}
  }
  async function lookupVideos(){
    setPending(true);setError("");
    try{const result=await api<{videos:RelatedVideo[]}>({view:"videos",q:videoSearch});setVideoResults(result.videos);setSearched(true);}
    catch(e){setError(errorCode(e));}finally{setPending(false);}
  }
  async function relation(kind:"member"|"video",id:string,operation:"add"|"remove"){
    await run({...common(),action:"relation",kind,target_id:id,operation},c.relationSaved);
  }
  function input(key:Exclude<keyof EventFields,"category"|"is_featured"|"event_status"|"time_kind"|"start_occurrence"|"end_occurrence">,label:string,maxLength:number,multi=false){
    const type=key==="starts_on"||key==="ends_on"?"date":key==="start_time"||key==="end_time"?"time":"text";
    return <Field key={key} label={label}>{multi?<textarea className={fieldClass+" resize-y"} rows={4} maxLength={maxLength} disabled={disabled} value={form[key]} onChange={e=>change(key,e.target.value)}/>:<input className={fieldClass} type={type} step={type==="time"?1:undefined} maxLength={maxLength} disabled={disabled} value={form[key]} onChange={e=>change(key,e.target.value)}/>}</Field>;
  }
  const startCandidates=useMemo(()=>form.time_kind==="timed"?localTimeCandidates(form.starts_on,form.start_time,form.timezone):[],[form.time_kind,form.starts_on,form.start_time,form.timezone]);
  const endCandidates=useMemo(()=>form.time_kind==="timed"&&form.end_time?localTimeCandidates(form.ends_on,form.end_time,form.timezone):[],[form.time_kind,form.ends_on,form.end_time,form.timezone]);
  function clockChoice(key:"start_occurrence"|"end_occurrence",candidates:string[]){
    if(candidates.length>1)return <Field label={c.occurrence}><select className={fieldClass} disabled={disabled} value={form[key]} onChange={e=>change(key,e.target.value as Occurrence)}><option value="">{c.chooseOccurrence}</option><option value="earlier">{c.earlier} · {candidates[0].slice(11,19)} UTC</option><option value="later">{c.later} · {candidates[candidates.length-1].slice(11,19)} UTC</option></select></Field>;
    return null;
  }
  function utcText(key:"start_occurrence"|"end_occurrence",candidates:string[]){
    const instant=candidates.length===1?candidates[0]:form[key]?candidates[form[key]==="later"?candidates.length-1:0]:undefined;
    return instant?<p className="text-[11px] text-purple-300">{c.utc}: {instant.replace("T"," ").replace(".000Z"," UTC")}</p>:null;
  }
  const activeSource=catalogs.sources.find(source=>source.id===sourceId);
  const evidenceCount=detail?.sources.filter(link=>link.official_evidence&&isOfficialSourceKind(catalogs.sources.find(source=>source.id===link.source_id)?.source_kind)).length??0;
  const ready=useMemo(()=>eventReviewReady(form,evidenceCount),[form,evidenceCount]);
  const workflowMessage=event?.status==="published"?c.publishedWorkflow:event?.status==="approved"?c.approvedWorkflow:event?.status==="archived"?c.archivedWorkflow:event?.status==="rejected"?c.rejectedWorkflow:ready?c.ready:c.notReady;
  const workflowPositive=event?.status==="published"||event?.status==="approved"||(event?.status!=="archived"&&event?.status!=="rejected"&&ready);
  const transitionLabels:Record<NewsStatus,string>={draft:c.returnDraft,in_review:c.reviewStep,approved:c.approve,rejected:c.reject,published:c.publish,archived:c.archive};
  return <section className="rounded-xl border border-purple-400/20 bg-[#0d0e13] p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
      <div><p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">{c.details}</p><h2 className="mt-2 text-2xl font-black">{event?(locale==="pt-BR"?event.title_pt||event.title_en:event.title_en||event.title_pt)||c.untitled:c.draft}</h2></div>
      <div className="flex items-center gap-3">{event&&<><ActivityBadge status={event.event_status} copy={copy}/><StatusBadge status={event.status} copy={copy}/></>}<button type="button" onClick={close} disabled={busy} className={buttonClass}>{c.close} ×</button></div>
    </header>
    {error&&<p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{scheduleError(copy,error)}</p>}
    {message&&<p role="status" className="mt-4 rounded-lg border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-300">{message}</p>}
    {locked&&<p className="mt-4 rounded-lg bg-purple-500/10 p-3 text-xs text-purple-200">{c.locked}</p>}
    <form onSubmit={save} className="mt-5 space-y-5">
      <div className={panelClass}>
        <div className="grid gap-3 md:grid-cols-2">
          {input("slug",c.slug,120)}
          <Field label={c.category}><select disabled={disabled} value={form.category} onChange={e=>change("category",e.target.value as EventCategory)} className={fieldClass}>{EVENT_CATEGORIES.map(v=><option key={v} value={v}>{copy.categories[v]}</option>)}</select></Field>
          {!event&&<p className="text-xs text-zinc-500 md:col-span-2">{c.slugHint}</p>}
          <Field label={c.era}><select disabled={disabled} value={form.era_id} onChange={e=>change("era_id",e.target.value)} className={fieldClass}><option value="">{c.none}</option>{catalogs.eras.map(era=><option key={era.id} value={era.id} disabled={!era.is_active&&form.era_id!==era.id}>{era.name}{!era.is_active?` (${c.inactive})`:""}</option>)}</select></Field>
          <Field label={c.activityStatus}><select disabled={disabled} value={form.event_status} onChange={e=>change("event_status",e.target.value as EventStatus)} className={fieldClass}>{EVENT_STATUSES.map(v=><option key={v} value={v}>{copy.eventStatuses[v]}</option>)}</select></Field>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={form.is_featured} disabled={disabled} onChange={e=>change("is_featured",e.target.checked)} className="accent-purple-500"/>{c.featured}</label>
        </div>
      </div>
      <section className={panelClass}>
        <h3 className="mb-3 text-sm font-black">{c.schedule}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {input("starts_on",c.startDate,10)}
          {input("ends_on",c.endDate,10)}
          <Field label={c.timeKind}><select value={form.time_kind} disabled={disabled} onChange={e=>change("time_kind",e.target.value as TimeKind)} className={fieldClass}>{TIME_KINDS.map(kind=><option key={kind} value={kind}>{copy.timeKinds[kind]}</option>)}</select></Field>
          <Field label={c.zone}><input value={form.timezone} list="schedule-timezones" disabled={disabled} onChange={e=>change("timezone",e.target.value)} maxLength={100} className={fieldClass} placeholder="Asia/Seoul"/><datalist id="schedule-timezones">{["Asia/Seoul","Asia/Tokyo","Asia/Bangkok","Asia/Singapore","America/Sao_Paulo","America/New_York","America/Los_Angeles","Europe/London","Europe/Paris","Australia/Sydney","UTC"].map(zone=><option value={zone} key={zone}/>)}</datalist></Field>
          <p className="text-xs text-zinc-500 md:col-span-2">{c.zoneHint}</p>
          {form.time_kind==="timed"?<>
            <div className="space-y-2">{input("start_time",c.startTime,8)}{clockChoice("start_occurrence",startCandidates)}{utcText("start_occurrence",startCandidates)}</div>
            <div className="space-y-2">{input("end_time",c.endTime,8)}{clockChoice("end_occurrence",endCandidates)}{utcText("end_occurrence",endCandidates)}</div>
            <p className="text-xs text-zinc-500 md:col-span-2">{c.endHint}</p>
          </>:<p className="text-xs text-zinc-500 md:col-span-2">{c.timeHint}</p>}
        </div>
        <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs leading-5 text-zinc-400">{c.dateHint}</p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={panelClass}>
          <h3 className="mb-4 text-sm font-black tracking-widest text-purple-300">PT-BR</h3>
          <div className="space-y-3">{input("title_pt",c.titlePt,200)}{input("summary_pt",c.summaryPt,1600,true)}</div>
        </section>
        <section className={panelClass}>
          <h3 className="mb-4 text-sm font-black tracking-widest text-purple-300">EN</h3>
          <div className="space-y-3">{input("title_en",c.titleEn,200)}{input("summary_en",c.summaryEn,1600,true)}</div>
        </section>
      </div>
      <p className="text-xs leading-5 text-zinc-500">{c.manualNote}</p>
      <section className={panelClass}>
        <h3 className="mb-4 text-sm font-black">{c.locationDetails}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {input("location",c.location,300)}{input("venue_name",c.venue,300)}
          <div className="md:col-span-2">{input("official_event_url",c.eventUrl,2048)}</div>
        </div>
      </section>
      {!locked&&<div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={busy||Boolean(event&&!dirty)} className={primaryClass}>{busy?c.saving:event?c.saveChanges:c.saveDraft}</button>{dirty&&event&&<button type="button" disabled={busy} onClick={discard} className={buttonClass}>{c.discard}</button>}{dirty&&<span className="text-xs text-yellow-400">{c.unsaved}</span>}</div>}
    </form>

    {!event?<p className="mt-5 rounded-lg border border-white/10 p-4 text-xs text-zinc-400">{c.saveFirst}</p>:<>
      <section className={panelClass+" mt-5"}>
        <h3 className="text-sm font-black">{c.sources}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{c.sourcesHelp}</p>
        <div className="mt-4 space-y-2">{detail.sources.length===0?<p className="text-sm text-zinc-500">{c.noSources}</p>:detail.sources.map(source=><div key={source.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div className="min-w-0"><p className="text-xs font-bold">{source.source_name} <span className={source.official_evidence?"text-green-300":"text-zinc-500"}>· {source.official_evidence?c.officialBadge:c.referenceBadge}</span></p><a href={source.source_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-purple-300 hover:underline">{source.source_url}</a></div>{!locked&&<button type="button" disabled={busy} onClick={()=>void run({...common(),action:"remove_source",link_id:source.id},c.relationSaved)} className={buttonClass}>{c.remove}</button>}</div>)}</div>
        {!locked&&<>
          <div className="mt-4 grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
            <Field label={c.chooseSource}><select disabled={busy} value={sourceId} onChange={e=>{setSourceId(e.target.value);setOfficialEvidence(false);}} className={fieldClass}><option value="">{c.chooseSource}</option>{catalogs.sources.filter(v=>v.is_active).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
            <Field label={c.sourceUrl}><input disabled={busy} value={sourceUrl} maxLength={2048} onChange={e=>setSourceUrl(e.target.value)} className={fieldClass} placeholder="https://..."/></Field>
            <button type="button" disabled={busy||!sourceId||!sourceUrl.trim()} onClick={()=>void attachSource()} className={primaryClass}>{c.addSource}</button>
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-zinc-300"><input type="checkbox" className="mt-1 accent-purple-500" checked={officialEvidence} disabled={busy||!isOfficialSourceKind(activeSource?.source_kind)} onChange={e=>setOfficialEvidence(e.target.checked)}/><span>{c.officialEvidence}<span className="block text-zinc-500">{c.officialSourceHint}</span></span></label>
          <details className="mt-4 rounded-lg border border-white/10 p-3">
            <summary className="cursor-pointer text-xs font-bold text-purple-300">{c.registerSource} +</summary>
            <div className="mt-4 grid items-end gap-3 md:grid-cols-2">
              <Field label={c.sourceName}><input disabled={busy} value={sourceName} onChange={e=>setSourceName(e.target.value)} maxLength={160} className={fieldClass}/></Field>
              <Field label={c.homepage}><input disabled={busy} value={homepage} onChange={e=>setHomepage(e.target.value)} maxLength={2048} className={fieldClass} placeholder="https://..."/></Field>
              <Field label={c.sourceKind}><select disabled={busy} value={kind} onChange={e=>setKind(e.target.value as SourceKind)} className={fieldClass}>{SOURCE_KINDS.map(v=><option key={v} value={v}>{copy.sources[v]}</option>)}</select></Field>
              <button type="button" disabled={busy||!sourceName.trim()||!homepage.trim()} onClick={()=>void registerSource()} className={buttonClass}>{c.register}</button>
            </div>
          </details>
        </>}
      </section>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className={panelClass}><h3 className="text-sm font-black">{c.members}</h3>
          <div className="mt-4 flex flex-wrap gap-2">{catalogs.members.filter(member=>member.is_active||detail.memberIds.includes(member.id)).map(member=>{const selected=detail.memberIds.includes(member.id);return <button key={member.id} type="button" disabled={disabled} aria-pressed={selected} onClick={()=>void relation("member",member.id,selected?"remove":"add")} className={`rounded-full border px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${selected?"border-purple-400 bg-purple-500/15 text-purple-200":"border-white/10 text-zinc-400 hover:border-purple-400/40"}`}>{selected?"✓ ":""}{member.name}</button>;})}</div>
        </section>
        <section className={panelClass}><h3 className="text-sm font-black">{c.videos}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{c.videosHelp}</p>
          <div className="mt-3 space-y-2">{detail.videos.length===0?<p className="text-xs text-zinc-500">{c.noVideos}</p>:detail.videos.map(video=><div key={video.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-2"><Link href={`/admin/videos/${video.id}/edit`} className="min-w-0 text-xs text-zinc-300 hover:text-white">{video.title} <span className="text-zinc-500">({copy.statuses[video.status as NewsStatus]??video.status})</span></Link>{!locked&&<button type="button" disabled={busy} onClick={()=>void relation("video",video.id,"remove")} className={buttonClass}>{c.remove}</button>}</div>)}</div>
          {!locked&&<><div className="mt-3 flex gap-2"><input aria-label={c.videoSearch} disabled={busy} maxLength={100} value={videoSearch} onChange={e=>setVideoSearch(e.target.value)} className={fieldClass} placeholder={c.videoSearch}/><button type="button" disabled={busy} onClick={()=>void lookupVideos()} className={buttonClass}>{c.searchAction}</button></div>
          {searched&&<div className="mt-3 max-h-52 space-y-1 overflow-y-auto">{videoResults.filter(v=>!detail.videos.some(x=>x.id===v.id)).length===0?<p className="text-xs text-zinc-500">{c.noVideoResults}</p>:videoResults.filter(v=>!detail.videos.some(x=>x.id===v.id)).map(v=><div key={v.id} className="flex items-center justify-between gap-2 rounded border border-white/5 p-2"><span className="min-w-0 text-xs text-zinc-300">{v.title}</span><button type="button" disabled={busy} className={buttonClass} onClick={()=>void relation("video",v.id,"add")}>{c.add}</button></div>)}</div>}</>}
        </section>
      </div>
      <section className={panelClass+" mt-5"}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-black">{c.review}</h3><StatusBadge status={event.status} copy={copy}/></div>
        <p className={`mt-3 rounded-lg p-3 text-xs ${workflowPositive?"bg-green-500/10 text-green-300":event.status==="archived"?"bg-white/5 text-zinc-400":"bg-amber-500/10 text-amber-300"}`}>{workflowPositive?"✓ "+workflowMessage:workflowMessage}</p>
        <div className="mt-4 flex flex-wrap gap-2">{allowedTransitions(event.status).map(target=><button key={target} type="button" disabled={busy||dirty||(target==="approved"&&!ready)||(target==="published"&&!ready)} onClick={()=>void transition(target)} className={target==="approved"||target==="published"?primaryClass:buttonClass}>{transitionLabels[target]}</button>)}</div>
        <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-zinc-500"><span>{c.approvedAt}: {dateLabel(event.approved_at,locale)}</span><span>{c.publishedAt}: {dateLabel(event.published_at,locale)}</span></div>
      </section>
      <EventHistory history={detail.history} copy={copy} locale={locale}/>
    </>}
  </section>;
}


function EventHistory({history,copy,locale}:{history:EventAudit[];copy:ScheduleCopy;locale:string}){
  const c=copy.text;
  function dateTime(day:string|null,time:string|null,zone:string|null){
    return [day?dateLabel(day,locale):c.noDateConfirmed,localEventClock(time,zone),zone].filter(Boolean).join(" · ");
  }
  return <section className={panelClass+" mt-5"}>
    <h3 className="text-sm font-black">{c.history}</h3><p className="mt-2 text-xs text-zinc-500">{c.historyHint}</p>
    <div className="mt-3 space-y-2">
      {history.length===0?<p className="text-xs text-zinc-500">{c.noHistory}</p>:history.map(row=>{
        const changedDate=row.previous_event_starts_on!==row.new_event_starts_on||row.previous_event_starts_at!==row.new_event_starts_at||row.previous_event_timezone!==row.new_event_timezone;
        const changedEvent=row.previous_event_status!==row.new_event_status&&row.previous_event_status&&row.new_event_status;
        const changedEditorial=row.previous_status!==row.new_status&&row.previous_status&&row.new_status;
        return <div key={row.id} className="rounded-lg border border-white/10 p-3 text-xs text-zinc-400">
          <p className="font-bold text-zinc-300">{row.action==="created"?c.recordCreated:changedDate?c.dateChanged:row.action==="status_changed"?c.statusChanged:c.recordUpdated} <span className="ml-2 text-zinc-500">{dateLabel(row.created_at,locale)}</span></p>
          {changedEvent&&<p className="mt-1">{copy.eventStatuses[row.previous_event_status!]} → {copy.eventStatuses[row.new_event_status!]}</p>}
          {changedEditorial&&<p className="mt-1">{copy.statuses[row.previous_status!]} → {copy.statuses[row.new_status!]}</p>}
          {changedDate&&row.action!=="created"&&<><p className="mt-1">{c.originalDate}: {dateTime(row.previous_event_starts_on,row.previous_event_starts_at,row.previous_event_timezone)}</p><p className="mt-1">{c.newDate}: {dateTime(row.new_event_starts_on,row.new_event_starts_at,row.new_event_timezone)}</p></>}
        </div>;
      })}
    </div>
  </section>;
}

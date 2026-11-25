"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { allowedTransitions, articleFields, blankNews, editableStatus, NEWS_CATEGORIES, NEWS_STATUSES, PAGE_SIZE, reviewReady, SOURCE_KINDS, type EditorialSource, type NewsCatalogs, type NewsCategory, type NewsDetail, type NewsFields, type NewsList, type NewsStatus, type RelatedVideo, type SourceKind } from "@/lib/admin/news/model";
import { newsCopy, newsError, type NewsCopy } from "@/lib/admin/news/messages";

const fieldClass="w-full rounded-lg border border-white/10 bg-[#101116] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-purple-400/70 focus:outline-none disabled:opacity-60";
const buttonClass="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const primaryClass="rounded-lg bg-purple-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40";
const panelClass="rounded-xl border border-white/10 bg-white/[0.025] p-5";
const statusTone:Record<NewsStatus,string>={draft:"bg-yellow-500/10 text-yellow-300",in_review:"bg-sky-500/10 text-sky-300",approved:"bg-violet-500/15 text-violet-300",rejected:"bg-red-500/10 text-red-300",published:"bg-green-500/10 text-green-300",archived:"bg-zinc-500/15 text-zinc-400"};

class NewsApiError extends Error { constructor(public code:string){super(code);} }
async function api<T>(params?:Record<string,string>,body?:Record<string,unknown>):Promise<T>{
  const query=params?"?"+new URLSearchParams(params).toString():"";
  const result=await fetch("/api/admin/news"+query,body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{cache:"no-store"});
  const data=await result.json().catch(()=>null);
  if(!result.ok||!data) throw new NewsApiError(typeof data?.error==="string"?data.error:"database_error");
  return data as T;
}
function errorCode(e:unknown){return e instanceof NewsApiError?e.code:"generalError";}
function StatusBadge({status,copy}:{status:NewsStatus;copy:NewsCopy}){
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap ${statusTone[status]}`}>{copy.statuses[status]}</span>;
}
function Field({label,children}:{label:string;children:ReactNode}){
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-zinc-400">{label}</span>{children}</label>;
}
function dateLabel(value:string|null,locale:string){
  return value?new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(value)):"—";
}

type Filters={q:string;status:string;category:string};
type Props={initialList:NewsList;catalogs:NewsCatalogs};

export default function AdminNewsManager({initialList,catalogs:initialCatalogs}:Props){
  const {locale,t}=useAdminLocale();
  const copy=newsCopy(locale), c=copy.text;
  const [catalogs,setCatalogs]=useState(initialCatalogs);
  const [list,setList]=useState(initialList);
  const [filters,setFilters]=useState<Filters>({q:"",status:"",category:""});
  const [applied,setApplied]=useState<Filters>(filters);
  const [editor,setEditor]=useState<NewsDetail|null|undefined>(undefined);
  const [dirty,setDirty]=useState(false);
  const [listBusy,setListBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [editorBusy,setEditorBusy]=useState(false);
  const editorTop=useRef<HTMLDivElement>(null);
  const editorIdentity=editor===undefined?null:editor?.article.id??"new";
  useEffect(()=>{
    if(editorIdentity) editorTop.current?.scrollIntoView({behavior:"smooth",block:"start"});
  },[editorIdentity]);
  const totalPages=Math.max(1,Math.ceil(list.total/PAGE_SIZE));
  const allowSwitch=()=>!editorBusy&&(!dirty||window.confirm(c.discardConfirm));

  async function getList(next:Filters,page:number){
    setListBusy(true);setError("");
    try{
      const result=await api<NewsList>({...next,page:String(page)});
      setList(result);setApplied(next);
    }catch(e){setError(errorCode(e));}finally{setListBusy(false);}
  }
  async function openArticle(id:string){
    if(!allowSwitch())return;
    setListBusy(true);setError("");
    try{setEditor(await api<NewsDetail>({id}));setDirty(false);setNotice("");}
    catch(e){setError(errorCode(e));}finally{setListBusy(false);}
  }
  function newArticle(){if(allowSwitch()){setEditor(null);setDirty(false);setError("");setNotice("");}}
  function closeEditor(){if(allowSwitch()){setEditor(undefined);setDirty(false);setNotice("");}}
  async function refreshAfterMutation(id:string,message:string){
    const result=await api<NewsDetail>({id});
    setEditor(result);
    setNotice(message);
    await getList(applied,Math.min(list.page,totalPages));
  }
  const editorKey=editor?editor.article.id+":"+editor.article.updated_at:"new";

  return <main className="min-h-screen bg-[#08090d] px-5 py-10 text-white md:px-6 md:py-12">
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-white/10 pb-7">
        <Link href="/admin" className="text-xs font-bold text-zinc-500 hover:text-white">{t("← BACK TO DASHBOARD")}</Link>
        <p className="mt-6 text-xs font-bold tracking-[0.25em] text-purple-400">MONSTER ARCHIVE / {t("Phase 2.3 — Preview")}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-4xl font-black">{c.heading}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{c.intro}</p></div>
          <button type="button" onClick={newArticle} disabled={editorBusy||listBusy} className={primaryClass}>+ {c.create}</button>
        </div>
      </header>

      <section className="mt-7">
        <form onSubmit={(e)=>{e.preventDefault();void getList(filters,1);}} className={`${panelClass} grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]`}>
          <Field label={c.search}><input value={filters.q} maxLength={100} onChange={e=>setFilters({...filters,q:e.target.value})} className={fieldClass} placeholder={c.search}/></Field>
          <Field label={c.status}><select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className={fieldClass}><option value="">{c.all}</option>{NEWS_STATUSES.map(s=><option key={s} value={s}>{copy.statuses[s]}</option>)}</select></Field>
          <Field label={c.category}><select value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})} className={fieldClass}><option value="">{c.all}</option>{NEWS_CATEGORIES.map(v=><option key={v} value={v}>{copy.categories[v]}</option>)}</select></Field>
          <button type="submit" disabled={listBusy||editorBusy} className={primaryClass}>{listBusy?c.loading:c.searchAction}</button>
        </form>
        {error&&<p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{newsError(copy,error)}</p>}
        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wider text-zinc-400">{c.total}: <strong className="text-white">{list.total}</strong></span>
          <button type="button" onClick={()=>void getList(applied,list.page)} disabled={listBusy||editorBusy} className={buttonClass}>{c.refresh}</button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025]">
          {list.articles.length===0?<p className="px-5 py-10 text-center text-sm text-zinc-400">{c.empty}</p>:
          <table className="w-full min-w-[610px] text-left text-xs">
            <thead className="border-b border-white/10 text-zinc-500"><tr><th className="p-3">{c.details}</th><th className="p-3">{c.category}</th><th className="p-3">{c.status}</th><th className="p-3">{c.updated}</th><th className="p-3"><span className="sr-only">{c.edit}</span></th></tr></thead>
            <tbody>{list.articles.map(article=><tr key={article.id} className={`border-b border-white/5 last:border-0 ${editor?.article.id===article.id?"bg-purple-500/10":""}`}>
              <td className="p-3"><p className="font-bold text-zinc-100">{(locale==="pt-BR"?article.title_pt||article.title_en:article.title_en||article.title_pt)||c.untitled}</p><p className="mt-1 text-[10px] text-zinc-500">/{article.slug}{article.is_featured?" · ★":""}</p></td>
              <td className="p-3 text-zinc-400">{copy.categories[article.category]}</td><td className="p-3"><StatusBadge status={article.status} copy={copy}/></td>
              <td className="p-3 text-zinc-500 whitespace-nowrap">{dateLabel(article.updated_at,locale)}</td>
              <td className="p-3 text-right"><button disabled={listBusy||editorBusy} type="button" onClick={()=>void openArticle(article.id)} className={buttonClass}>{c.edit} →</button></td>
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
        <NewsEditor key={editorKey} detail={editor} catalogs={catalogs} copy={copy} locale={locale}
          onDirty={setDirty} onBusy={setEditorBusy} close={closeEditor} onChanged={refreshAfterMutation}
          onSourceRegistered={source=>setCatalogs(previous=>({...previous,sources:[...previous.sources.filter(v=>v.id!==source.id),source].sort((a,b)=>a.name.localeCompare(b.name))}))}/>
      </div>}
    </div>
  </main>;
}

type EditorProps={detail:NewsDetail|null;catalogs:NewsCatalogs;copy:NewsCopy;locale:string;onDirty:(value:boolean)=>void;onBusy:(value:boolean)=>void;close:()=>void;onChanged:(id:string,message:string)=>Promise<void>;onSourceRegistered:(source:EditorialSource)=>void};
function NewsEditor({detail,catalogs,copy,locale,onDirty,onBusy,close,onChanged,onSourceRegistered}:EditorProps){
  const c=copy.text;
  const article=detail?.article;
  const baseline=article?articleFields(article):blankNews();
  const [form,setForm]=useState<NewsFields>(baseline);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [sourceId,setSourceId]=useState("");
  const [sourceUrl,setSourceUrl]=useState("");
  const [sourceName,setSourceName]=useState("");
  const [homepage,setHomepage]=useState("");
  const [kind,setKind]=useState<SourceKind>("manual");
  const [videoSearch,setVideoSearch]=useState("");
  const [videoResults,setVideoResults]=useState<RelatedVideo[]>([]);
  const [searched,setSearched]=useState(false);
  const locked=Boolean(article&&!editableStatus(article.status));
  const dirty=JSON.stringify(form)!==JSON.stringify(baseline);
  const disabled=busy||locked;
  function change<K extends keyof NewsFields>(key:K,value:NewsFields[K]){
    const next={...form,[key]:value};setForm(next);onDirty(JSON.stringify(next)!==JSON.stringify(baseline));
  }
  function discard(){setForm(baseline);onDirty(false);}
  function setPending(next:boolean){setBusy(next);onBusy(next);}
  function common(){return {id:article?.id,expectedStatus:article?.status,expectedUpdatedAt:article?.updated_at};}

  async function run(body:Record<string,unknown>,notice:string){
    setPending(true);setMessage("");setError("");
    try{
      const result=await api<{id:string}>(undefined,body);
      if(body.action==="save"||body.action==="create")onDirty(false);
      await onChanged(result.id,notice);
      return true;
    }catch(e){setError(errorCode(e));return false;}finally{setPending(false);}
  }
  async function save(event:FormEvent){
    event.preventDefault();if(disabled)return;
    await run(article?{...common(),action:"save",fields:form}:{action:"create",fields:form},c.articleSaved);
  }
  async function transition(target:NewsStatus){
    if(!article||busy||dirty)return;
    const confirmation=target==="published"?c.publishConfirm:target==="approved"?c.approveConfirm:target==="archived"?c.archiveConfirm:target==="draft"?c.returnConfirm:target==="rejected"?c.rejectConfirm:"";
    if(confirmation&&!window.confirm(confirmation))return;
    await run({...common(),action:"transition",status:target},c.workflowSaved);
  }
  async function registerSource(){
    if(disabled||!article)return;
    setPending(true);setError("");setMessage("");
    try{
      const result=await api<{source:EditorialSource}>(undefined,{action:"register_source",name:sourceName,homepage_url:homepage,source_kind:kind});
      onSourceRegistered(result.source);setSourceId(result.source.id);setSourceName("");setHomepage("");setMessage(c.sourceRegistered);
    }catch(e){setError(errorCode(e));}finally{setPending(false);}
  }
  async function attachSource(){
    if(!article||disabled)return;
    setPending(true);setError("");setMessage("");
    const payload={...common(),action:"add_source",source_id:sourceId,source_url:sourceUrl};
    try{
      let result:{id:string};
      try{result=await api<{id:string}>(undefined,payload);}
      catch(e){
        if(errorCode(e)!=="source_shared")throw e;
        if(!window.confirm(c.duplicateSource+"\n\n"+c.sharedConfirm))return;
        result=await api<{id:string}>(undefined,{...payload,allowShared:true});
      }
      await onChanged(result.id,c.sourceAttached);setSourceUrl("");
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
  function input(key:Exclude<keyof NewsFields,"category"|"is_featured">,label:string,maxLength:number,multi=false){
    return <Field key={key} label={label}>{multi?<textarea className={fieldClass+" resize-y"} rows={key.startsWith("summary")?4:7} maxLength={maxLength} disabled={disabled} value={form[key]} onChange={e=>change(key,e.target.value)}/>:<input className={fieldClass} maxLength={maxLength} disabled={disabled} value={form[key]} onChange={e=>change(key,e.target.value)}/>}</Field>;
  }
  const ready=reviewReady(form,detail?.sources.length??0);
  const transitionLabels:Record<NewsStatus,string>={draft:c.returnDraft,in_review:c.reviewStep,approved:c.approve,rejected:c.reject,published:c.publish,archived:c.archive};
  return <section className="rounded-xl border border-purple-400/20 bg-[#0d0e13] p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
      <div><p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">{c.details}</p><h2 className="mt-2 text-2xl font-black">{article?(locale==="pt-BR"?article.title_pt||article.title_en:article.title_en||article.title_pt)||c.untitled:c.draft}</h2></div>
      <div className="flex items-center gap-3">{article&&<StatusBadge status={article.status} copy={copy}/>}<button type="button" onClick={close} disabled={busy} className={buttonClass}>{c.close} ×</button></div>
    </header>
    {error&&<p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{newsError(copy,error)}</p>}
    {message&&<p role="status" className="mt-4 rounded-lg border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-300">{message}</p>}
    {locked&&<p className="mt-4 rounded-lg bg-purple-500/10 p-3 text-xs text-purple-200">{c.locked}</p>}
    <form onSubmit={save} className="mt-5 space-y-5">
      <div className={panelClass}>
        <div className="grid gap-3 md:grid-cols-2">
          {input("slug",c.slug,120)}
          <Field label={c.category}><select disabled={disabled} value={form.category} onChange={e=>change("category",e.target.value as NewsCategory)} className={fieldClass}>{NEWS_CATEGORIES.map(v=><option key={v} value={v}>{copy.categories[v]}</option>)}</select></Field>
          {!article&&<p className="text-xs text-zinc-500 md:col-span-2">{c.slugHint}</p>}
          <Field label={c.era}><select disabled={disabled} value={form.era_id} onChange={e=>change("era_id",e.target.value)} className={fieldClass}><option value="">{c.none}</option>{catalogs.eras.map(era=><option key={era.id} value={era.id} disabled={!era.is_active&&form.era_id!==era.id}>{era.name}{!era.is_active?` (${c.inactive})`:""}</option>)}</select></Field>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={form.is_featured} disabled={disabled} onChange={e=>change("is_featured",e.target.checked)} className="accent-purple-500"/>{c.featured}</label>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={panelClass}>
          <h3 className="mb-4 text-sm font-black tracking-widest text-purple-300">PT-BR</h3>
          <div className="space-y-3">{input("title_pt",c.titlePt,200)}{input("summary_pt",c.summaryPt,1600,true)}{input("body_pt",c.bodyPt,20000,true)}</div>
        </section>
        <section className={panelClass}>
          <h3 className="mb-4 text-sm font-black tracking-widest text-purple-300">EN</h3>
          <div className="space-y-3">{input("title_en",c.titleEn,200)}{input("summary_en",c.summaryEn,1600,true)}{input("body_en",c.bodyEn,20000,true)}</div>
        </section>
      </div>
      <p className="text-xs leading-5 text-zinc-500">{c.manualNote}</p>
      <section className={panelClass}>
        <h3 className="mb-4 text-sm font-black">{c.cover}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">{input("cover_image_url",c.imageUrl,2048)}</div>
          {input("cover_image_alt_pt",c.altPt,300)}{input("cover_image_alt_en",c.altEn,300)}
          {input("cover_image_credit",c.credit,300)}{input("cover_image_source_url",c.imageSource,2048)}
        </div>
      </section>
      {!locked&&<div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={busy||Boolean(article&&!dirty)} className={primaryClass}>{busy?c.saving:article?c.saveChanges:c.saveDraft}</button>{dirty&&article&&<button type="button" disabled={busy} onClick={discard} className={buttonClass}>{c.discard}</button>}{dirty&&<span className="text-xs text-yellow-400">{c.unsaved}</span>}</div>}
    </form>

    {!article?<p className="mt-5 rounded-lg border border-white/10 p-4 text-xs text-zinc-400">{c.saveFirst}</p>:<>
      <section className={panelClass+" mt-5"}>
        <h3 className="text-sm font-black">{c.sources}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{c.sourcesHelp}</p>
        <div className="mt-4 space-y-2">{detail.sources.length===0?<p className="text-sm text-zinc-500">{c.noSources}</p>:detail.sources.map(source=><div key={source.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div className="min-w-0"><p className="text-xs font-bold">{source.source_name}</p><a href={source.source_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-purple-300 hover:underline">{source.source_url}</a></div>{!locked&&<button type="button" disabled={busy} onClick={()=>void run({...common(),action:"remove_source",link_id:source.id},c.relationSaved)} className={buttonClass}>{c.remove}</button>}</div>)}</div>
        {!locked&&<>
          <div className="mt-4 grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
            <Field label={c.chooseSource}><select disabled={busy} value={sourceId} onChange={e=>setSourceId(e.target.value)} className={fieldClass}><option value="">{c.chooseSource}</option>{catalogs.sources.filter(v=>v.is_active).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
            <Field label={c.sourceUrl}><input disabled={busy} value={sourceUrl} maxLength={2048} onChange={e=>setSourceUrl(e.target.value)} className={fieldClass} placeholder="https://..."/></Field>
            <button type="button" disabled={busy||!sourceId||!sourceUrl.trim()} onClick={()=>void attachSource()} className={primaryClass}>{c.addSource}</button>
          </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-black">{c.review}</h3><StatusBadge status={article.status} copy={copy}/></div>
        <p className={`mt-3 rounded-lg p-3 text-xs ${ready?"bg-green-500/10 text-green-300":"bg-amber-500/10 text-amber-300"}`}>{ready?"✓ "+c.ready:c.notReady}</p>
        <div className="mt-4 flex flex-wrap gap-2">{allowedTransitions(article.status).map(target=><button key={target} type="button" disabled={busy||dirty||(target==="approved"&&!ready)||(target==="published"&&!ready)} onClick={()=>void transition(target)} className={target==="approved"||target==="published"?primaryClass:buttonClass}>{transitionLabels[target]}</button>)}</div>
        <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-zinc-500"><span>{c.approvedAt}: {dateLabel(article.approved_at,locale)}</span><span>{c.publishedAt}: {dateLabel(article.published_at,locale)}</span></div>
      </section>
    </>}
  </section>;
}

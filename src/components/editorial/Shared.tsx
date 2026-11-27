import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { NEWS_CATEGORIES, publicUrl } from "@/lib/admin/news/model";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/lib/admin/schedule/model";
import { editorialHref, PUBLIC_PAGE_SIZE, type Filters } from "@/lib/editorial/model";
import { editorialCopy, label } from "@/lib/editorial/copy";
import type { Catalogs, Relations } from "@/lib/editorial/data";

export const panel = "rounded-xl border border-white/10 bg-white/[0.03]";
export const button = "inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold transition hover:border-purple-400 hover:text-purple-300 focus-visible:outline-2 focus-visible:outline-purple-400";
const control = "mt-2 min-w-0 w-full rounded-lg border border-white/15 bg-[#111217] px-3 text-sm text-white focus:border-purple-400 focus:outline-none";
export function PageFrame({ children }: { children: ReactNode }) { return <main className="min-h-screen bg-[#08090d] px-5 py-12 text-white md:px-10 md:py-20"><div className="mx-auto max-w-7xl">{children}</div></main>; }
export function Heading({ section, locale }: { section:"news"|"schedule"; locale:Locale }) {
  const c = editorialCopy(locale);
  return <header className="mb-10"><p className="mb-4 text-xs font-bold tracking-[0.26em] text-purple-400">MONSTER ARCHIVE / {c[section].toUpperCase()}</p><h1 className="text-5xl font-black tracking-tight md:text-7xl">{c[section]}<span className="text-purple-400">.</span></h1><p className="mt-5 max-w-2xl leading-7 text-zinc-400">{section === "news" ? c.newsIntro : c.scheduleIntro}</p></header>;
}
export function Loading() { return <PageFrame><div className="h-16 w-56 animate-pulse rounded bg-white/5"/><div className="mt-10 grid gap-5 md:grid-cols-3">{[1,2,3].map(i=><div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-white/5"/>)}</div></PageFrame>; }
export function Message({ text, hint }: { text:string; hint?:string }) { return <div className={panel+" p-10 text-center"}><p className="font-bold">{text}</p>{hint && <p className="mt-3 text-sm text-zinc-400">{hint}</p>}</div>; }
export function FilterForm({ section, f, catalog, locale }: { section:"news"|"schedule"; f:Filters; catalog:Catalogs; locale:Locale }) {
  const c = editorialCopy(locale);
  const categories = section === "news" ? NEWS_CATEGORIES : EVENT_CATEGORIES;
  const filterControl = control + (section === "schedule" ? " h-10 py-2" : " py-2.5");
  const select = (name:string,title:string,value:string,options:{id:string;name:string}[]) => <label className="min-w-0 text-xs font-bold text-zinc-400">{title}<select className={filterControl} name={name} defaultValue={value}><option value="">{c.all}</option>{options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
  return <form key={editorialHref(section,f,{page:1})} action={"/"+section} method="get" className={panel+" mb-8 p-4 md:p-5"}>
    {section === "schedule" && <input type="hidden" name="view" value={f.view}/>}
    {section === "schedule" && f.view === "calendar" && <input type="hidden" name="month" value={f.month}/>}
    <div className={section === "schedule"
      ? "grid items-end gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
      <label className="min-w-0 text-xs font-bold text-zinc-400">{c.search}<input className={filterControl} name="q" defaultValue={f.q} maxLength={100} placeholder={c.searchPlaceholder}/></label>
      {select("category",c.category,f.category,categories.map(id=>({id,name:label(id,locale)})))}
      {select("era",c.era,f.era,catalog.eras)}
      {select("member",c.member,f.member,catalog.members)}
      {section === "schedule" && select("status",c.status,f.status,EVENT_STATUSES.map(id=>({id,name:label(id,locale)})))}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-black hover:bg-purple-500" type="submit">{c.apply}</button><Link className={button} href={section === "news" ? "/news" : editorialHref(section,f,{q:"",category:"",era:"",member:"",status:"",page:1})}>{c.reset}</Link></div>
  </form>;
}
export function Pagination({ section, f, total, locale }: { section:"news"|"schedule"; f:Filters;total:number;locale:Locale }) {
  const c = editorialCopy(locale), pages = Math.max(1,Math.ceil(total/PUBLIC_PAGE_SIZE));
  if (pages===1 && f.page===1) return null;
  return <nav aria-label={locale === "pt-BR" ? "Paginação" : "Pagination"} className="mt-8 flex items-center justify-center gap-4">
    {f.page>1 ? <Link className={button} href={editorialHref(section,f,{page:Math.min(pages,f.page-1)})}>{c.previous}</Link> : <span className="text-sm text-zinc-600">{c.previous}</span>}
    <span className="text-sm tabular-nums text-zinc-400">{f.page} / {pages}</span>
    {f.page<pages ? <Link className={button} href={editorialHref(section,f,{page:f.page+1})}>{c.next}</Link> : <span className="text-sm text-zinc-600">{c.next}</span>}
  </nav>;
}
export function ExternalLink({ url, children }: { url:string|null;children:ReactNode }) {
  const safe = publicUrl(url);
  return safe ? <a className="break-words text-purple-300 underline-offset-4 hover:underline" href={safe} target="_blank" rel="noopener noreferrer">{children} ↗</a> : <span>{children}</span>;
}
export function RelationPanel({ relations, locale }: { relations:Relations;locale:Locale }) {
  const c=editorialCopy(locale);
  return <aside className="space-y-5">
    {relations.sources.length>0&&<section className={panel+" p-5"}><h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">{c.source}</h2><ul className="space-y-3 text-sm">{relations.sources.map((s,i)=><li key={i}><ExternalLink url={s.source_url}>{s.source_name}</ExternalLink></li>)}</ul></section>}
    {relations.members.length>0&&<section className={panel+" p-5"}><h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">{c.relatedMembers}</h2><div className="flex flex-wrap gap-2">{relations.members.map(m=><Link key={m.id} className={button} href={"/members/"+encodeURIComponent(m.slug)}>{m.name}</Link>)}</div></section>}
    {relations.videos.length>0&&<section className={panel+" p-5"}><h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">{c.relatedVideos}</h2><ul className="space-y-3 text-sm">{relations.videos.map(v=><li key={v.href}><Link className="text-purple-300 hover:underline" href={v.href}>{v.title} ↗</Link></li>)}</ul></section>}
  </aside>;
}
export function BackLink({ section,locale }: { section:"news"|"schedule";locale:Locale }) { const c=editorialCopy(locale);return <Link href={"/"+section} className="mb-7 inline-flex text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-purple-300">← {c.back} {c[section]}</Link>; }

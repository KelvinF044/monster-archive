import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { catalogs, eventFeed } from "@/lib/editorial/data";
import { parseFilters, editorialHref, CALENDAR_LIMIT, type SearchParams, type View } from "@/lib/editorial/model";
import { editorialCopy } from "@/lib/editorial/copy";
import { button, FilterForm, Heading, Loading, Message, PageFrame, Pagination } from "@/components/editorial/Shared";
import { EventCard } from "@/components/editorial/Cards";
import Calendar from "@/components/editorial/Calendar";

export const metadata:Metadata={title:"Events",robots:{index:false,follow:false}};
type Props={searchParams:Promise<SearchParams>};
const views:View[]=["upcoming","calendar","history"];
export default function SchedulePage(props:Props){return <Suspense fallback={<Loading/>}><ScheduleContent {...props}/></Suspense>;}
async function ScheduleContent({searchParams}:Props){
  await connection();
  const now=new Date(),locale=await getLocale(),c=editorialCopy(locale);
  const f=parseFilters(await searchParams,"schedule",now);
  const result=await Promise.all([catalogs(),eventFeed(f,now)]).catch(()=>null);
  return <PageFrame><Heading section="schedule" locale={locale}/>
    <nav aria-label={c.schedule} className="mb-6 flex flex-wrap gap-2">{views.map(view=><Link key={view} href={editorialHref("schedule",f,{view,page:1})} aria-current={view===f.view?"page":undefined} className={button+(view===f.view?" border-purple-500 bg-purple-600 text-white hover:text-white":"")}>{c[view]}</Link>)}</nav>
    {!result?<Message text={c.unavailable}/>:<>
      <FilterForm section="schedule" f={f} catalog={result[0]} locale={locale}/>
      <p className="mb-5 text-sm leading-6 text-zinc-400">{c.calendarNote}</p>
      {f.view==="calendar"&&<><Calendar f={f} events={result[1].events} locale={locale}/>{result[1].total>CALENDAR_LIMIT&&<p className="mb-5 text-sm text-amber-300">{c.calendarLimit}</p>}</>}
      <div id="event-list" className="mb-5 flex scroll-mt-24 flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><h2 className="text-xs font-bold uppercase tracking-widest">{c[f.view]}</h2><span className="text-xs text-zinc-400">{result[1].total} {c.eventCount}</span></div>
      {result[1].events.length?<div className="space-y-4">{result[1].events.map(event=><EventCard key={event.id} event={event} locale={locale} catalog={result[0]}/>)}</div>:<Message text={c.emptyEvents} hint={c.emptyHint}/>}
      {f.view!=="calendar"&&<Pagination section="schedule" f={f} total={result[1].total} locale={locale}/>}
    </>}
  </PageFrame>;
}

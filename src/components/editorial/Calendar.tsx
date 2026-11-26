import Link from "next/link";
import type { Event } from "@/lib/editorial/data";
import type { Locale } from "@/lib/i18n/config";
import { calendarDays, editorialHref, localText, occursOn, shiftMonth, type Filters } from "@/lib/editorial/model";
import { editorialCopy, label } from "@/lib/editorial/copy";
import { button, panel } from "./Shared";

export default function Calendar({f,events,locale}:{f:Filters;events:Event[];locale:Locale}) {
  const c=editorialCopy(locale);
  const month=new Intl.DateTimeFormat(locale==="pt-BR"?"pt-BR":"en-US",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(f.month+"-01T00:00:00Z"));
  return <section className={panel+" mb-8 overflow-hidden"} aria-label={c.calendar}>
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      {f.month>"1900-01"?<Link className={button} href={editorialHref("schedule",f,{month:shiftMonth(f.month,-1),page:1})}>← <span className="ml-1 hidden sm:inline">{c.previous}</span></Link>:<span/>}
      <h2 className="text-lg font-black capitalize md:text-2xl">{month}</h2>
      {f.month<"9998-12"?<Link className={button} href={editorialHref("schedule",f,{month:shiftMonth(f.month,1),page:1})}><span className="mr-1 hidden sm:inline">{c.next}</span> →</Link>:<span/>}
    </div>
    <div className="grid grid-cols-7 border-t border-white/10">{c.days.map(d=><div key={d} className="p-2 text-center text-[10px] font-bold text-zinc-400 sm:text-xs">{d}</div>)}</div>
    <div className="grid grid-cols-7 border-t border-white/10">{calendarDays(f.month).map((day,i)=>{
      const matches=day?events.filter(event=>occursOn(event,day)):[];
      return <div key={day??"blank-"+i} className="min-h-[64px] min-w-0 border-r border-b border-white/10 p-1.5 md:min-h-28 md:p-2">
        {day&&<><p className="text-xs font-semibold text-zinc-400">{Number(day.slice(-2))}</p><div className="mt-1.5 space-y-1">
          {matches.slice(0,2).map(event=><Link key={event.id} href={"/schedule/"+event.slug} title={localText(event.title_pt,event.title_en,locale)+" · "+label(event.event_status,locale)} className="block truncate rounded border border-purple-400/20 bg-purple-500/15 px-1 py-1 text-[10px] font-bold text-purple-200 hover:bg-purple-500/30 sm:text-xs" aria-label={localText(event.title_pt,event.title_en,locale)}>{localText(event.title_pt,event.title_en,locale)}</Link>)}
          {matches.length>2&&<a href="#event-list" className="block text-[10px] text-zinc-400 hover:text-white">+{matches.length-2} {c.more}</a>}
        </div></>}
      </div>;
    })}</div>
  </section>;
}

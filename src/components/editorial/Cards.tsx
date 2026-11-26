import Link from "next/link";
import type { News, Event, Catalogs } from "@/lib/editorial/data";
import type { Locale } from "@/lib/i18n/config";
import { displayDate, localText } from "@/lib/editorial/model";
import { editorialCopy, label } from "@/lib/editorial/copy";
import Cover from "./Cover";
import EventTime from "./EventTime";
import { panel } from "./Shared";

export function NewsCard({ item, locale, catalog, featured=false }: {item:News;locale:Locale;catalog:Catalogs;featured?:boolean}) {
  const c=editorialCopy(locale), era=catalog.eras.find(e=>e.id===item.era_id);
  return <Link href={"/news/"+item.slug} className={panel+` group grid overflow-hidden transition hover:border-purple-400/60 ${featured?"lg:grid-cols-2":""}`}>
    <Cover url={item.cover_image_url} alt={localText(item.cover_image_alt_pt,item.cover_image_alt_en,locale)}/>
    <div className="flex flex-col justify-center p-5 md:p-6">
      <p className="mb-3 text-xs font-bold tracking-wide text-purple-300">{featured ? c.featured+" · " : ""}{label(item.category,locale)}{era?" · "+era.name:""}</p>
      <h2 className={`font-black leading-tight group-hover:text-purple-300 ${featured?"text-2xl md:text-4xl":"text-xl"}`}>{localText(item.title_pt,item.title_en,locale)}</h2>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{localText(item.summary_pt,item.summary_en,locale)}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs"><time className="text-zinc-400" dateTime={item.published_at??undefined}>{displayDate(item.published_at,locale)}</time><span className="font-bold text-purple-300">{c.read} ↗</span></div>
    </div>
  </Link>;
}
const statusColors: Record<string,string> = { confirmed:"bg-emerald-500/15 text-emerald-300",completed:"bg-zinc-500/20 text-zinc-300",cancelled:"bg-red-500/15 text-red-300", postponed:"bg-amber-500/15 text-amber-300",rescheduled:"bg-blue-500/15 text-blue-300" };
export function EventBadge({ status,locale }: {status:string;locale:Locale}) { return <span className={"inline-flex rounded-full px-3 py-1 text-xs font-bold "+(statusColors[status]??"bg-white/10 text-zinc-300")}>{label(status,locale)}</span>; }
export function EventCard({event,locale,catalog}:{event:Event;locale:Locale;catalog:Catalogs}) {
  const c=editorialCopy(locale), era=catalog.eras.find(e=>e.id===event.era_id);
  return <Link href={"/schedule/"+event.slug} className={panel+" group grid gap-5 p-5 transition hover:border-purple-400/60 md:grid-cols-[minmax(180px,230px)_1fr] md:p-6"}>
    <div className="border-b border-white/10 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5"><EventTime event={event} locale={locale}/></div>
    <div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-purple-300">{label(event.category,locale)}{era?" · "+era.name:""}</span><EventBadge status={event.event_status} locale={locale}/></div>
      <h2 className="text-xl font-black group-hover:text-purple-300">{localText(event.title_pt,event.title_en,locale)}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{localText(event.summary_pt,event.summary_en,locale)}</p>
      {(event.location||event.venue_name)&&<p className="mt-2 text-sm text-zinc-300">{[event.venue_name,event.location].filter(Boolean).join(" · ")}</p>}
      <span className="mt-3 inline-block text-xs font-bold text-purple-300">{c.details} ↗</span>
    </div>
  </Link>;
}

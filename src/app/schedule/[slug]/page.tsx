import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { eventBySlug, catalogs, relations } from "@/lib/editorial/data";
import { localText } from "@/lib/editorial/model";
import { editorialCopy, label } from "@/lib/editorial/copy";
import { BackLink, ExternalLink, Loading, Message, PageFrame, RelationPanel, panel } from "@/components/editorial/Shared";
import { EventBadge } from "@/components/editorial/Cards";
import EventTime from "@/components/editorial/EventTime";

export const metadata:Metadata={title:"Event details",robots:{index:false,follow:false}};
type Props={params:Promise<{slug:string}>};
export default function EventDetailPage(props:Props){return <Suspense fallback={<Loading/>}><EventContent {...props}/></Suspense>;}
async function EventContent({params}:Props){
  await connection();
  const {slug}=await params,locale=await getLocale(),c=editorialCopy(locale);
  const event=await eventBySlug(slug,new Date()).catch(()=>undefined);
  if(event===null)notFound();
  if(!event)return <PageFrame><BackLink section="schedule" locale={locale}/><Message text={c.unavailable}/></PageFrame>;
  const info=await Promise.all([catalogs(),relations("schedule",event.id)]).catch(()=>null);
  const era=info?.[0].eras.find(e=>e.id===event.era_id);
  return <PageFrame><BackLink section="schedule" locale={locale}/>
    <article className="mx-auto max-w-6xl">
      <header className="mb-8 max-w-4xl"><div className="flex flex-wrap items-center gap-3"><span className="text-xs font-bold uppercase tracking-widest text-purple-300">{label(event.category,locale)}{era?" / "+era.name:""}</span><EventBadge status={event.event_status} locale={locale}/></div>
        <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{localText(event.title_pt,event.title_en,locale)}</h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6"><section className={panel+" grid gap-5 p-6 sm:grid-cols-2"}><EventTime event={event} locale={locale}/>
          {(event.venue_name||event.location)&&<div><h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{c.venue}</h2><p className="font-semibold text-zinc-200">{event.venue_name}</p><p className="text-sm text-zinc-400">{event.location}</p></div>}
          {event.official_event_url&&<div className="sm:col-span-2 text-sm"><ExternalLink url={event.official_event_url}>{c.officialLink}</ExternalLink></div>}
          </section>
          <p className="whitespace-pre-wrap break-words text-lg leading-8 text-zinc-300">{localText(event.summary_pt,event.summary_en,locale)}</p>
        </div>
        {info?<RelationPanel relations={info[1]} locale={locale}/>:<Message text={c.unavailable}/>}
      </div>
    </article>
  </PageFrame>;
}

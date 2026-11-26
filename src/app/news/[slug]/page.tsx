import type { Metadata } from "next";
import { editorialRobots } from "@/lib/editorial/metadata";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { articleBySlug, catalogs, relations } from "@/lib/editorial/data";
import { displayDate, localText } from "@/lib/editorial/model";
import { editorialCopy, label } from "@/lib/editorial/copy";
import { BackLink, ExternalLink, Loading, Message, PageFrame, RelationPanel } from "@/components/editorial/Shared";
import Cover from "@/components/editorial/Cover";

export const metadata:Metadata={title:"News article",robots:editorialRobots};
type Props={params:Promise<{slug:string}>};
export default function NewsDetailPage(props:Props){return <Suspense fallback={<Loading/>}><ArticleContent {...props}/></Suspense>;}
async function ArticleContent({params}:Props){
  await connection();
  const {slug}=await params, locale=await getLocale(), c=editorialCopy(locale);
  const article=await articleBySlug(slug,new Date()).catch(()=>undefined);
  if(article===null)notFound();
  if(!article)return <PageFrame><BackLink section="news" locale={locale}/><Message text={c.unavailable}/></PageFrame>;
  const info=await Promise.all([catalogs(),relations("news",article.id)]).catch(()=>null);
  const era=info?.[0].eras.find(e=>e.id===article.era_id);
  return <PageFrame><BackLink section="news" locale={locale}/>
    <article className="mx-auto max-w-6xl">
      <header className="mb-8 max-w-4xl"><p className="text-xs font-bold uppercase tracking-widest text-purple-300">{label(article.category,locale)}{era?" / "+era.name:""}</p>
      <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{localText(article.title_pt,article.title_en,locale)}</h1>
      <p className="mt-5 text-sm text-zinc-400">{c.published} <time dateTime={article.published_at??undefined}>{displayDate(article.published_at,locale)}</time></p></header>
      {article.cover_image_url&&<figure className="mb-8 overflow-hidden rounded-xl border border-white/10"><Cover url={article.cover_image_url} alt={localText(article.cover_image_alt_pt,article.cover_image_alt_en,locale)} contain/>
        {(article.cover_image_credit||article.cover_image_source_url)&&<figcaption className="flex flex-wrap gap-x-4 gap-y-2 bg-white/[0.03] px-4 py-3 text-xs text-zinc-400">{article.cover_image_credit&&<span>{c.imageCredit}: {article.cover_image_credit}</span>}{article.cover_image_source_url&&<ExternalLink url={article.cover_image_source_url}>{c.imageSource}</ExternalLink>}</figcaption>}
      </figure>}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0"><p className="whitespace-pre-wrap break-words text-xl font-semibold leading-9 text-zinc-200">{localText(article.summary_pt,article.summary_en,locale)}</p>
          <div className="mt-7 whitespace-pre-wrap break-words text-base leading-8 text-zinc-300">{localText(article.body_pt,article.body_en,locale)}</div>
        </div>
        {info?<RelationPanel relations={info[1]} locale={locale}/>:<Message text={c.unavailable}/>}
      </div>
    </article>
  </PageFrame>;
}

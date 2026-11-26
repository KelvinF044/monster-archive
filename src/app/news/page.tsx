import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { catalogs, newsFeed } from "@/lib/editorial/data";
import { parseFilters, type SearchParams } from "@/lib/editorial/model";
import { editorialCopy } from "@/lib/editorial/copy";
import { FilterForm, Heading, Loading, Message, PageFrame, Pagination } from "@/components/editorial/Shared";
import { NewsCard } from "@/components/editorial/Cards";

export const metadata: Metadata = { title: "News", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<SearchParams> };
export default function NewsPage(props: Props) {
  return <Suspense fallback={<Loading/>}><NewsContent {...props}/></Suspense>;
}
async function NewsContent({searchParams}:Props) {
  await connection();
  const now = new Date(), locale = await getLocale(), c = editorialCopy(locale);
  const f = parseFilters(await searchParams,"news",now);
  const result = await Promise.all([catalogs(),newsFeed(f,now)]).catch(()=>null);
  return <PageFrame><Heading section="news" locale={locale}/>
    {!result ? <Message text={c.unavailable}/> : <>
      <FilterForm section="news" f={f} catalog={result[0]} locale={locale}/>
      {f.page===1&&result[1].featured&&<div className="mb-10"><NewsCard item={result[1].featured} locale={locale} catalog={result[0]} featured/></div>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><h2 className="text-xs font-bold uppercase tracking-widest">{c.latest}</h2><span className="text-xs text-zinc-400">{result[1].total+(result[1].featured?1:0)} {c.results}</span></div>
      {result[1].articles.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result[1].articles.map(item=><NewsCard key={item.id} item={item} locale={locale} catalog={result[0]}/>)}</div> : (f.page!==1||!result[1].featured) ? <Message text={c.emptyNews} hint={c.emptyHint}/> : null}
      <Pagination section="news" f={f} total={result[1].total} locale={locale}/>
    </>}
  </PageFrame>;
}

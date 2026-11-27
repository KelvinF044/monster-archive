"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import Cover from "@/components/editorial/Cover";
import EventTime from "@/components/editorial/EventTime";
import { editorialCopy, label } from "@/lib/editorial/copy";
import type { HomeEventItem, HomeNewsItem } from "@/lib/editorial/data";
import { displayDate, localText } from "@/lib/editorial/model";

const homeCopy = {
  en: {
    allNews: "View all news",
    upcomingEvents: "Upcoming events",
    fullSchedule: "View schedule",
    emptyEvents: "No upcoming events confirmed.",
  },
  "pt-BR": {
    allNews: "Ver todas as notícias",
    upcomingEvents: "Próximos eventos",
    fullSchedule: "Ver agenda",
    emptyEvents: "Nenhum próximo evento confirmado.",
  },
};

const sectionLink = "shrink-0 rounded text-sm font-bold text-purple-300 hover:text-purple-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-300";
const cardLink = "block overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-purple-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300";
const message = "rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400";

export default function HomeEditorial({
  news,
  events,
}: {
  news: HomeNewsItem[] | null;
  events: HomeEventItem[] | null;
}) {
  const { locale } = useLanguage();
  const copy = homeCopy[locale];
  const editorial = editorialCopy(locale);

  return (
    <div className="border-t border-white/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 xl:grid-cols-[2fr_1fr]">
        <section className="min-w-0" aria-labelledby="home-latest-news">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id="home-latest-news" className="text-2xl font-black md:text-3xl">{editorial.latest}</h2>
            <Link className={sectionLink} href="/news">{copy.allNews} <span aria-hidden="true">→</span></Link>
          </div>

          {news?.length ? (
            <ul className="grid gap-4 sm:grid-cols-3">
              {news.map((item) => (
                <li key={item.id}>
                  <Link className={cardLink + " group h-full"} href={`/news/${item.slug}`}>
                    <Cover url={item.cover_image_url} alt={localText(item.cover_image_alt_pt, item.cover_image_alt_en, locale)} />
                    <div className="space-y-2 p-4">
                      <p className="text-xs font-bold text-purple-300">{label(item.category, locale)}</p>
                      <h3 className="break-words font-black leading-snug group-hover:text-purple-300">
                        {localText(item.title_pt, item.title_en, locale)}
                      </h3>
                      <time className="block text-xs text-zinc-400" dateTime={item.published_at ?? undefined}>
                        {displayDate(item.published_at, locale)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className={message}>{news ? editorial.emptyNews : editorial.unavailable}</p>}
        </section>

        <section className="min-w-0" aria-labelledby="home-upcoming-events">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id="home-upcoming-events" className="text-2xl font-black md:text-3xl">{copy.upcomingEvents}</h2>
            <Link className={sectionLink} href="/schedule">{copy.fullSchedule} <span aria-hidden="true">→</span></Link>
          </div>

          {events?.length ? (
            <ul className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {events.map((event) => (
                <li key={event.id}>
                  <Link className={cardLink + " group h-full space-y-2 p-4"} href={`/schedule/${event.slug}`}>
                    <p className="text-xs font-bold text-purple-300">
                      {label(event.category, locale)}
                      {event.event_status === "rescheduled" && ` · ${label(event.event_status, locale)}`}
                    </p>
                    <h3 className="break-words font-black leading-snug group-hover:text-purple-300">
                      {localText(event.title_pt, event.title_en, locale)}
                    </h3>
                    <EventTime event={event} locale={locale} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className={message}>{events ? copy.emptyEvents : editorial.unavailable}</p>}
        </section>
      </div>
    </div>
  );
}

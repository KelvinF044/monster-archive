import Link from "next/link";
import { redirect } from "next/navigation";

import FavoriteVideoCards from "@/components/FavoriteVideoCards";
import HistoryCommandButton from "@/components/HistoryCommandButton";
import { authMessages } from "@/lib/auth/messages";
import { getSessionClaims } from "@/lib/auth/session";
import { getLibraryFavorites } from "@/lib/favorites/data";
import { favoritesMessages } from "@/lib/favorites/messages";
import { getLibraryHistory } from "@/lib/history/data";
import { historyMessages } from "@/lib/history/messages";
import { formatPlaybackPosition, historyHref } from "@/lib/history/model";
import { getLocale } from "@/lib/i18n/server";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ page?: string; tab?: string }> }) {
  const [claims, locale, params] = await Promise.all([getSessionClaims(), getLocale(), searchParams]);
  if (!claims) redirect("/login?next=library");

  const historyTab = params.tab === "history";
  const tabPath = historyTab ? historyHref : "/library";
  const page = Number(params.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) redirect(tabPath);

  const history = historyTab ? await getLibraryHistory(claims.sub, page) : null;
  const favorites = historyTab ? null : await getLibraryFavorites(claims.sub, page);
  const list = history ?? favorites;
  if (list && page > 1 && list.cards.length === 0) redirect(tabPath);

  const copy = favoritesMessages(locale);
  const historyCopy = historyMessages(locale);
  const tabTitle = historyTab ? historyCopy.history : copy.favorites;
  const pageLink = (number: number) => number === 1 ? tabPath : `${tabPath}${historyTab ? "&" : "?"}page=${number}`;
  const tabClass = (active: boolean) => `rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-purple-400 ${active ? "border-purple-400/45 bg-purple-500/15 text-white" : "border-white/15 text-zinc-300 hover:border-purple-400"}`;

  return (
    <main className="community-surface min-h-[calc(100svh-5rem)] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black sm:text-4xl">{copy.library}</h1>
          <Link href="/account" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:border-purple-400">
            {authMessages(locale).account}
          </Link>
        </div>

        <nav aria-label={copy.library} className="mb-7 flex flex-wrap gap-2">
          <Link href="/library" aria-current={!historyTab ? "page" : undefined} className={tabClass(!historyTab)}>{copy.favorites}</Link>
          <Link href={historyHref} aria-current={historyTab ? "page" : undefined} className={tabClass(historyTab)}>{historyCopy.history}</Link>
        </nav>

        <section aria-labelledby="library-section">
          <h2 id="library-section" className="mb-4 text-xl font-bold">{tabTitle}</h2>
          {history && (
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#15111d] p-4">
              <p className="py-2 text-sm text-zinc-300">{history.paused ? historyCopy.paused : historyCopy.active}</p>
              <div className="flex flex-wrap items-start gap-2">
                <HistoryCommandButton command={history.paused ? "resume" : "pause"} />
                {!!history.cards.length && <HistoryCommandButton command="clear" />}
              </div>
            </div>
          )}
          {!list ? <p role="alert" className="text-red-200">{historyTab ? historyCopy.loadError : copy.loadError}</p> : !list.cards.length ? (
            <div className="rounded-2xl border border-white/10 bg-[#15111d] p-7 text-zinc-200">
              <p>{historyTab ? historyCopy.empty : copy.empty}</p>
              <Link href="/watch" className="mt-4 inline-block text-sm font-semibold text-purple-200 hover:underline">{copy.browse}</Link>
            </div>
          ) : history ? (
            <FavoriteVideoCards cards={history.cards} actions={(video) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
                {video.completed ? (
                  <span className="text-sm text-zinc-300">{historyCopy.completed}</span>
                ) : video.position_seconds > 0 && (
                  <Link href={`/watch/${video.collection_slug}/${video.video_slug}?resume=1`} prefetch={false} className="text-sm font-semibold text-purple-200 hover:underline">
                    {historyCopy.continueAt} {formatPlaybackPosition(video.position_seconds)}
                  </Link>
                )}
                <HistoryCommandButton command="remove" videoId={video.video_id} title={video.title} />
              </div>
            )} />
          ) : favorites && <FavoriteVideoCards cards={favorites.cards} editable />}
          {list && (page > 1 || list.hasNext) && (
            <nav aria-label={tabTitle} className="mt-6 flex gap-4 text-sm font-semibold text-purple-200">
              {page > 1 && <Link href={pageLink(page - 1)} className="hover:underline">{copy.previous}</Link>}
              {list.hasNext && <Link href={pageLink(page + 1)} className="hover:underline">{copy.next}</Link>}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

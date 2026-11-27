import Link from "next/link";
import { redirect } from "next/navigation";

import FavoriteVideoCards from "@/components/FavoriteVideoCards";
import { authMessages } from "@/lib/auth/messages";
import { getSessionClaims } from "@/lib/auth/session";
import { getLibraryFavorites } from "@/lib/favorites/data";
import { favoritesMessages } from "@/lib/favorites/messages";
import { getLocale } from "@/lib/i18n/server";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [claims, locale, params] = await Promise.all([getSessionClaims(), getLocale(), searchParams]);
  if (!claims) redirect("/login?next=library");
  const page = Number(params.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) redirect("/library");
  const list = await getLibraryFavorites(claims.sub, page);
  if (list && page > 1 && list.cards.length === 0) redirect("/library");

  const copy = favoritesMessages(locale);
  return (
    <main className="community-surface min-h-[calc(100svh-5rem)] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black sm:text-4xl">{copy.library}</h1>
          <Link href="/account" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:border-purple-400">
            {authMessages(locale).account}
          </Link>
        </div>
        <section aria-labelledby="library-favorites">
          <h2 id="library-favorites" className="mb-4 text-xl font-bold">{copy.favorites}</h2>
          {!list ? <p role="alert" className="text-red-200">{copy.loadError}</p> : list.cards.length ? (
            <FavoriteVideoCards cards={list.cards} editable />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#15111d] p-7 text-zinc-200">
              <p>{copy.empty}</p>
              <Link href="/watch" className="mt-4 inline-block text-sm font-semibold text-purple-200 hover:underline">{copy.browse}</Link>
            </div>
          )}
          {list && (page > 1 || list.hasNext) && (
            <nav aria-label={copy.favorites} className="mt-6 flex gap-4 text-sm font-semibold text-purple-200">
              {page > 1 && <Link href={page === 2 ? "/library" : `/library?page=${page - 1}`} className="hover:underline">{copy.previous}</Link>}
              {list.hasNext && <Link href={`/library?page=${page + 1}`} className="hover:underline">{copy.next}</Link>}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

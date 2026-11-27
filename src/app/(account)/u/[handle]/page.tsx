import { notFound } from "next/navigation";
import { connection } from "next/server";

import FavoriteVideoCards from "@/components/FavoriteVideoCards";
import { favoritesMessages } from "@/lib/favorites/messages";
import CommunityProfileCard from "@/components/CommunityProfileCard";
import { historyMessages } from "@/lib/history/messages";
import { getLocale } from "@/lib/i18n/server";
import { getPublicProfile } from "@/lib/profiles/data";
import { validHandle } from "@/lib/profiles/model";

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  await connection();
  const { handle } = await params;
  if (!validHandle(handle)) notFound();

  const [result, locale] = await Promise.all([getPublicProfile(handle), getLocale()]);
  if (!result) notFound();

  return (
    <main className="community-surface min-h-[calc(100svh-5rem)] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <CommunityProfileCard profile={result.profile} catalog={result.catalog} locale={locale} heading="h1" />
        {result.favorites.length > 0 && (
          <section className="mt-8" aria-labelledby="profile-favorites">
            <h2 id="profile-favorites" className="mb-4 text-xl font-bold">{favoritesMessages(locale).shared}</h2>
            <FavoriteVideoCards cards={result.favorites} />
          </section>
        )}
        {result.history.length > 0 && (
          <section className="mt-8" aria-labelledby="profile-history">
            <h2 id="profile-history" className="mb-4 text-xl font-bold">{historyMessages(locale).shared}</h2>
            <FavoriteVideoCards cards={result.history} />
          </section>
        )}
      </div>
    </main>
  );
}

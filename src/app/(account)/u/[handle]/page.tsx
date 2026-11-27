import { notFound } from "next/navigation";
import { connection } from "next/server";

import CommunityProfileCard from "@/components/CommunityProfileCard";
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
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-white sm:px-6 sm:py-16">
      <CommunityProfileCard profile={result.profile} catalog={result.catalog} locale={locale} heading="h1" />
    </main>
  );
}

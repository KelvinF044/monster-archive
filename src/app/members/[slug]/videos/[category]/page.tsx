import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import WatchVideoGrid from "@/components/WatchVideoGrid";
import { getFavoriteVideoIds } from "@/lib/favorites/data";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getVideoEras } from "@/lib/watch/eras";
import {
  getMemberArchiveCategory,
  getMemberArchiveVideos,
  isMemberArchiveCategory,
} from "@/lib/watch/member-archive";

type Props = {
  params: Promise<{ slug: string; category: string }>;
};

export default function MemberVideosPage({ params }: Props) {
  return (
    <Suspense fallback={<main aria-busy="true" className="min-h-[60vh] bg-[#08090d]" />}>
      <MemberVideos params={params} />
    </Suspense>
  );
}

async function MemberVideos({ params }: Props) {
  await connection();

  const { slug, category } = await params;
  if (!isMemberArchiveCategory(category)) notFound();

  const [{ locale, dictionary }, supabase] = await Promise.all([getDictionary(), createClient()]);
  const { data: member, error } = await supabase
    .from("members")
    .select("id, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!member) notFound();

  const { title, description, gradient } = getMemberArchiveCategory(category, dictionary.memberProfile);
  const copy = dictionary.watch;
  const videos = await getMemberArchiveVideos(supabase, member.id, category);
  const [eras, savedIds] = await Promise.all([
    getVideoEras(supabase, videos),
    getFavoriteVideoIds(videos.map(({ id }) => id)),
  ]);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link
          href={`/members/${slug}#member-videos`}
          className="text-sm font-bold text-purple-400 hover:text-purple-300"
        >
          ← {dictionary.memberProfile.backToProfile}
        </Link>
        <p className="mt-9 text-sm font-bold tracking-widest text-purple-400">{member.name}</p>
        <h1 className="mt-2 text-4xl font-black md:text-6xl">{title}</h1>
        <p className="mt-4 text-zinc-400">{description}</p>

        {videos.length > 0 ? (
          <WatchVideoGrid
            videos={videos}
            eras={eras}
            savedIds={savedIds}
            collectionGradient={gradient}
            locale={locale}
            allLabel={dictionary.home.filters.all}
            videoDetails={copy.videoDetails}
            emptyEraMessage={dictionary.memberProfile.archiveEmpty}
            sortLabel={copy.sortLabel}
            newestFirst={copy.newestFirst}
            oldestFirst={copy.oldestFirst}
            campaignsLabel={copy.campaigns}
            videoSingular={copy.videoSingular}
            videoPlural={copy.videoPlural}
          />
        ) : (
          <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-8 text-zinc-400">
            {dictionary.memberProfile.archiveEmpty}
          </p>
        )}
      </section>
    </main>
  );
}

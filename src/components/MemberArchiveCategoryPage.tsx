"use client";

import Link from "next/link";

import { useLanguage } from "@/components/LanguageProvider";
import WatchVideoGrid, { type WatchEra, type WatchVideo } from "@/components/WatchVideoGrid";
import { getMemberArchiveCategory, type MemberArchiveCategory } from "@/lib/watch/member-archive-categories";

type Props = {
  slug: string;
  memberName: string;
  category: MemberArchiveCategory;
  videos: WatchVideo[];
  eras: WatchEra[];
  savedIds: string[] | null;
};

export default function MemberArchiveCategoryPage({ slug, memberName, category, videos, eras, savedIds }: Props) {
  const { locale, dictionary } = useLanguage();
  const { title, description, gradient } = getMemberArchiveCategory(category, dictionary.memberProfile);
  const copy = dictionary.watch;

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link
          href={`/members/${slug}#member-videos`}
          className="text-sm font-bold text-purple-400 hover:text-purple-300"
        >
          ← {dictionary.memberProfile.backToProfile}
        </Link>
        <p className="mt-9 text-sm font-bold tracking-widest text-purple-400">{memberName}</p>
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

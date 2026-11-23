
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { watchCollections as staticCollections } from "@/data/watch";
import { getDictionary } from "@/lib/i18n/server";

import type { Locale } from "@/lib/i18n/config";

import WatchVideoGrid, {
  type WatchEra,
  type WatchVideo,
} from "@/components/WatchVideoGrid";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const gradients: Record<string, string> = {
  "Pre-debut": "from-violet-950 via-purple-900 to-black",
  Stages: "from-red-950 via-rose-900 to-black",
  Variety: "from-blue-950 via-indigo-900 to-black",
  Behind: "from-emerald-950 via-teal-900 to-black",
  Events: "from-amber-950 via-orange-900 to-black",
  Awards: "from-fuchsia-950 via-purple-900 to-black",
};

function CollectionLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl animate-pulse">

        <div className="h-4 w-48 rounded bg-purple-400/20" />

        <div className="mt-8 h-20 max-w-2xl rounded bg-white/10" />

        <div className="mt-8 h-5 max-w-xl rounded bg-white/5" />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-xl border border-white/10"
            >
              <div className="aspect-video bg-white/10" />

              <div className="space-y-4 p-5">
                <div className="h-5 rounded bg-white/10" />
                <div className="h-12 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

export function generateStaticParams() {
  return staticCollections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default function CollectionPage({ params }: PageProps) {
  return (
    <Suspense fallback={<CollectionLoading />}>
      <CollectionContent params={params} />
    </Suspense>
  );
}

async function CollectionContent({ params }: PageProps) {
  await connection();

  const { slug } = await params;

  const { locale, dictionary } = await getDictionary();

  const copy = dictionary.watch;
  const videoCopy = dictionary.videoPage;

  const supabase = await createClient();

  // 1. Retrieve collection from Supabase.
  const {
    data: collection,
    error: collectionError,
  } = await supabase
    .from("watch_collections")
    .select(
      "id, slug, title, category, label, description, display_order"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (collectionError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl">

          <h1 className="text-2xl font-black text-red-400">
            {copy.collectionErrorTitle}
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {collectionError.message}
          </p>

        </div>
      </main>
    );
  }

  if (!collection) notFound();

  // 2. Retrieve collection relationships.
  const {
    data: relations,
    error: relationsError,
  } = await supabase
    .from("watch_video_collections")
    .select("video_id, display_order")
    .eq("collection_id", collection.id)
    .order("display_order");

  if (relationsError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">

        <h1 className="text-2xl font-black text-red-400">
          {copy.collectionVideosErrorTitle}
        </h1>

        <p className="mt-4 text-sm text-zinc-400">
          {relationsError.message}
        </p>

      </main>
    );
  }

  // 3. Retrieve published videos, including their eras.
  const videoIds = (relations ?? []).map(
    (item) => item.video_id
  );

  let videos: WatchVideo[] = [];
  let eras: WatchEra[] = [];

  if (videoIds.length > 0) {
    const {
      data: videoData,
      error: videosError,
    } = await supabase
      .from("watch_videos")
      .select(
        "id, slug, title, description, published_at, youtube_video_id, source_name, source_url, thumbnail_url, thumbnail_alt, era, era_id"
      )
      .in("id", videoIds)
      .eq("status", "published");

    if (videosError) {
      return (
        <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">

          <h1 className="text-2xl font-black text-red-400">
            {copy.videosErrorTitle}
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {videosError.message}
          </p>

        </main>
      );
    }

    const orderMap = new Map(
      (relations ?? []).map((item) => [
        item.video_id,
        item.display_order,
      ])
    );

    videos = ((videoData ?? []) as WatchVideo[]).sort(
      (a, b) =>
        (orderMap.get(a.id) ?? 0) -
        (orderMap.get(b.id) ?? 0)
    );

    const eraIds = Array.from(
      new Set(
        videos
          .map((video) => video.era_id)
          .filter((eraId): eraId is string => Boolean(eraId))
      )
    );

    if (eraIds.length > 0) {
      const { data: eraData, error: erasError } = await supabase
        .from("watch_eras")
        .select("id, name, slug, display_order, is_active")
        .in("id", eraIds)
        .order("display_order")
        .order("name");

      if (erasError) {
        // Keep the video archive usable even if era filters cannot be loaded.
        console.error("Error loading public Watch eras:", erasError.message);
      } else {
        eras = (eraData ?? []) as WatchEra[];
      }
    }
  }

  // 4. Retrieve localized collection content.
  const collectionTranslation =
    dictionary.home.collectionContent[slug];

  const localizedTitle =
    collectionTranslation?.title || collection.title;

  const localizedDescription =
    collectionTranslation?.description || collection.description;

  const categoryLabel =
    copy.categoryNames[collection.category] ||
    collection.category;

  const collectionGradient =
    gradients[collection.category] ||
    "from-zinc-800 to-black";

  const emptyEraMessage =
    locale === "pt-BR"
      ? "Nenhum vídeo encontrado para esta Era."
      : "No videos found for this era.";

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <section className="mx-auto max-w-7xl px-6 py-20">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          {locale === "pt-BR" ? "VÍDEOS" : "WATCH"} /{" "}
          {categoryLabel.toUpperCase()}
        </p>

        <h1 className="max-w-4xl text-5xl font-black md:text-7xl">
          {localizedTitle}
          <span className="text-purple-400">.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
          {localizedDescription}
        </p>

        <div className="mt-9 flex flex-wrap gap-4 border-y border-white/10 py-5">

          <span className="text-xs font-bold tracking-widest text-zinc-400">
            {String(videos.length).padStart(2, "0")}{" "}
            {copy.cataloguedVideos}
          </span>

          <span className="text-xs text-zinc-600">
            {copy.independentArchive}
          </span>

        </div>

        {videos.length > 0 ? (
          <WatchVideoGrid
            slug={slug}
            videos={videos}
            eras={eras}
            collectionGradient={collectionGradient}
            locale={locale as Locale}
            allLabel={dictionary.home.filters.all}
            noDescription={videoCopy.noDescription}
            videoDetails={copy.videoDetails}
            emptyEraMessage={emptyEraMessage}
          />
        ) : (
          <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">

            <p className="text-2xl font-black">
              {copy.archiveGrowingTitle}
            </p>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-zinc-500">
              {copy.noPublishedVideos} {copy.newEntriesSoon}
            </p>

          </div>
        )}

        <div className="mt-16">
          <Link
            href="/watch"
            className="text-sm font-bold text-zinc-400 hover:text-white"
          >
            {copy.backToWatch}
          </Link>
        </div>

      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">
        {copy.footerDisclaimer}
      </footer>

    </main>
  );
}

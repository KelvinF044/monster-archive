
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { watchCollections as staticCollections } from "@/data/watch";

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

export function generateStaticParams() {
  return staticCollections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Retrieve collection from Supabase
  const { data: collection, error: collectionError } = await supabase
    .from("watch_collections")
    .select("id, slug, title, category, label, description, display_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (collectionError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-black text-red-400">
            Unable to load collection
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            {collectionError.message}
          </p>
        </div>
      </main>
    );
  }

  if (!collection) notFound();

  // 2. Retrieve relationships
  const { data: relations, error: relationsError } = await supabase
    .from("watch_video_collections")
    .select("video_id, display_order")
    .eq("collection_id", collection.id)
    .order("display_order");

  if (relationsError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <h1 className="text-2xl font-black text-red-400">
          Unable to load collection videos
        </h1>
        <p className="mt-4 text-sm text-zinc-400">
          {relationsError.message}
        </p>
      </main>
    );
  }

  // 3. Retrieve published videos
  const videoIds = (relations ?? []).map((item) => item.video_id);

  let videos: Array<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    published_at: string | null;
    youtube_video_id: string;
    source_name: string;
    source_url: string;
  }> = [];

  if (videoIds.length > 0) {
    const { data: videoData, error: videosError } = await supabase
      .from("watch_videos")
      .select(
        "id, slug, title, description, published_at, youtube_video_id, source_name, source_url"
      )
      .in("id", videoIds)
      .eq("status", "published");

    if (videosError) {
      return (
        <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
          <h1 className="text-2xl font-black text-red-400">
            Unable to load videos
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            {videosError.message}
          </p>
        </main>
      );
    }

    const orderMap = new Map(
      relations!.map((item) => [item.video_id, item.display_order])
    );

    videos = (videoData ?? []).sort(
      (a, b) =>
        (orderMap.get(a.id) ?? 0) -
        (orderMap.get(b.id) ?? 0)
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <section className="mx-auto max-w-7xl px-6 py-20">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          WATCH / {collection.category.toUpperCase()}
        </p>

        <h1 className="max-w-4xl text-5xl font-black md:text-7xl">
          {collection.title}
          <span className="text-purple-400">.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
          {collection.description}
        </p>

        <div className="mt-9 flex flex-wrap gap-4 border-y border-white/10 py-5">
          <span className="text-xs font-bold tracking-widest text-zinc-400">
            {String(videos.length).padStart(2, "0")} CATALOGUED VIDEOS
          </span>

          <span className="text-xs text-zinc-600">
            Independent fan archive
          </span>
        </div>

        {videos.length > 0 ? (

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {videos.map((video) => (

              <Link
                key={video.id}
                href={`/watch/${slug}/${video.slug}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-purple-400/50"
              >

                <div
                  className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${
                    gradients[collection.category] || "from-zinc-800 to-black"
                  }`}
                >
                  <span className="text-6xl font-black text-white/10 transition group-hover:scale-110">
                    ▶
                  </span>

                  <span className="absolute bottom-4 left-4 text-[10px] font-bold tracking-widest text-white/70">
                    OFFICIAL VIDEO SOURCE
                  </span>
                </div>

                <div className="p-5">

                  <p className="text-[10px] font-bold tracking-widest text-purple-400">
                    {video.published_at
                      ? new Date(`${video.published_at}T00:00:00`).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "DATE NOT REGISTERED"}
                  </p>

                  <h2 className="mt-3 text-lg font-black leading-snug">
                    {video.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {video.description}
                  </p>

                  <div className="mt-5 border-t border-white/10 pt-4 text-xs font-bold text-purple-400">
                    WATCH DETAILS ↗
                  </div>

                </div>

              </Link>

            ))}

          </div>

        ) : (

          <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">

            <p className="text-2xl font-black">
              The archive is growing.
            </p>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-zinc-500">
              No published videos have been catalogued in this collection yet.
              New entries will be added as the archive develops.
            </p>

          </div>

        )}

        <div className="mt-16">
          <Link
            href="/watch"
            className="text-sm font-bold text-zinc-400 hover:text-white"
          >
            ← BACK TO WATCH
          </Link>
        </div>

      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">
        MONSTER ARCHIVE · Independent fan-made project
      </footer>

    </main>
  );
}


import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import YouTubePlayer from "@/components/YouTubePlayer";
import { watchVideos } from "@/data/watch";

type PageProps = {
  params: Promise<{
    slug: string;
    videoSlug: string;
  }>;
};

// Mantemos os slugs conhecidos para validação
// das rotas dinâmicas pelo Next.js.
export function generateStaticParams({
  params,
}: {
  params: { slug: string };
}) {
  const videos = watchVideos
    .filter((video) => video.collectionSlug === params.slug)
    .map((video) => ({
      videoSlug: video.slug,
    }));

  return videos.length > 0
    ? videos
    : [{ videoSlug: "__no-video-yet__" }];
}

export default async function VideoPage({ params }: PageProps) {
  const { slug, videoSlug } = await params;

  const supabase = await createClient();

  // 1. Buscar a coleção no Supabase
  const { data: collection, error: collectionError } = await supabase
    .from("watch_collections")
    .select("id, slug, title")
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

  // 2. Buscar o vídeo pelo slug
  const { data: video, error: videoError } = await supabase
    .from("watch_videos")
    .select(`
      id,
      slug,
      title,
      description,
      published_at,
      youtube_video_id,
      source_name,
      source_url
    `)
    .eq("slug", videoSlug)
    .eq("status", "published")
    .maybeSingle();

  if (videoError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-black text-red-400">
            Unable to load video
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            {videoError.message}
          </p>
        </div>
      </main>
    );
  }

  if (!video) notFound();

  // 3. Confirmar que o vídeo pertence à coleção acessada
  const { data: relationship, error: relationshipError } = await supabase
    .from("watch_video_collections")
    .select("video_id")
    .eq("video_id", video.id)
    .eq("collection_id", collection.id)
    .maybeSingle();

  if (relationshipError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-black text-red-400">
            Unable to verify video collection
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            {relationshipError.message}
          </p>
        </div>
      </main>
    );
  }

  if (!relationship) notFound();

  // 4. Formatar a data
  const formattedDate = video.published_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${video.published_at}T00:00:00Z`))
    : "DATE NOT REGISTERED";

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <section className="mx-auto max-w-6xl px-6 py-14">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          MONSTER ARCHIVE / WATCH
        </p>

        <h1 className="mb-8 text-3xl font-black leading-tight md:text-5xl">
          {video.title}
        </h1>

        {/* YOUTUBE PLAYER */}

        <YouTubePlayer
          videoId={video.youtube_video_id}
          title={video.title}
          expectedPath={`/watch/${slug}/${videoSlug}`}
        />

        {/* VIDEO INFORMATION */}

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">

          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-purple-400">
              ABOUT THIS VIDEO
            </p>

            <h2 className="mt-4 text-2xl font-black">
              {video.title}
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-400">
              {video.description || "No description available."}
            </p>
          </div>

          <aside className="h-fit rounded-xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs font-bold tracking-widest text-zinc-500">
              VIDEO INFORMATION
            </p>

            <div className="mt-6 space-y-5">

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  PUBLICATION DATE
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {formattedDate}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  ORIGINAL SOURCE
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {video.source_name}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  ARCHIVE STATUS
                </p>

                <p className="mt-2 text-sm font-semibold text-green-400">
                  Published
                </p>
              </div>

            </div>

            <a
              href={video.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-lg bg-white px-5 py-4 text-center text-xs font-black text-black transition hover:bg-purple-200"
            >
              WATCH ORIGINAL ON YOUTUBE ↗
            </a>

          </aside>

        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <Link
            href={`/watch/${slug}`}
            className="text-sm font-bold text-zinc-400 hover:text-white"
          >
            ← BACK TO COLLECTION
          </Link>
        </div>

      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">
        MONSTER ARCHIVE · Independent fan-made project
      </footer>

    </main>
  );
}

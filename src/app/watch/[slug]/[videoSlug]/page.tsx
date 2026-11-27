
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FavoriteButton from "@/components/FavoriteButton";
import { getFavoriteVideoIds } from "@/lib/favorites/data";
import { favoritesMessages } from "@/lib/favorites/messages";
import { getSessionClaims } from "@/lib/auth/session";
import YouTubePlayer from "@/components/YouTubePlayer";
import { watchVideos } from "@/data/watch";
import { connection } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

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

function formatLocalizedDate(
  value: string | null,
  locale: Locale
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "pt-BR" ? "pt-BR" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

export default async function VideoPage({ params }: PageProps) {
  await connection();

  const { slug, videoSlug } = await params;

  const { locale, dictionary } = await getDictionary();
  const copy = dictionary.videoPage;

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
            {copy.videoErrorTitle}
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
            {copy.relationshipErrorTitle}
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {relationshipError.message}
          </p>
        </div>
      </main>
    );
  }

  if (!relationship) notFound();

  const [claims, savedIds] = await Promise.all([getSessionClaims(), getFavoriteVideoIds([video.id])]);
  const favoriteCopy = favoritesMessages(locale);
  const watchPath = `/watch/${slug}/${videoSlug}`;

  // 4. Formatar a data no idioma selecionado
  const formattedDate = formatLocalizedDate(
    video.published_at,
    locale
  );

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <section className="mx-auto max-w-6xl px-6 py-14">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          {copy.archiveLabel}
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black leading-tight md:text-5xl">{video.title}</h1>
          {savedIds ? (
            <FavoriteButton videoId={video.id} title={video.title} saved={savedIds.includes(video.id)} />
          ) : !claims ? (
            <Link href={`/login?next=${encodeURIComponent(watchPath)}`} prefetch={false} className="inline-flex min-h-10 items-center rounded-lg border border-purple-400/35 px-3.5 text-sm font-semibold text-purple-200 hover:bg-purple-500/15 focus-visible:outline-2 focus-visible:outline-purple-400">
              {favoriteCopy.login}
            </Link>
          ) : (
            <p className="text-sm text-zinc-400">{favoriteCopy.loadError}</p>
          )}
        </div>

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
              {copy.aboutVideo}
            </p>

            <h2 className="mt-4 text-2xl font-black">
              {video.title}
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-400">
              {video.description || copy.noDescription}
            </p>
          </div>

          <aside className="h-fit rounded-xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs font-bold tracking-widest text-zinc-500">
              {copy.videoInformation}
            </p>

            <div className="mt-6 space-y-5">

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  {copy.publicationDate}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {formattedDate}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  {copy.originalSource}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {video.source_name}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  {copy.archiveStatus}
                </p>

                <p className="mt-2 text-sm font-semibold text-green-400">
                  {copy.published}
                </p>
              </div>

            </div>

            <a
              href={video.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-lg bg-white px-5 py-4 text-center text-xs font-black text-black transition hover:bg-purple-200"
            >
              {copy.watchOriginal}
            </a>

          </aside>

        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <Link
            href={`/watch/${slug}`}
            className="text-sm font-bold text-zinc-400 hover:text-white"
          >
            {copy.backToCollection}
          </Link>
        </div>

      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">
        {copy.footerDisclaimer}
      </footer>

    </main>
  );
}

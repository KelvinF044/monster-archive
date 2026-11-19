
import Link from "next/link";
import { notFound } from "next/navigation";
import { watchVideos } from "@/data/watch";

type PageProps = {
  params: Promise<{
    slug: string;
    videoSlug: string;
  }>;
};


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

  // O Next.js 16 exige pelo menos um parâmetro
  // para validar cada coleção durante a pré-renderização.
  // Coleções vazias recebem um parâmetro técnico.
  // A página utiliza notFound() para não exibir
  // esse endereço como se fosse um vídeo real.
  return videos.length > 0
    ? videos
    : [{ videoSlug: "__no-video-yet__" }];
}


export default async function VideoPage({ params }: PageProps) {
  const { slug, videoSlug } = await params;

  const video = watchVideos.find(
    (item) =>
      item.collectionSlug === slug &&
      item.slug === videoSlug
  );

  if (!video) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link href="/" className="text-2xl font-black tracking-[0.18em]">
            MONSTER<span className="text-purple-400">.</span>
          </Link>

          <Link
            href={`/watch/${slug}`}
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back to Collection
          </Link>

        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">

        <p className="mb-5 text-xs font-bold tracking-[0.3em] text-purple-400">
          MONSTER ARCHIVE / WATCH
        </p>

        <h1 className="mb-8 text-3xl font-black leading-tight md:text-5xl">
          {video.title}
        </h1>

        {/* VIDEO PLAYER */}

        <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">

          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />

        </div>

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
              {video.description}
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
                  {video.publishedAt}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  ORIGINAL SOURCE
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {video.sourceName}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-600">
                  ARCHIVE STATUS
                </p>

                <p className="mt-2 text-sm font-semibold text-green-400">
                  Source registered
                </p>
              </div>

            </div>

            <a
              href={video.sourceUrl}
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

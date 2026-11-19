
import Link from "next/link";
import { notFound } from "next/navigation";
import { watchCollections, watchVideos } from "@/data/watch";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return watchCollections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  const collection = watchCollections.find(
    (item) => item.slug === slug
  );

  if (!collection) {
    notFound();
  }

  const videos = watchVideos.filter(
    (video) => video.collectionSlug === slug
  );

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-[0.18em]">
            MONSTER<span className="text-purple-400">.</span>
          </Link>

          <Link href="/watch" className="text-sm text-zinc-400 hover:text-white">
            ← All Collections
          </Link>
        </div>
      </header>

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
                key={video.slug}
                href={`/watch/${slug}/${video.slug}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-purple-400/50"
              >

                <div className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${video.gradient}`}>
                  <span className="text-6xl font-black text-white/10 transition group-hover:scale-110">
                    ▶
                  </span>

                  <span className="absolute bottom-4 left-4 text-[10px] font-bold tracking-widest text-white/70">
                    OFFICIAL VIDEO SOURCE
                  </span>
                </div>

                <div className="p-5">

                  <p className="text-[10px] font-bold tracking-widest text-purple-400">
                    {video.publishedAt}
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
              No videos have been catalogued in this collection yet.
              New entries will be added as they are verified.
            </p>

          </div>

        )}

        <div className="mt-16">
          <Link href="/watch" className="text-sm font-bold text-zinc-400 hover:text-white">
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

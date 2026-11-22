
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";

import HomeCatalog, {
  type HomeCollection,
} from "@/components/HomeCatalog";

import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

function HomeFallback() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <section className="min-h-[650px] overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#151020] via-[#0c0c12] to-[#08090d] px-6 py-28 md:min-h-[760px] md:py-36">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-3 w-64 rounded bg-white/10" />

          <div className="h-28 max-w-4xl rounded bg-white/5" />

          <div className="mt-8 h-5 max-w-xl rounded bg-white/10" />

          <div className="mt-10 flex gap-4">
            <div className="h-14 w-48 rounded bg-white/10" />
            <div className="h-14 w-44 rounded bg-white/5" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  // Os dados dinâmicos são acessados dentro deste componente,
  // protegido pelo Suspense da página.
  await connection();

  const [{ dictionary }, supabase] = await Promise.all([
    getDictionary(),
    createClient(),
  ]);

  const home = dictionary.home;

  // Consultas independentes executadas em paralelo.
  const [heroResult, collectionsResult] = await Promise.all([
    supabase
      .from("site_assets")
      .select("image_url")
      .eq("asset_key", "home_hero")
      .maybeSingle(),

    supabase
      .from("watch_collections")
      .select(`
        id,
        slug,
        title,
        category,
        label,
        description,
        display_order,
        cover_image_url,
        cover_image_alt
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  if (heroResult.error) {
    console.error(
      "Error loading Home image:",
      heroResult.error.message
    );
  }

  if (collectionsResult.error) {
    console.error(
      "Error loading Home collections:",
      collectionsResult.error.message
    );
  }

  const heroImage = heroResult.data?.image_url ?? null;

  const collections = (collectionsResult.data ?? []) as HomeCollection[];

  const collectionsError = Boolean(collectionsResult.error);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* HERO */}

      <section className="relative min-h-[650px] overflow-hidden border-b border-white/10 md:min-h-[760px]">

        {/* RESPONSIVE BACKGROUND IMAGE
            Mobile: image stays behind the text in a 4:3 area.
            Desktop: image covers the entire Hero.
            The image does not add a separate block to mobile layout.
        */}

        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#151020] via-[#0c0c12] to-[#08090d] md:inset-0 md:aspect-auto">

          {heroImage ? (
            <Image
              src={heroImage}
              alt={home.heroImageAlt}
              fill
              sizes="100vw"
              quality={65}
              fetchPriority="high"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#151020] via-[#0c0c12] to-[#08090d]" />
          )}

          {/* IMAGE FADE INTO THE DARK BACKGROUND */}

          <div className="absolute inset-0 bg-gradient-to-b from-[#08090d]/10 via-[#08090d]/25 to-[#08090d] md:bg-gradient-to-t md:from-[#08090d]/85 md:via-transparent md:to-[#08090d]/15" />

        </div>

        {/* IMAGE DARKNESS */}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08090d]/65 via-[#08090d]/35 to-[#08090d]/20 md:from-[#08090d]/85 md:via-[#08090d]/55 md:to-[#08090d]/20" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090d]/45 via-transparent to-transparent" />

        {/* PURPLE LIGHT EFFECTS */}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(124,58,237,0.22),transparent_55%)]" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(88,28,135,0.15),transparent_50%)]" />

        {/* HERO CONTENT */}

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-12 md:py-36">

          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-10 bg-purple-400" />

            <span className="text-xs font-bold tracking-[0.3em] text-purple-300">
              {home.heroEyebrow}
            </span>
          </div>

          <h1 className="max-w-4xl text-[clamp(1.9rem,8.5vw,3rem)] font-black leading-[1.05] tracking-tight sm:text-5xl md:text-7xl lg:text-8xl">
            {home.heroLine1}
            <br />
            {home.heroLine2}
            <br />

            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-400 to-white bg-clip-text text-transparent">
              {home.heroLine3}
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-sm leading-7 text-zinc-300 md:mt-8 md:text-lg md:text-zinc-400">
            {home.heroDescription}
          </p>

          {/* HERO BUTTONS */}

          <div className="mt-8 flex flex-wrap gap-3 md:mt-10 md:gap-4">
            <a
              href="#watch"
              className="rounded-lg bg-white px-6 py-3.5 text-xs font-bold text-black transition hover:bg-purple-200 sm:px-7 sm:py-4 sm:text-sm"
            >
              {home.exploreArchive}
            </a>

            <a
              href="#about"
              className="rounded-lg border border-white/30 bg-black/10 px-6 py-3.5 text-xs font-bold text-white transition hover:bg-white/10 sm:px-7 sm:py-4 sm:text-sm"
            >
              {home.aboutProject}
            </a>
          </div>

          {/* RESPONSIVE ARCHIVE STATS */}

          <div className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-2 border-t border-white/10 pt-6 sm:gap-6 md:mt-20 md:pt-7">

            <div className="min-w-0">
              <p className="text-xl font-black leading-none sm:text-2xl">
                07
              </p>

              <p className="mt-2 break-words text-[9px] leading-tight text-zinc-400 sm:text-xs">
                {home.membersStat}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xl font-black leading-none sm:text-2xl">
                ∞
              </p>

              <p className="mt-2 break-words text-[9px] leading-tight text-zinc-400 sm:text-xs">
                {home.memoriesStat}
              </p>
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[clamp(0.875rem,4vw,1.5rem)] font-black leading-none tracking-tight">
                {home.communityValue}
              </p>

              <p className="mt-2 break-words text-[9px] leading-tight text-zinc-400 sm:text-xs">
                {home.communityStat}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* INTERACTIVE COLLECTION CATALOG */}

      <HomeCatalog
        collections={collections}
        collectionsError={collectionsError}
        home={home}
      />

      {/* ABOUT */}

      <section
        id="about"
        className="border-t border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
            {home.aboutEyebrow}
          </p>

          <h2 className="mt-5 text-3xl font-black md:text-5xl">
            {home.aboutTitle}
            <br />

            <span className="text-zinc-500">
              {home.aboutSubtitle}
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500">
            {home.aboutDescription}
          </p>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
          <span className="font-black tracking-widest">
            MONSTER ARCHIVE
          </span>

          <span>
            {home.footerDisclaimer}
          </span>
        </div>
      </footer>

    </main>
  );
}

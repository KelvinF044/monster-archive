
"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";

type HomeHeroProps = {
  heroImage: string | null;
};

export default function HomeHero({ heroImage }: HomeHeroProps) {
  const { dictionary } = useLanguage();
  const home = dictionary.home;

  return (
    <section className="relative min-h-[650px] overflow-hidden border-b border-white/10 md:min-h-[760px]">

      {/* RESPONSIVE BACKGROUND IMAGE */}

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

        {/* IMAGE FADE */}

        <div className="absolute inset-0 bg-gradient-to-b from-[#08090d]/10 via-[#08090d]/25 to-[#08090d] md:bg-gradient-to-t md:from-[#08090d]/85 md:via-transparent md:to-[#08090d]/15" />

      </div>

      {/* DARK OVERLAYS */}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08090d]/65 via-[#08090d]/35 to-[#08090d]/20 md:from-[#08090d]/85 md:via-[#08090d]/55 md:to-[#08090d]/20" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08090d]/45 via-transparent to-transparent" />

      {/* PURPLE EFFECTS */}

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

        {/* ARCHIVE STATS */}

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
  );
}

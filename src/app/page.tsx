
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

type Collection = {
  id: string;
  slug: string;
  title: string;
  category: string;
  label: string | null;
  description: string;
  display_order: number;
  cover_image_url: string | null;
  cover_image_alt: string | null;
};

const gradients: Record<string, string> = {
  "Pre-debut": "from-violet-950 via-purple-900 to-black",
  Stages: "from-red-950 via-rose-900 to-black",
  Variety: "from-blue-950 via-indigo-900 to-black",
  Behind: "from-emerald-950 via-teal-900 to-black",
  Events: "from-amber-950 via-orange-900 to-black",
  Awards: "from-fuchsia-950 via-purple-900 to-black",
};

export default function Home() {
  const { dictionary } = useLanguage();
  const home = dictionary.home;

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState(false);

  const categories = [
    { value: "All", label: home.filters.all },
    { value: "Pre-debut", label: home.filters.preDebut },
    { value: "Stages", label: home.filters.stages },
    { value: "Variety", label: home.filters.variety },
    { value: "Behind", label: home.filters.behind },
    { value: "Events", label: home.filters.events },
    { value: "Awards", label: home.filters.awards },
  ];

  function getCategoryLabel(value: string) {
    return (
      categories.find((item) => item.value === value)?.label ?? value
    );
  }

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      try {
        const supabase = createClient();

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

        if (!active) return;

        if (heroResult.error) {
          console.error(
            "Error loading Home image:",
            heroResult.error.message
          );
        } else {
          setHeroImage(heroResult.data?.image_url ?? null);
        }

        if (collectionsResult.error) {
          console.error(
            "Error loading Home collections:",
            collectionsResult.error.message
          );

          setCollectionsError(true);
          setCollections([]);
        } else {
          setCollections(
            (collectionsResult.data ?? []) as Collection[]
          );

          setCollectionsError(false);
        }
      } catch (error) {
        console.error("Error loading Home data:", error);

        if (active) {
          setCollectionsError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      active = false;
    };
  }, []);

  // FILTER COLLECTIONS

  const filteredCollections = collections.filter((item) => {
    const matchesCategory =
      category === "All" || item.category === category;

    const translated = home.collectionContent[item.slug];

    const searchText = [
      item.title,
      item.description,
      item.category,
      item.label ?? "",
      translated?.title ?? "",
      translated?.description ?? "",
      translated?.label ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(
      search.trim().toLowerCase()
    );

    return matchesCategory && matchesSearch;
  });

  const selectedCategoryLabel = getCategoryLabel(category);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* HERO */}

      <section className="relative overflow-hidden border-b border-white/10">

        {/* RESPONSIVE HERO IMAGE
            The image area is always reserved to prevent CLS.
            The background remains visible while Supabase loads the URL.
        */}

        <div className="relative mb-8 aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#151020] via-[#0c0c12] to-[#08090d] md:absolute md:inset-0 md:mb-0 md:aspect-auto">

          {heroImage ? (
            <Image
              src={heroImage}
              alt={home.heroImageAlt}
              fill
              sizes="100vw"
              quality={65}
              fetchPriority="high"
              className="object-contain md:object-cover md:object-center 2xl:object-[center_15%]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[#151020] via-[#0c0c12] to-[#08090d]"
            />
          )}

          {/* MOBILE IMAGE GRADIENT */}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#08090d] to-transparent md:hidden" />

        </div>

        {/* DARK OVERLAYS */}

        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d]/85 via-[#08090d]/55 to-[#08090d]/20" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d]/85 via-transparent to-[#08090d]/15" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(124,58,237,0.22),transparent_55%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(88,28,135,0.15),transparent_50%)]" />

        {/* HERO CONTENT */}

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-0 pb-12 md:py-36">

          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-10 bg-purple-400" />

            <span className="text-xs font-bold tracking-[0.3em] text-purple-300">
              {home.heroEyebrow}
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
            {home.heroLine1}
            <br />
            {home.heroLine2}
            <br />

            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-400 to-white">
              {home.heroLine3}
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-7 text-zinc-400 md:text-lg">
            {home.heroDescription}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#watch"
              className="rounded-lg bg-white px-7 py-4 text-sm font-bold text-black transition hover:bg-purple-200"
            >
              {home.exploreArchive}
            </a>

            <a
              href="#about"
              className="rounded-lg border border-white/20 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              {home.aboutProject}
            </a>
          </div>

          {/* RESPONSIVE ARCHIVE STATS */}

          <div className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-2 border-t border-white/10 pt-7 sm:gap-6">

            <div className="min-w-0">
              <p className="text-xl font-black leading-none sm:text-2xl">
                07
              </p>

              <p className="mt-2 break-words text-[9px] leading-tight text-zinc-500 sm:text-xs">
                {home.membersStat}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xl font-black leading-none sm:text-2xl">
                ∞
              </p>

              <p className="mt-2 break-words text-[9px] leading-tight text-zinc-500 sm:text-xs">
                {home.memoriesStat}
              </p>
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-[clamp(0.875rem,4vw,1.5rem)] font-black leading-none tracking-tight">
                {home.communityValue}
              </p>

              <p className="mt-2 break-words text-[9px] leading-tight text-zinc-500 sm:text-xs">
                {home.communityStat}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CONTENT CATALOG */}

      <section
        id="watch"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-purple-400">
              {home.discoverEyebrow}
            </p>

            <h2 className="text-3xl font-black md:text-4xl">
              {home.catalogTitle}
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              {home.catalogDescription}
            </p>
          </div>

          <div className="w-full md:w-72">
            <input
              type="search"
              placeholder={home.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-purple-400"
            />
          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-9 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.value}
              onClick={() => setCategory(item.value)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition ${
                category === item.value
                  ? "bg-purple-500 text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* COLLECTION COUNT */}

        <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">
          <span className="text-xs font-bold tracking-widest text-zinc-300">
            {selectedCategoryLabel.toUpperCase()}{" "}
            {home.collectionPlural}
          </span>

          <span className="text-xs text-zinc-500">
            {String(filteredCollections.length).padStart(2, "0")}{" "}
            {home.collectionPlural}
          </span>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-[16/10] bg-white/5" />

                <div className="space-y-4 p-5">
                  <div className="h-3 w-1/3 rounded bg-white/10" />
                  <div className="h-5 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : collectionsError ? (
          <div className="rounded-xl border border-red-500/20 bg-white/[0.03] px-6 py-16 text-center">
            <p className="text-xl font-bold text-red-400">
              {home.errorTitle}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {home.errorDescription}
            </p>
          </div>
        ) : filteredCollections.length > 0 ? (

          /* DATABASE COLLECTIONS */

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {filteredCollections.map((item) => {
              const translated = home.collectionContent[item.slug];

              const title = translated?.title ?? item.title;

              const label =
                translated?.label ??
                item.label ??
                getCategoryLabel(item.category);

              const description =
                translated?.description ?? item.description;

              return (
                <Link
                  key={item.id}
                  href={`/watch/${item.slug}`}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-purple-400/50"
                >

                  {/* COLLECTION IMAGE */}

                  <div
                    className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br ${
                      gradients[item.category] || "from-zinc-800 to-black"
                    }`}
                  >
                    {item.cover_image_url ? (
                      <Image
                        src={item.cover_image_url}
                        alt={item.cover_image_alt || title}
                        fill
                        quality={65}
                        sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc((100vw - 4.25rem) / 2), (max-width: 1279px) calc((100vw - 5.5rem) / 3), 397px"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <span className="text-7xl font-black tracking-tighter text-white/10 transition duration-500 group-hover:scale-110">
                          {String(item.display_order).padStart(2, "0")}
                        </span>

                        <span className="absolute left-5 top-5 text-xs font-bold tracking-[0.3em] text-white/60">
                          MONSTER ARCHIVE
                        </span>
                      </>
                    )}

                    {/* IMAGE OVERLAY */}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/10 transition group-hover:from-black/45" />

                    {/* CATEGORY */}

                    <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {getCategoryLabel(item.category)}
                    </span>

                    <span className="absolute bottom-5 left-5 text-xs font-bold tracking-[0.3em] text-white/90">
                      BABYMONSTER ARCHIVE
                    </span>
                  </div>

                  {/* COLLECTION INFORMATION */}

                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-purple-400">
                      {label}
                      <span className="text-zinc-700">/</span>
                      {getCategoryLabel(item.category)}
                    </div>

                    <h3 className="text-lg font-black tracking-wide">
                      {title}
                    </h3>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">
                      {description}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                        {home.collectionSingular}
                      </span>

                      <span className="text-xs font-bold text-purple-400">
                        {home.explore}
                      </span>
                    </div>
                  </div>

                </Link>
              );
            })}

          </div>
        ) : (

          /* EMPTY RESULTS */

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <p className="text-xl font-bold">
              {home.noContentTitle}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {home.noContentDescription}
            </p>

            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-6 rounded-lg bg-purple-500 px-6 py-3 text-xs font-bold transition hover:bg-purple-400"
            >
              {home.clearFilters}
            </button>
          </div>
        )}

      </section>

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

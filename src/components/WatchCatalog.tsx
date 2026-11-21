
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

type Props = {
  collections: Collection[];
};

/* COLLECTION COVER */

function CollectionCover({
  item,
  categoryLabel,
  localizedTitle,
}: {
  item: Collection;
  categoryLabel: string;
  localizedTitle: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage =
    Boolean(item.cover_image_url) && !imageFailed;

  const gradients: Record<string, string> = {
    "Pre-debut": "from-violet-950 via-purple-900 to-black",
    Stages: "from-red-950 via-rose-900 to-black",
    Variety: "from-blue-950 via-indigo-900 to-black",
    Behind: "from-emerald-950 via-teal-900 to-black",
    Events: "from-amber-950 via-orange-900 to-black",
    Awards: "from-fuchsia-950 via-purple-900 to-black",
  };

  const gradient =
    gradients[item.category] || "from-zinc-800 to-black";

  return (
    <div
      className={`group relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      {hasImage ? (
        <>
          <Image
            src={item.cover_image_url ?? ""}
            alt={item.cover_image_alt || localizedTitle}
            fill
            sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc((100vw - 4.5rem) / 2), (max-width: 1279px) calc((100vw - 4rem) / 3), 394px"
            quality={85}
            onError={() => setImageFailed(true)}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* IMAGE OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/15 transition-opacity duration-300 group-hover:opacity-75" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />

          <span
            aria-hidden="true"
            className="relative text-8xl font-black tracking-tighter text-white/10 transition duration-500 group-hover:scale-110"
          >
            {String(item.display_order).padStart(2, "0")}
          </span>

          <span className="absolute left-5 top-5 text-[10px] font-bold tracking-[0.25em] text-white/60">
            MONSTER ARCHIVE
          </span>
        </>
      )}

      {/* CATEGORY */}

      <span className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-[10px] font-bold tracking-widest text-white backdrop-blur-sm">
        {categoryLabel.toUpperCase()}
      </span>
    </div>
  );
}

export default function WatchCatalog({ collections }: Props) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { dictionary, locale } = useLanguage();

  const copy = dictionary.watch;

  const categories = [
    { value: "All", label: copy.filters.all },
    { value: "Pre-debut", label: copy.filters.preDebut },
    { value: "Stages", label: copy.filters.stages },
    { value: "Variety", label: copy.filters.variety },
    { value: "Behind", label: copy.filters.behind },
    { value: "Events", label: copy.filters.events },
    { value: "Awards", label: copy.filters.awards },
  ];

  function getCollectionTranslation(item: Collection) {
    return dictionary.home.collectionContent[item.slug];
  }

  function getCategoryLabel(value: string) {
    return copy.categoryNames[value] || value;
  }

  const filteredCollections = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase(locale);

    return collections.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;

      const translation =
        dictionary.home.collectionContent[item.slug];

      const searchableContent = [
        item.title,
        item.description,
        item.category,
        item.label ?? "",
        translation?.title ?? "",
        translation?.label ?? "",
        translation?.description ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase(locale);

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [collections, category, search, dictionary, locale]);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(124,58,237,0.25),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-10 bg-purple-400" />

            <span className="text-xs font-bold tracking-[0.3em] text-purple-300">
              {copy.heroEyebrow}
            </span>
          </div>

          {/* RESPONSIVE HERO TITLE */}

          <h1 className="w-full max-w-4xl text-[clamp(1.75rem,8.5vw,3.75rem)] font-black leading-[0.98] tracking-tight sm:text-6xl md:text-8xl">
            <span className="block max-w-full break-words">
              {copy.heroTitleLine1}
            </span>

            <span className="block max-w-full break-words bg-gradient-to-r from-purple-300 via-fuchsia-400 to-white bg-clip-text text-transparent">
              {copy.heroTitleLine2}
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
            {copy.heroDescription}
          </p>

          <a
            href="#catalog"
            className="mt-10 inline-block rounded-lg bg-white px-7 py-4 text-sm font-bold text-black transition hover:bg-purple-200"
          >
            {copy.exploreCatalogue}
          </a>
        </div>
      </section>

      {/* CATALOGUE */}

      <section
        id="catalog"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-purple-400">
              {copy.discoverEyebrow}
            </p>

            <h2 className="text-3xl font-black md:text-4xl">
              {copy.catalogTitle}
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              {copy.catalogDescription}
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="search"
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-purple-400"
            />
          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={`rounded-full px-5 py-3 text-xs font-bold transition ${
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
            {copy.collectionHeaders[category] ||
              copy.collectionHeaders.All}
          </span>

          <span className="text-xs text-zinc-500">
            {String(filteredCollections.length).padStart(2, "0")}{" "}
            {copy.collectionPlural}
          </span>
        </div>

        {/* DATABASE RESULTS */}

        {filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {filteredCollections.map((item) => {
              const translation =
                getCollectionTranslation(item);

              const localizedTitle =
                translation?.title || item.title;

              const localizedDescription =
                translation?.description || item.description;

              const localizedLabel =
                translation?.label ||
                item.label ||
                getCategoryLabel(item.category);

              return (
                <Link
                  key={item.id}
                  href={`/watch/${item.slug}`}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-purple-400/50"
                >

                  {/* COLLECTION IMAGE */}

                  <CollectionCover
                    item={item}
                    categoryLabel={getCategoryLabel(item.category)}
                    localizedTitle={localizedTitle}
                  />

                  {/* COLLECTION INFORMATION */}

                  <div className="p-6">
                    <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-purple-400">
                      {localizedLabel}
                    </p>

                    <h3 className="text-xl font-black tracking-wide">
                      {localizedTitle}
                    </h3>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-500">
                      {localizedDescription}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                        {copy.collectionSingular}
                      </span>

                      <span className="text-xs font-bold text-purple-400">
                        {copy.explore}
                      </span>
                    </div>
                  </div>

                </Link>
              );
            })}

          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <p className="text-xl font-bold">
              {copy.noCollectionsTitle}
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {copy.noCollectionsDescription}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-6 rounded-lg bg-purple-500 px-6 py-3 text-xs font-bold"
            >
              {copy.clearFilters}
            </button>
          </div>
        )}
      </section>

      {/* INFORMATION */}

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
            {copy.informationEyebrow}
          </p>

          <h2 className="mt-5 text-3xl font-black md:text-4xl">
            {copy.informationTitle}
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-500">
            {copy.informationDescription}
          </p>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">
        {copy.footerDisclaimer}
      </footer>

    </main>
  );
}

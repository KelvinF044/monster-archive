
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Dictionary } from "@/lib/i18n/messages";

export type HomeCollection = {
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

type HomeDictionary = Dictionary["home"];

type HomeCatalogProps = {
  collections: HomeCollection[];
  collectionsError: boolean;
  home: HomeDictionary;
};

const gradients: Record<string, string> = {
  "Pre-debut": "from-violet-950 via-purple-900 to-black",
  Stages: "from-red-950 via-rose-900 to-black",
  Variety: "from-blue-950 via-indigo-900 to-black",
  Behind: "from-emerald-950 via-teal-900 to-black",
  Events: "from-amber-950 via-orange-900 to-black",
  Awards: "from-fuchsia-950 via-purple-900 to-black",
};

export default function HomeCatalog({
  collections,
  collectionsError,
  home,
}: HomeCatalogProps) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

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
            type="button"
            aria-pressed={category === item.value}
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

      {/* ERROR STATE */}

      {collectionsError ? (
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
            type="button"
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
  );
}

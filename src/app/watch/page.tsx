
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  watchCategories,
  watchCollections,
} from "@/data/watch";

export default function WatchPage() {
  const [category, setCategory] =
    useState<(typeof watchCategories)[number]>("All");

  const [search, setSearch] = useState("");

  const filteredCollections = useMemo(() => {
    return watchCollections.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;

      const matchesSearch =
        `${item.title} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <main className="min-h-screen bg-[#08090d] text-white">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(124,58,237,0.25),transparent_55%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(88,28,135,0.15),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">

          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-10 bg-purple-400" />

            <span className="text-xs font-bold tracking-[0.3em] text-purple-300">
              THE BABYMONSTER VIDEO ARCHIVE
            </span>
          </div>

          <h1 className="max-w-4xl text-6xl font-black leading-none tracking-tight md:text-8xl">
            WATCH
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-400 to-white bg-clip-text text-transparent">
              EVERY MOMENT.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
            Explore performances, music shows, variety programs,
            interviews and unforgettable moments from the
            BABYMONSTER journey.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#catalog"
              className="rounded-lg bg-white px-7 py-4 text-sm font-bold text-black transition hover:bg-purple-200"
            >
              EXPLORE CATALOGUE →
            </a>

            <Link
              href="/members"
              className="rounded-lg border border-white/20 px-7 py-4 text-sm font-bold transition hover:bg-white/10"
            >
              MEET THE MEMBERS
            </Link>
          </div>

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
              DISCOVER THE ARCHIVE
            </p>

            <h2 className="text-3xl font-black md:text-4xl">
              Explore collections
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              Find your favorite BABYMONSTER moments.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="search"
              placeholder="Search the archive..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-purple-400"
            />
          </div>

        </div>

        {/* CATEGORY FILTERS */}
        <div className="mb-10 flex flex-wrap gap-2">

          {watchCategories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-5 py-3 text-xs font-bold transition ${
                category === item
                  ? "bg-purple-500 text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        {/* RESULTS INFO */}
        <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">

          <span className="text-xs font-bold tracking-widest text-zinc-300">
            {category.toUpperCase()} COLLECTIONS
          </span>

          <span className="text-xs text-zinc-500">
            {String(filteredCollections.length).padStart(2, "0")} COLLECTIONS
          </span>

        </div>

        {/* COLLECTION CARDS */}
        {filteredCollections.length > 0 ? (

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {filteredCollections.map((item) => (

              <Link
                href={`/watch/${item.slug}`}
                key={item.slug}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-purple-400/50"
              >

                <div
                  className={`relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br ${item.gradient}`}
                >

                  <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/5" />

                  <span className="relative text-8xl font-black tracking-tighter text-white/10 transition duration-500 group-hover:scale-110">
                    {item.number}
                  </span>

                  <span className="absolute left-5 top-5 text-[10px] font-bold tracking-[0.25em] text-white/60">
                    MONSTER ARCHIVE
                  </span>

                  <span className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-[10px] font-bold tracking-widest">
                    {item.category.toUpperCase()}
                  </span>

                </div>

                <div className="p-6">

                  <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-purple-400">
                    {item.label}
                  </p>

                  <h3 className="text-xl font-black tracking-wide">
                    {item.title}
                  </h3>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-500">
                    {item.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">

                    <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                      COLLECTION
                    </span>

                    <span className="text-xs font-bold text-purple-400">
                      CATALOGUING IN PROGRESS
                    </span>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        ) : (

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">

            <p className="text-xl font-bold">
              No collections found.
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              Try another search or category.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-6 rounded-lg bg-purple-500 px-6 py-3 text-xs font-bold"
            >
              CLEAR FILTERS
            </button>

          </div>

        )}

      </section>

      {/* INFORMATION */}
      <section className="border-t border-white/10 bg-white/[0.02]">

        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
            MADE FOR THE FANS
          </p>

          <h2 className="mt-5 text-3xl font-black md:text-4xl">
            Every performance deserves a place.
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-500">
            The archive organizes information and references
            to BABYMONSTER content. Videos will be displayed
            through authorized original sources, rather than
            redistributed by this platform.
          </p>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8">

        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-xs text-zinc-600">

          <span className="font-black tracking-widest">
            MONSTER ARCHIVE
          </span>

          <span>
            Independent fan-made project. Not affiliated with YG Entertainment.
          </span>

        </div>

      </footer>

    </main>
  );
}

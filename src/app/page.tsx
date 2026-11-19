
"use client";

import { useState } from "react";

const categories = [
  "All",
  "Pre-debut",
  "Stages",
  "Variety",
  "Behind",
  "Events",
];

const contents = [
  {
    title: "LAST EVALUATION",
    category: "Pre-debut",
    year: "2023",
    description: "The journey before debut",
    gradient: "from-violet-950 via-purple-900 to-black",
    symbol: "01",
  },
  {
    title: "BATTER UP",
    category: "Stages",
    year: "2023",
    description: "Debut era performances",
    gradient: "from-red-950 via-rose-900 to-black",
    symbol: "02",
  },
  {
    title: "SHEESH",
    category: "Stages",
    year: "2024",
    description: "Music shows and live stages",
    gradient: "from-orange-950 via-red-900 to-black",
    symbol: "03",
  },
  {
    title: "VARIETY ARCHIVE",
    category: "Variety",
    year: "2024",
    description: "Shows, interviews and games",
    gradient: "from-blue-950 via-indigo-900 to-black",
    symbol: "04",
  },
  {
    title: "BEHIND THE SCENES",
    category: "Behind",
    year: "2025",
    description: "Behind the music and cameras",
    gradient: "from-emerald-950 via-teal-900 to-black",
    symbol: "05",
  },
  {
    title: "AWARDS & EVENTS",
    category: "Events",
    year: "2025",
    description: "Award shows and special events",
    gradient: "from-amber-950 via-yellow-900 to-black",
    symbol: "06",
  },
];

export default function Home() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredContents = contents.filter((item) => {
    const matchesCategory =
      category === "All" || item.category === category;

    const matchesSearch =
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="text-2xl font-black tracking-[0.18em]">
            MONSTER<span className="text-purple-400">.</span>
          </a>

          
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="/" className="hover:text-white">Home</a>
            <a href="/members" className="hover:text-white">Members</a>
            <a href="/#watch" className="hover:text-white">Watch</a>
            <a href="/#about" className="hover:text-white">About</a>
          </nav>


          <div className="text-xs font-semibold tracking-wider text-zinc-400">
            GLOBAL FAN ARCHIVE
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(124,58,237,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(88,28,135,0.15),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-36">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-10 bg-purple-400" />
            <span className="text-xs font-bold tracking-[0.3em] text-purple-300">
              THE ULTIMATE BABYMONSTER ARCHIVE
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
            EVERY ERA.
            <br />
            EVERY STAGE.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-400 to-white">
              EVERY MEMORY.
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-7 text-zinc-400 md:text-lg">
            Discover the history, performances, music and unforgettable
            moments of BABYMONSTER. All in one place, made by fans,
            for fans.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#watch"
              className="rounded-lg bg-white px-7 py-4 text-sm font-bold text-black transition hover:bg-purple-200"
            >
              EXPLORE THE ARCHIVE →
            </a>

            <a
              href="#about"
              className="rounded-lg border border-white/20 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              ABOUT THE PROJECT
            </a>
          </div>

          <div className="mt-20 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-7">
            <div>
              <p className="text-2xl font-black">07</p>
              <p className="mt-1 text-xs text-zinc-500">MEMBERS</p>
            </div>
            <div>
              <p className="text-2xl font-black">∞</p>
              <p className="mt-1 text-xs text-zinc-500">MEMORIES</p>
            </div>
            <div>
              <p className="text-2xl font-black">GLOBAL</p>
              <p className="mt-1 text-xs text-zinc-500">COMMUNITY</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT CATALOG */}
      <section id="watch" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-purple-400">
              DISCOVER SOMETHING NEW
            </p>
            <h2 className="text-3xl font-black md:text-4xl">
              Explore the archive
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              Every moment has a story.
            </p>
          </div>

          <div className="w-full md:w-72">
            <input
              type="search"
              placeholder="Search the archive..."
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
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition ${
                category === item
                  ? "bg-purple-500 text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContents.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-purple-400/50"
            >
              <div
                className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br ${item.gradient}`}
              >
                <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/5" />

                <span className="relative text-7xl font-black tracking-tighter text-white/10 transition duration-500 group-hover:scale-110">
                  {item.symbol}
                </span>

                <span className="absolute bottom-5 left-5 text-xs font-bold tracking-[0.3em] text-white/80">
                  BABYMONSTER ARCHIVE
                </span>

                <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {item.category}
                </span>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-widest text-purple-400">
                  {item.category.toUpperCase()}
                  <span className="text-zinc-700">/</span>
                  {item.year}
                </div>

                <h3 className="text-lg font-black tracking-wide">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {filteredContents.length === 0 && (
          <p className="py-16 text-center text-zinc-500">
            No content found. Try another search.
          </p>
        )}
      </section>

      {/* ABOUT */}
      <section id="about" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
            MADE BY FANS. FOR FANS.
          </p>
          <h2 className="mt-5 text-3xl font-black md:text-5xl">
            One group. One archive.
            <br />
            <span className="text-zinc-500">A world of memories.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500">
            An independent fan project dedicated to preserving and
            organizing information about BABYMONSTER for fans around
            the world.
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
            Independent fan-made project. Not affiliated with YG Entertainment.
          </span>
        </div>
      </footer>
    </main>
  );
}

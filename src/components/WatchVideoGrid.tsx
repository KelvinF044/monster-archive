
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import type { Locale } from "@/lib/i18n/config";

export type WatchVideo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published_at: string | null;
  youtube_video_id: string;
  source_name: string;
  source_url: string;
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  era: string | null;
};

type Props = {
  slug: string;
  videos: WatchVideo[];
  collectionGradient: string;
  locale: Locale;
  showEraFilters: boolean;
  allLabel: string;
  noDescription: string;
  videoDetails: string;
  emptyEraMessage: string;
};

const preferredEraOrder = [
  "BATTER UP",
  "SHEESH",
  "DRIP",
  "WE GO UP",
];

function normalizeEra(value: string | null): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("en-US");
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

export default function WatchVideoGrid({
  slug,
  videos,
  collectionGradient,
  locale,
  showEraFilters,
  allLabel,
  noDescription,
  videoDetails,
  emptyEraMessage,
}: Props) {
  const [activeEra, setActiveEra] = useState<string | null>(null);

  // Automatically discover the eras that have videos in this collection.
  const eras = useMemo(() => {
    const uniqueEras = Array.from(
      new Set(
        videos
          .map((video) => normalizeEra(video.era))
          .filter((era) => era.length > 0)
      )
    );

    return uniqueEras.sort((a, b) => {
      const indexA = preferredEraOrder.indexOf(a);
      const indexB = preferredEraOrder.indexOf(b);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return a.localeCompare(b);
    });
  }, [videos]);

  // Videos without an era remain visible only in All.
  const filteredVideos = useMemo(() => {
    if (!activeEra) {
      return videos;
    }

    return videos.filter(
      (video) => normalizeEra(video.era) === activeEra
    );
  }, [activeEra, videos]);

  return (
    <div className="mt-10">

      {/* ERA FILTERS */}

      {showEraFilters && (
        <div className="mb-9">
          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() => setActiveEra(null)}
              aria-pressed={activeEra === null}
              className={`rounded-full px-5 py-3 text-xs font-bold transition ${
                activeEra === null
                  ? "bg-purple-500 text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {allLabel}
            </button>

            {eras.map((era) => (
              <button
                key={era}
                type="button"
                onClick={() => setActiveEra(era)}
                aria-pressed={activeEra === era}
                className={`rounded-full px-5 py-3 text-xs font-bold transition ${
                  activeEra === era
                    ? "bg-purple-500 text-white"
                    : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {era}
              </button>
            ))}

          </div>
        </div>
      )}

      {/* VIDEO RESULTS */}

      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {filteredVideos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${slug}/${video.slug}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-purple-400/50"
            >

              <YouTubeThumbnail
                videoId={video.youtube_video_id}
                thumbnailUrl={video.thumbnail_url}
                alt={video.thumbnail_alt || video.title}
                fallbackGradient={collectionGradient}
              />

              <div className="p-5">

                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold tracking-widest text-purple-400">
                    {formatLocalizedDate(video.published_at, locale)}
                  </p>

                  {video.era && (
                    <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-1 text-[9px] font-bold tracking-wider text-purple-300">
                      {normalizeEra(video.era)}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-black leading-snug">
                  {video.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {video.description || noDescription}
                </p>

                <div className="mt-5 border-t border-white/10 pt-4 text-xs font-bold text-purple-400">
                  {videoDetails}
                </div>

              </div>
            </Link>
          ))}

        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <p className="text-lg font-bold text-white">
            {emptyEraMessage}
          </p>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-600">
        {String(filteredVideos.length).padStart(2, "0")}{" "}
        {filteredVideos.length === 1 ? "VIDEO" : "VIDEOS"}
      </p>

    </div>
  );
}

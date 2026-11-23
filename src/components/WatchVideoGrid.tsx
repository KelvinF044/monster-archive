"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import type { Locale } from "@/lib/i18n/config";

export type WatchEra = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
};

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
  era_id: string | null;
};

type Props = {
  slug: string;
  videos: WatchVideo[];
  eras: WatchEra[];
  collectionGradient: string;
  locale: Locale;
  allLabel: string;
  noDescription: string;
  videoDetails: string;
  emptyEraMessage: string;
};

function normalizeLegacyEra(value: string | null): string {
  return (value ?? "")
    .trim()
    .replace(/\\s+/g, " ")
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
  eras,
  collectionGradient,
  locale,
  allLabel,
  noDescription,
  videoDetails,
  emptyEraMessage,
}: Props) {
  const [activeEraId, setActiveEraId] = useState<string | null>(null);

  // Keep only catalog eras that are actually represented in this collection.
  // The catalog already arrives sorted by its configured display_order.
  const availableEras = useMemo(() => {
    const linkedEraIds = new Set(
      videos
        .map((video) => video.era_id)
        .filter((eraId): eraId is string => Boolean(eraId))
    );

    return eras.filter((era) => linkedEraIds.has(era.id));
  }, [eras, videos]);

  const eraNames = useMemo(
    () => new Map(eras.map((era) => [era.id, era.name])),
    [eras]
  );

  const filteredVideos = useMemo(() => {
    if (!activeEraId) {
      return videos;
    }

    return videos.filter(
      (video) => video.era_id === activeEraId
    );
  }, [activeEraId, videos]);

  return (
    <div className="mt-10">

      {/* ERA FILTERS */}

      {availableEras.length > 0 && (
        <div className="mb-9">
          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() => setActiveEraId(null)}
              aria-pressed={activeEraId === null}
              className={`rounded-full px-5 py-3 text-xs font-bold transition ${
                activeEraId === null
                  ? "bg-purple-500 text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {allLabel}
            </button>

            {availableEras.map((era) => (
              <button
                key={era.id}
                type="button"
                onClick={() => setActiveEraId(era.id)}
                aria-pressed={activeEraId === era.id}
                className={`rounded-full px-5 py-3 text-xs font-bold transition ${
                  activeEraId === era.id
                    ? "bg-purple-500 text-white"
                    : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {era.name}
              </button>
            ))}

          </div>
        </div>
      )}

      {/* VIDEO RESULTS */}

      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {filteredVideos.map((video) => {
            const eraName =
              (video.era_id ? eraNames.get(video.era_id) : null) ??
              normalizeLegacyEra(video.era);

            return (
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

                    {eraName && (
                      <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-1 text-[9px] font-bold tracking-wider text-purple-300">
                        {eraName}
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
            );
          })}

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

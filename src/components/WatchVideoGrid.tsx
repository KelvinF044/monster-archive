"use client";

import { useMemo, useState } from "react";
import { CampaignFilters, type CampaignFilter } from "@/components/CampaignFilters";
import Link from "next/link";

import FavoriteButton from "@/components/FavoriteButton";
import YouTubeThumbnail from "@/components/YouTubeThumbnail";
import type { Locale } from "@/lib/i18n/config";

export type WatchEra = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  release: { id: string; name: string } | null;
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
  collection_slug: string;
};

type Props = {
  videos: WatchVideo[];
  eras: WatchEra[];
  savedIds: string[] | null;
  collectionGradient: string;
  locale: Locale;
  allLabel: string;
  videoDetails: string;
  emptyEraMessage: string;
  sortLabel: string;
  newestFirst: string;
  oldestFirst: string;
  campaignsLabel: string;
  videoSingular: string;
  videoPlural: string;
};

type SortOrder = "newest" | "oldest";

function normalizeLegacyEra(value: string | null): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("en-US");
}

function formatLocalizedDate(value: string | null, locale: Locale) {
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
  videos,
  eras,
  savedIds,
  collectionGradient,
  locale,
  allLabel,
  videoDetails,
  emptyEraMessage,
  sortLabel,
  newestFirst,
  oldestFirst,
  campaignsLabel,
  videoSingular,
  videoPlural,
}: Props) {
  const [filter, setFilter] = useState<CampaignFilter>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const erasById = useMemo(
    () => new Map(eras.map((era) => [era.id, era])),
    [eras]
  );

  const filteredVideos = useMemo(() => {
    const eraFilteredVideos = filter
      ? videos.filter(({ era_id }) => filter.type === "campaign"
          ? era_id === filter.id
          : Boolean(era_id && erasById.get(era_id)?.release?.id === filter.id))
      : videos;

    return eraFilteredVideos
      .map((video, index) => ({
        video,
        index,
        timestamp: video.published_at
          ? Date.parse(video.published_at)
          : Number.NaN,
      }))
      .sort((a, b) => {
        const aHasDate = Number.isFinite(a.timestamp);
        const bHasDate = Number.isFinite(b.timestamp);

        // Videos without a valid original publication date always stay last.
        if (!aHasDate && !bHasDate) return a.index - b.index;
        if (!aHasDate) return 1;
        if (!bHasDate) return -1;

        const difference = a.timestamp - b.timestamp;
        if (difference === 0) return a.index - b.index;

        return sortOrder === "newest" ? -difference : difference;
      })
      .map((item) => item.video);
  }, [erasById, filter, sortOrder, videos]);

  return (
    <div className="mt-10">
      {/* SORT ORDER */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <label
          htmlFor="watch-video-sort"
          className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-widest text-zinc-400"
        >
          <span>{sortLabel}</span>
          <select
            id="watch-video-sort"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as SortOrder)
            }
            className="min-w-48 rounded-lg border border-white/10 bg-[#111217] px-4 py-3 text-xs font-semibold tracking-normal text-white outline-none transition focus:border-purple-400"
          >
            <option value="newest">{newestFirst}</option>
            <option value="oldest">{oldestFirst}</option>
          </select>
        </label>
      </div>

      {/* ERA FILTERS */}

      {eras.length > 0 && (
        <CampaignFilters
          eras={eras}
          filter={filter}
          onChange={setFilter}
          allLabel={allLabel}
          campaignsLabel={campaignsLabel}
        />
      )}

      {/* VIDEO RESULTS */}

      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const eraName =
              (video.era_id ? erasById.get(video.era_id)?.name : null) ??
              normalizeLegacyEra(video.era);

            return (
              <article key={video.id} className="group relative min-w-0 rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-purple-400/50">
                <Link
                  href={`/watch/${video.collection_slug}/${video.slug}`}
                  className="block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-purple-400"
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

                    <div className="mt-5 border-t border-white/10 pt-4 text-xs font-bold text-purple-400">
                      {videoDetails}
                    </div>
                  </div>
                </Link>
                {savedIds && (
                  <div className="absolute top-3 right-3">
                    <FavoriteButton videoId={video.id} title={video.title} saved={savedIds.includes(video.id)} compact />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <p className="text-lg font-bold text-white">{emptyEraMessage}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-600">
        {String(filteredVideos.length).padStart(2, "0")}{" "}
        {filteredVideos.length === 1 ? videoSingular : videoPlural}
      </p>
    </div>
  );
}

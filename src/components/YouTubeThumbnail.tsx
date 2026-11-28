
"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

type Props = {
  videoId: string;
  thumbnailUrl?: string | null;
  alt: string;
  fallbackGradient: string;
  showLabels?: boolean;
};

type ThumbnailImageProps = {
  sources: string[];
  alt: string;
  fallbackGradient: string;
  showLabels?: boolean;
};

// This component is keyed by the video and thumbnail source.
// When either changes, React creates a fresh instance and resets
// the fallback state without requiring a useEffect.
function ThumbnailImage({
  sources,
  alt,
  fallbackGradient,
  showLabels = true,
}: ThumbnailImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);

  const currentSource = sources[sourceIndex];

  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br ${fallbackGradient}`}
    >
      {currentSource ? (
        <>
          <img
            key={currentSource}
            src={currentSource}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              setSourceIndex((current) => current + 1);
            }}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        </>
      ) : (
        <div className="relative flex flex-col items-center gap-3">
          <span className="text-6xl font-black text-white/20">
            ▶
          </span>

          {showLabels && (
            <span className="text-[10px] font-bold tracking-widest text-white/60">
              THUMBNAIL UNAVAILABLE
            </span>
          )}
        </div>
      )}

      {showLabels && (
        <span className="absolute bottom-4 left-4 text-[10px] font-bold tracking-widest text-white/80">
          OFFICIAL VIDEO SOURCE
        </span>
      )}
    </div>
  );
}

export default function YouTubeThumbnail({
  videoId,
  thumbnailUrl,
  alt,
  fallbackGradient,
  showLabels,
}: Props) {
  // First try the custom Supabase image.
  // Then try the official YouTube thumbnails.
  const youtubeSources = videoId
    ? [
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      ]
    : [];

  const sources = [
    ...new Set(
      [thumbnailUrl, ...youtubeSources].filter(
        (source): source is string => Boolean(source)
      )
    ),
  ];

  const sourceKey = `${thumbnailUrl ?? ""}|${videoId}`;

  return (
    <ThumbnailImage
      key={sourceKey}
      sources={sources}
      alt={alt}
      fallbackGradient={fallbackGradient}
      showLabels={showLabels}
    />
  );
}

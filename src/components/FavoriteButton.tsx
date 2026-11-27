"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { setFavorite } from "@/lib/favorites/actions";
import { favoritesMessages } from "@/lib/favorites/messages";

export default function FavoriteButton({
  videoId, title, saved, compact = false,
}: {
  videoId: string;
  title: string;
  saved: boolean;
  compact?: boolean;
}) {
  const { locale } = useLanguage();
  const copy = favoritesMessages(locale);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const command = optimistic ? copy.remove : copy.save;
  const label = `${command}: ${title}`;

  function handleClick() {
    const next = !optimistic;
    setFailed(false);
    startTransition(async () => {
      setOptimistic(next);
      try {
        if (!await setFavorite(videoId, next)) setFailed(true);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className={compact ? "relative shrink-0" : undefined}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={optimistic}
        title={label}
        disabled={pending}
        onClick={handleClick}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition hover:border-purple-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-60 ${compact ? "w-10" : "px-3.5"} ${optimistic ? "border-purple-400/50 bg-purple-500/20 text-purple-200" : "border-white/15 bg-[#161020] text-zinc-200"}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={optimistic ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" className="size-4 shrink-0">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        {!compact && (optimistic ? copy.saved : copy.save)}
      </button>
      {failed && (
        <p role="alert" className={`mt-2 text-xs text-red-200 ${compact ? "absolute right-0 z-10 w-44 rounded-lg border border-red-400/25 bg-[#170f19] p-2" : ""}`}>
          {copy.error}
        </p>
      )}
    </div>
  );
}

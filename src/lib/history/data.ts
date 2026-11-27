import "server-only";

import { createClient } from "@/lib/supabase/server";
import { libraryPageSize, type FavoriteCard } from "@/lib/favorites/data";

type HistoryPreference = { paused: boolean; recording_version: number };
type WatchPosition = { position_seconds: number; completed: boolean };
type HistoryCard = FavoriteCard & WatchPosition;

export async function getWatchHistoryContext(userId: string, videoId: string, resume: boolean) {
  const db = await createClient();
  const preferences = db.from("community_history_preferences")
    .select("paused,recording_version").eq("user_id", userId).maybeSingle<HistoryPreference>();
  const position = resume
    ? db.from("community_watch_history").select("position_seconds,completed").eq("user_id", userId)
        .eq("video_id", videoId).maybeSingle<WatchPosition>()
    : null;
  const [settings, progress] = await Promise.all([preferences, position]);
  if (settings.error) return null;
  return {
    paused: settings.data?.paused ?? false,
    version: settings.data?.recording_version ?? 0,
    startSeconds: progress?.data && !progress.data.completed ? progress.data.position_seconds : 0,
  };
}

export async function getLibraryHistory(userId: string, page: number) {
  const db = await createClient();
  const offset = (page - 1) * libraryPageSize;
  const [cards, settings] = await Promise.all([
    db.from("community_history_cards")
      .select("video_id,video_slug,title,youtube_video_id,thumbnail_url,thumbnail_alt,collection_slug,position_seconds,completed")
      .eq("user_id", userId).order("last_watched_at", { ascending: false }).order("video_id")
      .range(offset, offset + libraryPageSize).returns<HistoryCard[]>(),
    db.from("community_history_preferences").select("paused,recording_version")
      .eq("user_id", userId).maybeSingle<HistoryPreference>(),
  ]);
  if (cards.error || settings.error) return null;
  return {
    cards: cards.data.slice(0, libraryPageSize),
    hasNext: cards.data.length > libraryPageSize,
    paused: settings.data?.paused ?? false,
  };
}

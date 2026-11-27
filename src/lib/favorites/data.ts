import "server-only";

import { getSessionClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type FavoriteCard = {
  video_id: string;
  video_slug: string;
  title: string;
  youtube_video_id: string;
  thumbnail_url: string | null;
  thumbnail_alt: string | null;
  collection_slug: string;
};

export const libraryPageSize = 24;

export async function getFavoriteVideoIds(videoIds: string[]) {
  const claims = await getSessionClaims();
  if (!claims || !videoIds.length) return null;

  const db = await createClient();
  const { data, error } = await db.from("community_favorites")
    .select("video_id")
    .eq("user_id", claims.sub)
    .in("video_id", videoIds);

  return error ? null : data.map(({ video_id }) => video_id as string);
}

export async function getLibraryFavorites(userId: string, page: number) {
  const db = await createClient();
  const offset = (page - 1) * libraryPageSize;
  const { data, error } = await db.from("community_favorite_cards")
    .select("video_id,video_slug,title,youtube_video_id,thumbnail_url,thumbnail_alt,collection_slug")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("video_id")
    .range(offset, offset + libraryPageSize)
    .returns<FavoriteCard[]>();

  if (error) return null;
  return { cards: data.slice(0, libraryPageSize), hasNext: data.length > libraryPageSize };
}

import "server-only";

import type { FavoriteCard } from "@/lib/favorites/data";
import { createClient } from "@/lib/supabase/server";

export type VideoList = { id: string; title: string; description: string; is_public: boolean; moderation_hidden: boolean };
type ListVideo = { video_id: string; position: number } & (FavoriteCard | {
  video_slug: null; title: null; youtube_video_id: null; thumbnail_url: null; thumbnail_alt: null; collection_slug: null;
});
type SharedList = { title: string; description: string; videos: FavoriteCard[] };

const fields = "id,title,description,is_public,moderation_hidden";
const selectorPageSize = 250;

export async function getListChoices(userId: string) {
  const db = await createClient();
  const result: Pick<VideoList, "id" | "title">[] = [];
  for (let offset = 0; ; offset += selectorPageSize) {
    const { data, error } = await db.from("community_video_lists").select("id,title")
      .eq("user_id", userId).order("title").order("id")
      .range(offset, offset + selectorPageSize - 1);
    if (error) return null;
    result.push(...data);
    if (data.length < selectorPageSize) return result;
  }
}

export async function getLibraryLists(userId: string, page: number, pageSize: number) {
  const db = await createClient();
  const offset = (page - 1) * pageSize;
  const { data, error } = await db.from("community_video_lists").select(fields)
    .eq("user_id", userId).order("created_at", { ascending: false }).order("id")
    .range(offset, offset + pageSize).returns<VideoList[]>();
  return error ? null : { cards: data.slice(0, pageSize), hasNext: data.length > pageSize };
}

export async function getOwnedList(userId: string, listId: string, page: number, pageSize: number) {
  const db = await createClient();
  const offset = (page - 1) * pageSize;
  const [list, videos] = await Promise.all([
    db.from("community_video_lists").select(fields)
      .eq("id", listId).eq("user_id", userId).maybeSingle<VideoList>(),
    db.from("community_list_video_cards")
      .select("position,video_id,video_slug,title,youtube_video_id,thumbnail_url,thumbnail_alt,collection_slug")
      .eq("list_id", listId).order("position").range(offset, offset + pageSize).returns<ListVideo[]>(),
  ]);
  if (list.error || videos.error) throw new Error("Unable to read list");
  if (!list.data) return null;
  return { list: list.data, videos: videos.data.slice(0, pageSize), hasNext: videos.data.length > pageSize };
}

export async function getSharedList(listId: string) {
  const db = await createClient();
  const { data, error } = await db.rpc("get_shared_community_video_list", { target_list: listId });
  if (error) throw new Error("Unable to read shared list");
  return data as SharedList | null;
}

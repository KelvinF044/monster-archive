import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { WatchVideo } from "@/components/WatchVideoGrid";
import { memberArchiveCategories, type MemberArchiveCategory } from "./member-archive-categories";

export async function getMemberArchiveVideos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  category: MemberArchiveCategory,
  limit?: number
): Promise<WatchVideo[]> {
  const { collections } = memberArchiveCategories[category];
  const query = supabase
    .from("watch_videos")
    .select(`
      id, slug, title, description, published_at, youtube_video_id,
      source_name, source_url, thumbnail_url, thumbnail_alt, era, era_id,
      watch_video_members!inner(),
      watch_video_collections!inner(watch_collections!inner(slug))
    `)
    .eq("status", "published")
    .eq("watch_video_members.member_id", memberId)
    .eq("watch_video_members.show_on_profile", true)
    .eq("watch_video_collections.watch_collections.is_active", true)
    .in("watch_video_collections.watch_collections.slug", collections)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id");

  if (limit !== undefined) query.limit(limit);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap(({ watch_video_collections, ...video }) => {
    const linkedCollections = watch_video_collections.flatMap(({ watch_collections }) => watch_collections);
    const collectionSlug = collections.find((slug) =>
      linkedCollections.some((collection) => collection.slug === slug)
    );

    return collectionSlug ? [{ ...video, collection_slug: collectionSlug }] : [];
  });
}

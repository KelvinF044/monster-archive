import "server-only";

import type { WatchEra, WatchVideo } from "@/components/WatchVideoGrid";
import type { createClient } from "@/lib/supabase/server";

export async function getVideoEras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  videos: WatchVideo[]
): Promise<WatchEra[]> {
  const ids = [...new Set(videos.flatMap(({ era_id }) => (era_id ? [era_id] : [])))];

  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("watch_eras")
    .select("id, name, slug, display_order, is_active, release:watch_releases(id, name)")
    .in("id", ids)
    .order("display_order")
    .order("name")
    .overrideTypes<WatchEra[], { merge: false }>();

  if (error) {
    console.error("Error loading Watch campaigns:", error.message);
    return [];
  }

  return data ?? [];
}

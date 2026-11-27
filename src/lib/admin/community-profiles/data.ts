import "server-only";

import { createClient } from "@/lib/supabase/server";
import { profileDirectoryPageSize, type ProfileDirectoryEntry, type ProfileSort } from "./model";

export async function getCommunityProfileDirectory(search: string, sort: ProfileSort, page: number) {
  const db = await createClient();
  const { data, error } = await db.rpc("get_admin_community_profiles", {
    search_term: search,
    sort_order: sort,
    page_number: page,
  });
  if (error || !Array.isArray(data)) return null;

  const entries = data as ProfileDirectoryEntry[];
  return { entries: entries.slice(0, profileDirectoryPageSize), hasNext: entries.length > profileDirectoryPageSize };
}

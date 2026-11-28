"use server";

import { revalidatePath } from "next/cache";

import { getSessionClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function setFavorite(videoId: string, saved: boolean) {
  const claims = await getSessionClaims();
  if (!claims || typeof saved !== "boolean" || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(videoId)) {
    return false;
  }

  const db = await createClient();
  const result = saved
    ? await db.from("community_favorites").upsert(
        { user_id: claims.sub, video_id: videoId },
        { onConflict: "user_id,video_id", ignoreDuplicates: true },
      )
    : await db.from("community_favorites").delete().eq("user_id", claims.sub).eq("video_id", videoId);

  if (result.error) return false;
  revalidatePath("/library");
  return true;
}

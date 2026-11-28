"use server";

import { revalidatePath } from "next/cache";
import { getSessionClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isVideoUuid, type HistoryState } from "./model";

export async function manageHistory(_: HistoryState, form: FormData): Promise<HistoryState> {
  const command = form.get("command");
  const videoId = form.get("videoId");

  if (
    !await getSessionClaims() ||
    (command !== "pause" && command !== "resume" && command !== "remove" && command !== "clear") ||
    (command === "remove" && !isVideoUuid(videoId))
  ) return { failed: true };

  const db = await createClient();
  const { error } = await db.rpc("manage_community_watch_history", {
    history_action: command,
    watched_video: command === "remove" ? videoId : null,
  });
  if (error) return { failed: true };
  revalidatePath("/library");
  return {};
}

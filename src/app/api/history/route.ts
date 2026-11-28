import { getSessionClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isVideoUuid, maxPositionSeconds } from "@/lib/history/model";

export async function POST(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0] !== "application/json" ||
    ["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "")
  ) return new Response(null, { status: 415 });

  const claims = await getSessionClaims();
  if (!claims) return new Response(null, { status: 401 });

  const payload = await request.json().catch(() => null);
  if (
    !isVideoUuid(payload?.videoId) ||
    !Number.isInteger(payload.position) || payload.position < 0 || payload.position > maxPositionSeconds ||
    typeof payload.completed !== "boolean" ||
    !Number.isInteger(payload.version) || payload.version < 0 || payload.version > 2_147_483_647
  ) return new Response(null, { status: 400 });

  const db = await createClient();
  const { data, error } = await db.rpc("record_community_watch_history", {
    watched_video: payload.videoId,
    position_seconds: payload.position,
    playback_completed: payload.completed,
    expected_version: payload.version,
  });
  return new Response(null, { status: error ? 503 : data === true ? 204 : 409 });
}

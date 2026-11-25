import { NextRequest, NextResponse } from "next/server";

import {
  getImportGatewayConfig,
  isImportAiEnabled,
  suggestImportClassification,
  SUGGESTION_UNAVAILABLE,
} from "@/lib/admin/import/gateway";
import {
  EDITORIAL_NOTE_LIMIT,
  isRecord,
  uuidPattern,
  youtubeVideoIdPattern,
} from "@/lib/admin/import/review";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";

export async function POST(request: NextRequest) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  }

  const config = getImportGatewayConfig(request.headers.get("x-vercel-oidc-token"));
  if (!config) {
    if (isImportAiEnabled()) {
      console.warn("Smart Import Gateway credentials unavailable");
      return NextResponse.json({
        error: "AI authentication is unavailable. You can finish the review manually.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: SUGGESTION_UNAVAILABLE }, { status: 503 });
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  const body: unknown = contentType === "application/json"
    ? await request.json().catch(() => null)
    : null;

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Provide a short editorial note for the selected video." }, { status: 400 });
  }

  const { sourceId, videoId, note, locale } = body;
  if (
    typeof sourceId !== "string" || !uuidPattern.test(sourceId) ||
    typeof videoId !== "string" || !youtubeVideoIdPattern.test(videoId) ||
    typeof note !== "string" || !note.trim() || note.length > EDITORIAL_NOTE_LIMIT ||
    (locale !== "en" && locale !== "pt-BR")
  ) {
    return NextResponse.json({ error: "Provide a short editorial note for the selected video." }, { status: 400 });
  }

  const { supabase } = admin;
  const [source, existing, collections, eras, members] = await Promise.all([
    supabase.from("watch_import_sources").select("id").eq("id", sourceId).eq("is_active", true).maybeSingle(),
    supabase.from("watch_videos").select("id").eq("youtube_video_id", videoId).maybeSingle(),
    supabase.from("watch_collections").select("id, title, category").eq("is_active", true).order("display_order"),
    supabase.from("watch_eras").select("id, name").eq("is_active", true).order("display_order"),
    supabase.from("members").select("id, name").eq("is_active", true).order("display_order"),
  ]);

  if (source.error || existing.error || collections.error || eras.error || members.error) {
    return NextResponse.json({ error: SUGGESTION_UNAVAILABLE }, { status: 503 });
  }
  if (!source.data) {
    return NextResponse.json({ error: "This playlist source is inactive." }, { status: 404 });
  }
  if (existing.data) {
    return NextResponse.json({ error: "This video is already registered." }, { status: 409 });
  }

  const taxonomy = {
    collections: collections.data,
    eras: eras.data,
    members: members.data,
  };

  try {
    // The YouTube ID is used only for duplicate detection. The provider gets
    // the original editorial note and the archive's own taxonomy.
    const { suggestion, status, error } = await suggestImportClassification(config, taxonomy, note.trim(), locale);

    return suggestion
      ? NextResponse.json({ suggestion })
      : NextResponse.json({ error: error ?? SUGGESTION_UNAVAILABLE }, { status });
  } catch (error) {
    console.warn("Smart Import generation failed", { type: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: SUGGESTION_UNAVAILABLE }, { status: 503 });
  }
}

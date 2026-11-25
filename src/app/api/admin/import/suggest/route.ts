import { NextRequest, NextResponse } from "next/server";

import {
  getImportGatewayConfig,
  isImportAiEnabled,
  suggestImportClassification,
  SUGGESTION_UNAVAILABLE,
} from "@/lib/admin/import/gateway";
import { parseImportSuggestionRequest } from "@/lib/admin/import/review";
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

  const parsed = parseImportSuggestionRequest(body);
  if (!parsed) {
    return NextResponse.json({ error: "Select up to 20 distinct videos and provide a short editorial note." }, { status: 400 });
  }
  const { sourceId, videoIds, note, locale, scope } = parsed;

  const { supabase } = admin;
  const [source, existing, collections, eras, members] = await Promise.all([
    supabase.from("watch_import_sources").select("id").eq("id", sourceId).eq("is_active", true).maybeSingle(),
    supabase.from("watch_videos").select("id").in("youtube_video_id", videoIds).limit(1),
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
  if (existing.data?.length) {
    return NextResponse.json({ error: scope === "batch" ? "One or more selected videos are already registered." : "This video is already registered." }, { status: 409 });
  }

  const taxonomy = {
    collections: collections.data,
    eras: eras.data,
    members: members.data,
  };

  try {
    // The YouTube IDs are used only for duplicate detection. One generation
    // uses the editor's own note and taxonomy, regardless of batch size.
    const { suggestion, status, error } = await suggestImportClassification(config, taxonomy, note, locale, scope);

    return suggestion
      ? NextResponse.json({ suggestion })
      : NextResponse.json({ error: error ?? SUGGESTION_UNAVAILABLE }, { status });
  } catch (error) {
    console.warn("Smart Import generation failed", { type: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: SUGGESTION_UNAVAILABLE }, { status: 503 });
  }
}

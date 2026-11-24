import { NextRequest, NextResponse } from "next/server";

import { isRecord, parseImportApproval } from "@/lib/admin/import/review";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";

type YouTubeVideo = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
  };
  status?: {
    privacyStatus?: string;
  };
};

export async function POST(request: NextRequest) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Before importing, configure YOUTUBE_API_KEY, SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET. This enables the required metadata refresh." },
      { status: 503 }
    );
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  const approval = contentType === "application/json"
    ? parseImportApproval(await request.json().catch(() => null))
    : null;
  if (!approval) {
    return NextResponse.json(
      { error: "Choose a source and valid classifications for 1 to 20 videos." },
      { status: 400 }
    );
  }

  const { sourceId, items } = approval;
  const { supabase } = admin;
  const { data: source, error: sourceError } = await supabase
    .from("watch_import_sources")
    .select("id")
    .eq("id", sourceId)
    .eq("is_active", true)
    .maybeSingle();

  if (sourceError) {
    return NextResponse.json({ error: "Could not check the playlist source." }, { status: 500 });
  }
  if (!source) {
    return NextResponse.json({ error: "This playlist source is inactive." }, { status: 404 });
  }

  const ids = [...items.keys()];
  const { data: existingRows, error: existingError } = await supabase
    .from("watch_videos")
    .select("youtube_video_id")
    .in("youtube_video_id", ids);

  if (existingError) {
    return NextResponse.json({ error: "Could not check duplicate videos." }, { status: 500 });
  }

  const duplicates = (existingRows ?? []).map((video) => video.youtube_video_id as string);
  const existingIds = new Set(duplicates);
  const newIds = ids.filter((id) => !existingIds.has(id));
  const imported: string[] = [];
  const unavailable: string[] = [];
  const failed: { videoId: string; reason: string }[] = [];

  if (newIds.length > 0) {
    const params = new URLSearchParams({
      part: "snippet,status",
      id: newIds.join(","),
      key: apiKey,
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);

    if (!response?.ok || !Array.isArray(data?.items)) {
      return NextResponse.json(
        { error: "YouTube could not confirm the selected videos." },
        { status: 502 }
      );
    }

    const videos = new Map<string, YouTubeVideo>();
    for (const video of data.items) {
      if (isRecord(video) && typeof video.id === "string") {
        videos.set(video.id, video as YouTubeVideo);
      }
    }
    // The RPC isolates each video in its own transaction. Iterate over the
    // requested items so an upstream response cannot add a video to the batch.
    for (const [videoId, item] of items) {
      if (existingIds.has(videoId)) continue;

      const video = videos.get(videoId);
      if (!video) {
        unavailable.push(videoId);
        continue;
      }

      const privacy = video.status?.privacyStatus;
      if (privacy !== "public" && privacy !== "unlisted") {
        failed.push({ videoId, reason: "The video is not public or unlisted." });
        continue;
      }

      const { data: outcome, error } = await supabase.rpc("import_watch_video_draft", {
        p_source_id: sourceId,
        p_youtube_video_id: videoId,
        p_title: video.snippet?.title?.trim() || "Untitled YouTube video",
        p_description: video.snippet?.description ?? null,
        p_published_at: video.snippet?.publishedAt ?? null,
        p_collection_id: item.collectionId,
        p_era_id: item.eraId,
        p_member_ids: item.memberIds,
        p_official_mv_confirmed: item.officialMvConfirmed,
      });

      if (outcome === "duplicate") {
        duplicates.push(videoId);
      } else if (outcome === "imported") {
        imported.push(videoId);
      } else {
        if (error?.code !== "22023") {
          console.error("Import draft failed", { code: error?.code ?? "unexpected_result" });
        }
        failed.push({
          videoId,
          reason: error?.code === "22023" ? error.message : "Could not create the video draft.",
        });
      }
    }
  }

  return NextResponse.json({
    imported,
    importedCount: imported.length,
    duplicates,
    unavailable,
    failed,
    status: "draft",
  });
}

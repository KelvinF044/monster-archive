import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type VideoRow = {
  id: string;
  youtube_video_id: string;
  youtube_metadata_refreshed_at: string | null;
};

type YouTubeVideo = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
  };
};

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service configuration is missing.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function unavailableTitle(videoId: string) {
  return `Unavailable YouTube video ${videoId.slice(0, 6)}`;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is not configured." },
      { status: 503 }
    );
  }

  let supabase: ReturnType<typeof createServiceClient>;

  try {
    supabase = createServiceClient();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Supabase service configuration is missing.",
      },
      { status: 503 }
    );
  }

  const now = new Date();
  const refreshBefore = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
  const expireBefore = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const { data: staleRows, error: staleError } = await supabase
    .from("watch_videos")
    .select("id, youtube_video_id, youtube_metadata_refreshed_at")
    .eq("metadata_source", "youtube_api")
    .lt("youtube_metadata_refreshed_at", refreshBefore.toISOString())
    .order("youtube_metadata_refreshed_at", { ascending: true })
    .limit(1000);

  if (staleError) {
    return NextResponse.json(
      { error: staleError.message },
      { status: 500 }
    );
  }

  const staleVideos = (staleRows ?? []) as VideoRow[];
  const apiBatches: VideoRow[][] = [];
  let refreshedCount = 0;
  let unavailableCount = 0;
  let apiErrors = 0;

  for (let offset = 0; offset < staleVideos.length; offset += 50) {
    apiBatches.push(staleVideos.slice(offset, offset + 50));
  }

  for (const batch of apiBatches) {
    const ids = batch.map((video) => video.youtube_video_id);
    const params = new URLSearchParams({
      part: "snippet",
      id: ids.join(","),
      maxResults: "50",
      key: apiKey,
    });

    let response: Response;

    try {
      response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
        { cache: "no-store" }
      );
    } catch {
      apiErrors += batch.length;
      await clearExpiredMetadata(supabase, batch, expireBefore);
      continue;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      apiErrors += batch.length;
      await clearExpiredMetadata(supabase, batch, expireBefore);
      continue;
    }

    const returned: YouTubeVideo[] = Array.isArray(payload?.items)
      ? payload.items
      : [];
    const byId = new Map(returned.map((video) => [video.id, video]));

    for (const existing of batch) {
      const current = byId.get(existing.youtube_video_id);

      if (!current?.snippet) {
        const removed = await removeImportedVideo(supabase, existing.id);

        if (removed) unavailableCount += 1;
        continue;
      }

      const { error } = await supabase
        .from("watch_videos")
        .update({
          title: (current.snippet.title ?? "Untitled YouTube video").slice(0, 200),
          description: (current.snippet.description ?? "").slice(0, 3000) || null,
          published_at: current.snippet.publishedAt ?? null,
          youtube_metadata_refreshed_at: now.toISOString(),
        })
        .eq("id", existing.id);

      if (!error) refreshedCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: staleVideos.length,
    refreshed: refreshedCount,
    unavailable: unavailableCount,
    apiErrors,
    checkedAt: now.toISOString(),
  });
}

async function clearExpiredMetadata(
  supabase: ReturnType<typeof createServiceClient>,
  videos: VideoRow[],
  expireBefore: Date
) {
  for (const video of videos) {
    const refreshedAt = video.youtube_metadata_refreshed_at
      ? new Date(video.youtube_metadata_refreshed_at)
      : null;

    if (!refreshedAt || refreshedAt >= expireBefore) {
      continue;
    }

    await removeImportedVideo(supabase, video.id);
  }
}

async function removeImportedVideo(
  supabase: ReturnType<typeof createServiceClient>,
  videoId: string
) {
  const { error: collectionError } = await supabase
    .from("watch_video_collections")
    .delete()
    .eq("video_id", videoId);

  if (collectionError) return false;

  const { error: memberError } = await supabase
    .from("watch_video_members")
    .delete()
    .eq("video_id", videoId);

  if (memberError) return false;

  const { error: videoError } = await supabase
    .from("watch_videos")
    .delete()
    .eq("id", videoId);

  return !videoError;
}

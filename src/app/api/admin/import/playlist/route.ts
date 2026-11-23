import { NextRequest, NextResponse } from "next/server";

import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type YouTubePlaylistItem = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    position?: number;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
    resourceId?: {
      videoId?: string;
    };
  };
};

function youtubeErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "YouTube could not return this playlist. Check the URL and API access.";
}

export async function GET(request: NextRequest) {
  const admin = await requireActiveAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 401 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "YouTube integration is not configured. Add YOUTUBE_API_KEY to the server environment.",
      },
      { status: 503 }
    );
  }

  const sourceId = request.nextUrl.searchParams.get("sourceId");
  const pageToken = request.nextUrl.searchParams.get("pageToken");

  if (!sourceId) {
    return NextResponse.json(
      { error: "Select a playlist source first." },
      { status: 400 }
    );
  }

  const { data: source, error: sourceError } = await admin.supabase
    .from("watch_import_sources")
    .select("id, name, playlist_id, playlist_url, default_collection_id, default_era_id, is_active")
    .eq("id", sourceId)
    .eq("is_active", true)
    .maybeSingle();

  if (sourceError || !source) {
    return NextResponse.json(
      { error: sourceError?.message ?? "This playlist source is inactive or was not found." },
      { status: 404 }
    );
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: source.playlist_id,
    maxResults: "50",
    key: apiKey,
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  let youtubeResponse: Response;

  try {
    youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
      { cache: "no-store" }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not connect to the YouTube Data API. Try again." },
      { status: 502 }
    );
  }

  const youtubeData = await youtubeResponse.json().catch(() => null);

  if (!youtubeResponse.ok) {
    return NextResponse.json(
      { error: youtubeErrorMessage(youtubeData) },
      { status: youtubeResponse.status === 403 ? 502 : youtubeResponse.status }
    );
  }

  const rawItems = Array.isArray(youtubeData?.items)
    ? (youtubeData.items as YouTubePlaylistItem[])
    : [];

  const videoIds = rawItems
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter((videoId): videoId is string => Boolean(videoId));

  const existingIds = new Set<string>();

  if (videoIds.length > 0) {
    const { data: existingVideos, error: existingError } =
      await admin.supabase
        .from("watch_videos")
        .select("youtube_video_id")
        .in("youtube_video_id", videoIds);

    if (existingError) {
      return NextResponse.json(
        { error: `Could not check duplicate videos: ${existingError.message}` },
        { status: 500 }
      );
    }

    for (const video of existingVideos ?? []) {
      existingIds.add(video.youtube_video_id);
    }
  }

  await admin.supabase
    .from("watch_import_sources")
    .update({ last_scanned_at: new Date().toISOString() })
    .eq("id", source.id);

  const items = rawItems
    .filter((item) => Boolean(item.snippet?.resourceId?.videoId))
    .map((item) => {
      const snippet = item.snippet!;
      const videoId = snippet.resourceId!.videoId!;

      return {
        videoId,
        title: snippet.title ?? "Untitled YouTube video",
        description: snippet.description ?? "",
        thumbnailUrl:
          snippet.thumbnails?.high?.url ??
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url ??
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channelTitle: snippet.channelTitle ?? "YouTube",
        playlistAddedAt: snippet.publishedAt ?? null,
        position: snippet.position ?? 0,
        alreadyRegistered: existingIds.has(videoId),
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });

  return NextResponse.json({
    source: {
      id: source.id,
      name: source.name,
      defaultCollectionId: source.default_collection_id,
      defaultEraId: source.default_era_id,
    },
    items,
    nextPageToken: youtubeData?.nextPageToken ?? null,
    totalResults: youtubeData?.pageInfo?.totalResults ?? null,
  });
}

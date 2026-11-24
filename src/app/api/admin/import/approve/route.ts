import { NextRequest, NextResponse } from "next/server";

import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";

type VideoClassification = {
  videoId?: string;
  collectionId?: string;
  eraId?: string | null;
  memberIds?: string[];
};

type RequestBody = {
  sourceId?: string;
  videoIds?: string[];
  collectionId?: string;
  eraId?: string | null;
  memberIds?: string[];
  classifications?: VideoClassification[];
};

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

type ResolvedClassification = {
  videoId: string;
  collectionId: string;
  eraId: string | null;
  memberIds: string[];
};

function createSlug(videoId: string) {
  // Encode the original, case-sensitive YouTube ID as lowercase hex.
  // YouTube IDs can contain underscores and are case-sensitive; hex keeps
  // every character, avoids slug-check violations and prevents ID collisions.
  const encodedId = Array.from(videoId)
    .map((character) =>
      character.charCodeAt(0).toString(16).padStart(2, "0")
    )
    .join("");

  return `yt-${encodedId}`;
}

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

  return "YouTube could not confirm the selected videos.";
}

export async function POST(request: NextRequest) {
  const admin = await requireActiveAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 401 }
    );
  }

  if (
    !process.env.YOUTUBE_API_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.CRON_SECRET
  ) {
    return NextResponse.json(
      {
        error:
          "Before importing, configure YOUTUBE_API_KEY, SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET. This enables the required metadata refresh.",
      },
      { status: 503 }
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const sourceId = body.sourceId;
  const videoIds = Array.isArray(body.videoIds)
    ? Array.from(new Set(body.videoIds))
    : [];
  const fallbackCollectionId = body.collectionId || "";
  const fallbackEraId = body.eraId || null;
  const fallbackMemberIds = Array.isArray(body.memberIds)
    ? Array.from(new Set(body.memberIds))
    : [];

  const hasPerVideoClassifications =
    Array.isArray(body.classifications) && body.classifications.length > 0;
  const classificationsById = new Map<string, VideoClassification>();

  if (hasPerVideoClassifications) {
    for (const classification of body.classifications ?? []) {
      if (
        !classification ||
        typeof classification.videoId !== "string" ||
        classificationsById.has(classification.videoId)
      ) {
        return NextResponse.json(
          { error: "The per-video classification list is invalid." },
          { status: 400 }
        );
      }
      classificationsById.set(classification.videoId, classification);
    }
  }

  if (
    !sourceId ||
    videoIds.length === 0 ||
    videoIds.length > 20 ||
    (hasPerVideoClassifications &&
      classificationsById.size !== videoIds.length) ||
    (!hasPerVideoClassifications && !fallbackCollectionId)
  ) {
    return NextResponse.json(
      {
        error:
          "Choose a source, a classification for every video and between 1 and 20 videos.",
      },
      { status: 400 }
    );
  }

  if (
    videoIds.some((id) => !/^[A-Za-z0-9_-]{11}$/.test(id)) ||
    fallbackMemberIds.length > 7
  ) {
    return NextResponse.json(
      { error: "One or more selected identifiers are invalid." },
      { status: 400 }
    );
  }

  const requestedIds = new Set(videoIds);
  if (
    hasPerVideoClassifications &&
    Array.from(classificationsById.keys()).some((id) => !requestedIds.has(id))
  ) {
    return NextResponse.json(
      { error: "A classification references a video outside this batch." },
      { status: 400 }
    );
  }

  const assignments: ResolvedClassification[] = videoIds.map((videoId) => {
    const suggested = classificationsById.get(videoId);
    const memberIds = Array.isArray(suggested?.memberIds)
      ? Array.from(new Set(suggested.memberIds))
      : fallbackMemberIds;

    return {
      videoId,
      collectionId: suggested?.collectionId || fallbackCollectionId,
      eraId: suggested?.eraId || fallbackEraId,
      memberIds,
    };
  });

  if (
    assignments.some(
      (assignment) =>
        !assignment.collectionId ||
        assignment.memberIds.length > 7
    )
  ) {
    return NextResponse.json(
      { error: "Each video must have one active collection and valid members." },
      { status: 400 }
    );
  }

  const { data: source, error: sourceError } = await admin.supabase
    .from("watch_import_sources")
    .select("id, name, is_active")
    .eq("id", sourceId)
    .eq("is_active", true)
    .maybeSingle();

  if (sourceError || !source) {
    return NextResponse.json(
      { error: sourceError?.message ?? "This playlist source is inactive." },
      { status: 404 }
    );
  }

  const collectionIds = Array.from(
    new Set(assignments.map((assignment) => assignment.collectionId))
  );
  const eraIds = Array.from(
    new Set(
      assignments
        .map((assignment) => assignment.eraId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const memberIds = Array.from(
    new Set(assignments.flatMap((assignment) => assignment.memberIds))
  );

  const [collectionsResult, erasResult, membersResult] = await Promise.all([
    admin.supabase
      .from("watch_collections")
      .select("id")
      .eq("is_active", true)
      .in("id", collectionIds),

    eraIds.length > 0
      ? admin.supabase
          .from("watch_eras")
          .select("id, name")
          .eq("is_active", true)
          .in("id", eraIds)
      : Promise.resolve({ data: [], error: null }),

    memberIds.length > 0
      ? admin.supabase
          .from("members")
          .select("id")
          .eq("is_active", true)
          .in("id", memberIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (
    collectionsResult.error ||
    (collectionsResult.data?.length ?? 0) !== collectionIds.length
  ) {
    return NextResponse.json(
      { error: collectionsResult.error?.message ?? "One or more collections are inactive or unavailable." },
      { status: 400 }
    );
  }

  if (erasResult.error || (erasResult.data?.length ?? 0) !== eraIds.length) {
    return NextResponse.json(
      { error: erasResult.error?.message ?? "One or more selected eras are inactive or unavailable." },
      { status: 400 }
    );
  }

  if (
    membersResult.error ||
    (membersResult.data?.length ?? 0) !== memberIds.length
  ) {
    return NextResponse.json(
      { error: membersResult.error?.message ?? "One or more selected members are inactive or unavailable." },
      { status: 400 }
    );
  }

  const eraNames = new Map(
    (erasResult.data ?? []).map((era) => [era.id, era.name])
  );

  const params = new URLSearchParams({
    part: "snippet,status",
    id: videoIds.join(","),
    maxResults: "50",
    key: process.env.YOUTUBE_API_KEY,
  });

  let youtubeResponse: Response;

  try {
    youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
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

  const confirmedVideos: YouTubeVideo[] = Array.isArray(youtubeData?.items)
    ? youtubeData.items
    : [];

  const confirmedIds = new Set(confirmedVideos.map((video) => video.id));
  const unavailable = videoIds.filter((id) => !confirmedIds.has(id));

  const { data: existingRows, error: existingError } = await admin.supabase
    .from("watch_videos")
    .select("youtube_video_id")
    .in("youtube_video_id", videoIds);

  if (existingError) {
    return NextResponse.json(
      { error: `Could not check duplicates: ${existingError.message}` },
      { status: 500 }
    );
  }

  const existingIds = new Set(
    (existingRows ?? []).map((video) => video.youtube_video_id)
  );

  const duplicates = videoIds.filter((id) => existingIds.has(id));
  const now = new Date().toISOString();
  const imported: string[] = [];
  const failed: { videoId: string; reason: string }[] = [];

  for (const video of confirmedVideos) {
    if (existingIds.has(video.id)) {
      continue;
    }

    const privacyStatus = video.status?.privacyStatus;

    if (privacyStatus && !["public", "unlisted"].includes(privacyStatus)) {
      failed.push({
        videoId: video.id,
        reason: "The video is not public or unlisted.",
      });
      continue;
    }

    const assignment = assignments.find((item) => item.videoId === video.id);
    if (!assignment) {
      failed.push({
        videoId: video.id,
        reason: "No classification was found for this video.",
      });
      continue;
    }

    const title = (video.snippet?.title ?? "Untitled YouTube video").trim();
    const description = (video.snippet?.description ?? "").slice(0, 3000);
    const eraName = assignment.eraId
      ? eraNames.get(assignment.eraId) ?? null
      : null;

    const { data: createdVideo, error: createError } = await admin.supabase
      .from("watch_videos")
      .insert({
        slug: createSlug(video.id),
        title: title.slice(0, 200),
        description: description || null,
        published_at: video.snippet?.publishedAt ?? null,
        youtube_video_id: video.id,
        source_name: source.name,
        source_url: `https://www.youtube.com/watch?v=${video.id}`,
        status: "draft",
        is_featured: false,
        era: eraName,
        era_id: assignment.eraId,
        metadata_source: "youtube_api",
        youtube_metadata_refreshed_at: now,
        import_source_id: source.id,
      })
      .select("id")
      .single();

    if (createError || !createdVideo) {
      failed.push({
        videoId: video.id,
        reason: createError?.message ?? "Could not create the video record.",
      });
      continue;
    }

    const { error: collectionLinkError } = await admin.supabase
      .from("watch_video_collections")
      .insert({
        video_id: createdVideo.id,
        collection_id: assignment.collectionId,
        display_order: 0,
      });

    if (collectionLinkError) {
      await admin.supabase
        .from("watch_videos")
        .delete()
        .eq("id", createdVideo.id);

      failed.push({ videoId: video.id, reason: collectionLinkError.message });
      continue;
    }

    if (assignment.memberIds.length > 0) {
      const { error: memberLinkError } = await admin.supabase
        .from("watch_video_members")
        .insert(
          assignment.memberIds.map((memberId) => ({
            video_id: createdVideo.id,
            member_id: memberId,
          }))
        );

      if (memberLinkError) {
        await admin.supabase
          .from("watch_video_collections")
          .delete()
          .eq("video_id", createdVideo.id);

        await admin.supabase
          .from("watch_videos")
          .delete()
          .eq("id", createdVideo.id);

        failed.push({ videoId: video.id, reason: memberLinkError.message });
        continue;
      }
    }

    imported.push(video.id);
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

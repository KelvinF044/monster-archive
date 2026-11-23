import { NextRequest, NextResponse } from "next/server";

import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";

const MAX_BULK_PUBLISH = 20;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RequestBody = {
  videoIds?: unknown;
};

export async function POST(request: NextRequest) {
  const admin = await requireActiveAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 401 }
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

  if (!Array.isArray(body.videoIds)) {
    return NextResponse.json(
      { error: "Choose one or more draft videos." },
      { status: 400 }
    );
  }

  const videoIds = Array.from(new Set(body.videoIds));

  if (
    videoIds.length === 0 ||
    videoIds.length > MAX_BULK_PUBLISH ||
    videoIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))
  ) {
    return NextResponse.json(
      { error: "Select between 1 and 20 valid video records." },
      { status: 400 }
    );
  }

  const { data: existingVideos, error: lookupError } = await admin.supabase
    .from("watch_videos")
    .select("id, status")
    .in("id", videoIds);

  if (lookupError) {
    return NextResponse.json(
      { error: "Could not verify the selected videos." },
      { status: 500 }
    );
  }

  const existingIds = new Set((existingVideos ?? []).map((video) => video.id));
  const missingIds = videoIds.filter((id) => !existingIds.has(id));
  const nonDraftIds = (existingVideos ?? [])
    .filter((video) => video.status !== "draft")
    .map((video) => video.id);

  if (missingIds.length > 0 || nonDraftIds.length > 0) {
    return NextResponse.json(
      {
        error:
          "Some selected records are missing or are no longer drafts. Refresh the list before publishing.",
        missingCount: missingIds.length,
        nonDraftCount: nonDraftIds.length,
      },
      { status: 409 }
    );
  }

  const { data: publishedVideos, error: publishError } = await admin.supabase
    .from("watch_videos")
    .update({ status: "published" })
    .in("id", videoIds)
    .eq("status", "draft")
    .select("id");

  if (publishError) {
    return NextResponse.json(
      {
        error:
          "Could not publish the selected videos. Check administrator permissions and try again.",
      },
      { status: 500 }
    );
  }

  const publishedIds = new Set((publishedVideos ?? []).map((video) => video.id));
  const skippedCount = videoIds.filter((id) => !publishedIds.has(id)).length;

  if (publishedIds.size === 0) {
    return NextResponse.json(
      { error: "No videos were published. Refresh the list and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    publishedCount: publishedIds.size,
    skippedCount,
  });
}

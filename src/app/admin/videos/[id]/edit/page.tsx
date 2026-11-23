import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import AdminVideoForm from "@/components/AdminVideoForm";
import AdminText from "@/components/AdminText";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function EditVideoLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-4 w-48 rounded bg-purple-400/20" />

        <div className="mt-5 h-12 w-80 rounded bg-white/10" />

        <div className="mt-10 h-64 rounded-xl border border-white/10 bg-white/[0.03]" />

        <div className="mt-8 h-52 rounded-xl border border-white/10 bg-white/[0.03]" />
      </div>
    </main>
  );
}

export default function EditVideoPage({ params }: PageProps) {
  return (
    <Suspense fallback={<EditVideoLoading />}>
      <EditVideoContent params={params} />
    </Suspense>
  );
}

async function EditVideoContent({ params }: PageProps) {
  await connection();

  const { id } = await params;

  const supabase = await createClient();

  // --------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?access=denied");
  }

  // --------------------------------------------------
  // LOAD VIDEO
  // --------------------------------------------------

  const { data: video, error: videoError } = await supabase
    .from("watch_videos")
    .select(`
      id,
      slug,
      title,
      description,
      published_at,
      youtube_video_id,
      source_name,
      status,
      is_featured,
      era,
      era_id,
      metadata_source,
      youtube_metadata_refreshed_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (videoError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-black text-red-400">
            <AdminText>Unable to load video</AdminText>
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {videoError.message}
          </p>

          <Link
            href="/admin/videos"
            className="mt-8 inline-block text-sm font-bold text-purple-400"
          >
            <AdminText>← BACK TO VIDEOS</AdminText>
          </Link>
        </div>
      </main>
    );
  }

  if (!video) {
    notFound();
  }

  // --------------------------------------------------
  // LOAD COLLECTIONS, MEMBERS AND RELATIONSHIPS
  // --------------------------------------------------

  const [
    collectionsResult,
    membersResult,
    collectionLinksResult,
    memberLinksResult,
    erasResult,
  ] = await Promise.all([
    supabase
      .from("watch_collections")
      .select("id, slug, title, category")
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("members")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("watch_video_collections")
      .select("collection_id")
      .eq("video_id", id),

    supabase
      .from("watch_video_members")
      .select("member_id")
      .eq("video_id", id),

    supabase
      .from("watch_eras")
      .select("id, name, slug, display_order, is_active")
      .order("display_order")
      .order("name"),
  ]);

  const relationError =
    collectionsResult.error ||
    membersResult.error ||
    collectionLinksResult.error ||
    memberLinksResult.error ||
    erasResult.error;

  if (relationError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-black text-red-400">
            <AdminText><AdminText>Unable to load video</AdminText> relationships</AdminText>
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {relationError.message}
          </p>

          <Link
            href="/admin/videos"
            className="mt-8 inline-block text-sm font-bold text-purple-400"
          >
            <AdminText>← BACK TO VIDEOS</AdminText>
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // PREPARE INITIAL FORM DATA
  // --------------------------------------------------

  const initialVideo = {
    id: video.id,
    slug: video.slug,
    title: video.title,
    description: video.description,
    published_at: video.published_at,
    youtube_video_id: video.youtube_video_id,
    source_name: video.source_name,
    status: video.status === "published"
      ? "published" as const
      : "draft" as const,
    is_featured: video.is_featured ?? false,
    era: video.era,
    era_id: video.era_id,
    metadata_source: video.metadata_source ?? "manual",
    youtube_metadata_refreshed_at: video.youtube_metadata_refreshed_at,
    collectionIds: (collectionLinksResult.data ?? []).map(
      (item) => item.collection_id
    ),
    memberIds: (memberLinksResult.data ?? []).map(
      (item) => item.member_id
    ),
  };

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="border-b border-white/10 pb-8">
          <Link
            href="/admin/videos"
            className="text-xs font-bold text-zinc-500 transition hover:text-white"
          >
            <AdminText>← BACK TO VIDEO MANAGEMENT</AdminText>
          </Link>

          <p className="mt-8 text-xs font-bold tracking-[0.3em] text-purple-400">
            <AdminText>MONSTER ARCHIVE / CONTENT / EDIT</AdminText>
          </p>

          <h1 className="mt-3 break-words text-4xl font-black">
            <AdminText>Edit video.</AdminText>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            <AdminText>Update the video information, era, collections, participating members and publication settings.</AdminText>
          </p>

          <p className="mt-4 break-all text-xs text-zinc-600">
            <AdminText>VIDEO ID:</AdminText> {video.id}
          </p>
        </div>

        <div className="mt-10">
          <AdminVideoForm
            collections={collectionsResult.data ?? []}
            members={membersResult.data ?? []}
            eras={erasResult.data ?? []}
            initialVideo={initialVideo}
          />
        </div>
      </div>
    </main>
  );
}
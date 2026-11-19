
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Collection = {
  id: string;
  slug: string;
  title: string;
  category: string;
};

type Member = {
  id: string;
  slug: string;
  name: string;
};

type Props = {
  collections: Collection[];
  members: Member[];
};

type VideoStatus = "draft" | "published";

function extractYouTubeId(value: string): string | null {
  const input = value.trim();

  // Also accepts a plain 11-character YouTube video ID.
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    const validHosts = [
      "youtube.com",
      "m.youtube.com",
      "youtube-nocookie.com",
    ];

    if (!validHosts.includes(host)) {
      return null;
    }

    const watchId = url.searchParams.get("v");

    if (watchId) {
      return watchId;
    }

    const segments = url.pathname.split("/").filter(Boolean);

    if (["embed", "shorts", "live"].includes(segments[0] ?? "")) {
      return segments[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

export default function AdminVideoForm({
  collections,
  members,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [sourceName, setSourceName] = useState(
    "BABYMONSTER Official YouTube"
  );

  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [status, setStatus] = useState<VideoStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleSelection(
    id: string,
    current: string[],
    update: (value: string[]) => void
  ) {
    update(
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanTitle = title.trim();
    const cleanSource = sourceName.trim();
    const slug = createSlug(cleanTitle);
    const youtubeId = extractYouTubeId(youtubeUrl);

    if (!cleanTitle || !slug) {
      setError("Please enter a valid video title.");
      return;
    }

    if (!youtubeId || !/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
      setError("Invalid YouTube link. Check the video URL.");
      return;
    }

    if (!cleanSource) {
      setError("Please enter the original video source.");
      return;
    }

    if (selectedCollections.length === 0) {
      setError("Select at least one collection.");
      return;
    }

    if (
      publishedAt &&
      !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)
    ) {
      setError("Please enter a valid publication date.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      // 1. Create the video.
      const { data: video, error: videoError } = await supabase
        .from("watch_videos")
        .insert({
          slug,
          title: cleanTitle,
          description: description.trim() || null,
          published_at: publishedAt || null,
          youtube_video_id: youtubeId,
          source_name: cleanSource,
          source_url: `https://www.youtube.com/watch?v=${youtubeId}`,
          status,
          is_featured: isFeatured,
        })
        .select("id, slug")
        .single();

      if (videoError) {
        if (videoError.code === "23505") {
          throw new Error(
            "This video or its address is already registered. Check the title and YouTube link."
          );
        }

        if (videoError.code === "42501") {
          throw new Error(
            "You are not authorized to register videos. Please sign in with an active administrator account."
          );
        }

        throw new Error(videoError.message);
      }

      // 2. Connect the selected collections.
      const collectionLinks = selectedCollections.map((collectionId) => ({
        video_id: video.id,
        collection_id: collectionId,
        display_order: 0,
      }));

      const { error: collectionError } = await supabase
        .from("watch_video_collections")
        .insert(collectionLinks);

      if (collectionError) {
        await supabase
          .from("watch_videos")
          .delete()
          .eq("id", video.id);

        throw new Error(
          `Could not connect the collections: ${collectionError.message}`
        );
      }

      // 3. Connect participating members, if selected.
      if (selectedMembers.length > 0) {
        const memberLinks = selectedMembers.map((memberId) => ({
          video_id: video.id,
          member_id: memberId,
        }));

        const { error: memberError } = await supabase
          .from("watch_video_members")
          .insert(memberLinks);

        if (memberError) {
          await supabase
            .from("watch_videos")
            .delete()
            .eq("id", video.id);

          throw new Error(
            `Could not connect the members: ${memberError.message}`
          );
        }
      }

      setSuccess("Video registered successfully!");

      router.push("/admin/videos");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* BASIC INFORMATION */}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

        <h2 className="text-xl font-black">
          Video information
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Enter the basic details of the original video.
        </p>

        <div className="mt-7 space-y-6">

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              VIDEO TITLE *
            </label>

            <input
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: BABYMONSTER - SHEESH Performance"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-purple-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              YOUTUBE URL *
            </label>

            <input
              required
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-purple-400"
            />

            <p className="mt-2 text-xs text-zinc-600">
              Standard links, Shorts, youtu.be and embed links are supported.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              DESCRIPTION
            </label>

            <textarea
              rows={4}
              maxLength={3000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the video and provide additional context..."
              className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-purple-400"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
                PUBLICATION DATE
              </label>

              <input
                type="date"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
                ORIGINAL SOURCE *
              </label>

              <input
                required
                maxLength={150}
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="Original YouTube channel or broadcaster"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />
            </div>

          </div>

        </div>

      </section>

      {/* COLLECTIONS */}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

        <h2 className="text-xl font-black">
          Collections *
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Select one or more collections for this video.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">

          {collections.map((collection) => (
            <label
              key={collection.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                selectedCollections.includes(collection.id)
                  ? "border-purple-400 bg-purple-400/10"
                  : "border-white/10 bg-black/20 hover:border-white/30"
              }`}
            >

              <input
                type="checkbox"
                checked={selectedCollections.includes(collection.id)}
                onChange={() =>
                  toggleSelection(
                    collection.id,
                    selectedCollections,
                    setSelectedCollections
                  )
                }
                className="mt-1 h-4 w-4 accent-purple-500"
              />

              <span>
                <span className="block text-sm font-bold">
                  {collection.title}
                </span>

                <span className="mt-1 block text-xs text-zinc-500">
                  {collection.category}
                </span>
              </span>

            </label>
          ))}

        </div>

      </section>

      {/* MEMBERS */}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

        <h2 className="text-xl font-black">
          Participating members
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Select the members who appear in this content. This field is optional.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

          {members.map((member) => (
            <label
              key={member.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                selectedMembers.includes(member.id)
                  ? "border-purple-400 bg-purple-400/10"
                  : "border-white/10 bg-black/20 hover:border-white/30"
              }`}
            >

              <input
                type="checkbox"
                checked={selectedMembers.includes(member.id)}
                onChange={() =>
                  toggleSelection(
                    member.id,
                    selectedMembers,
                    setSelectedMembers
                  )
                }
                className="h-4 w-4 accent-purple-500"
              />

              <span className="text-sm font-bold">
                {member.name}
              </span>

            </label>
          ))}

        </div>

      </section>

      {/* PUBLICATION SETTINGS */}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

        <h2 className="text-xl font-black">
          Publication settings
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              VIDEO STATUS
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as VideoStatus)
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            >
              <option value="draft">Draft — Not visible publicly</option>
              <option value="published">Published — Visible in WATCH</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
              className="h-4 w-4 accent-purple-500"
            />

            <span>
              <span className="block text-sm font-bold">
                Featured content
              </span>

              <span className="mt-1 block text-xs text-zinc-500">
                Mark this video as featured for future homepage sections.
              </span>
            </span>
          </label>

        </div>

      </section>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/10 p-5 text-sm text-green-400"
        >
          {success}
        </div>
      )}

      {/* ACTIONS */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <Link
          href="/admin/videos"
          className="rounded-lg border border-white/10 px-6 py-4 text-xs font-bold text-zinc-400 transition hover:text-white"
        >
          CANCEL
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-white px-8 py-4 text-xs font-black text-black transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "SAVING VIDEO..." : "SAVE VIDEO →"}
        </button>

      </div>

    </form>
  );
}

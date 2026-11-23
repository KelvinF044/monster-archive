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

type Era = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
};

type VideoStatus = "draft" | "published";

type InitialVideo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published_at: string | null;
  youtube_video_id: string;
  source_name: string;
  status: VideoStatus;
  is_featured: boolean;
  era: string | null;
  era_id: string | null;
  collectionIds: string[];
  memberIds: string[];
};

type Props = {
  collections: Collection[];
  members: Member[];
  eras: Era[];
  initialVideo?: InitialVideo | null;
};

function extractYouTubeId(value: string): string | null {
  const input = value.trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    const host = url.hostname
      .replace(/^www\./i, "")
      .toLowerCase();

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
  eras,
  initialVideo = null,
}: Props) {
  const router = useRouter();

  const isEditing = Boolean(initialVideo);

  const [title, setTitle] = useState(
    initialVideo?.title ?? ""
  );

  const [description, setDescription] = useState(
    initialVideo?.description ?? ""
  );

  const [youtubeUrl, setYoutubeUrl] = useState(
    initialVideo?.youtube_video_id
      ? `https://www.youtube.com/watch?v=${initialVideo.youtube_video_id}`
      : ""
  );

  const [publishedAt, setPublishedAt] = useState(
    initialVideo?.published_at?.slice(0, 10) ?? ""
  );

  const [sourceName, setSourceName] = useState(
    initialVideo?.source_name ?? "BABYMONSTER Official YouTube"
  );

  const legacyEra = initialVideo?.era
    ?.trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("en-US");

  const initialEraId =
    initialVideo?.era_id ??
    eras.find(
      (item) => item.name.toLocaleUpperCase("en-US") === legacyEra
    )?.id ??
    "";

  const [selectedEraId, setSelectedEraId] = useState(initialEraId);

  const [selectedCollections, setSelectedCollections] =
    useState<string[]>(
      initialVideo?.collectionIds ?? []
    );

  const [selectedMembers, setSelectedMembers] =
    useState<string[]>(
      initialVideo?.memberIds ?? []
    );

  const [status, setStatus] = useState<VideoStatus>(
    initialVideo?.status ?? "draft"
  );

  const [isFeatured, setIsFeatured] = useState(
    initialVideo?.is_featured ?? false
  );

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanTitle = title.trim();
    const cleanSource = sourceName.trim();
    const slug = createSlug(cleanTitle);
    const selectedEraRecord =
      eras.find((item) => item.id === selectedEraId) ?? null;
    const youtubeId = extractYouTubeId(youtubeUrl);

    if (!cleanTitle || !slug) {
      setError("Please enter a valid video title.");
      return;
    }

    if (
      !youtubeId ||
      !/^[A-Za-z0-9_-]{11}$/.test(youtubeId)
    ) {
      setError("Invalid YouTube link. Check the video URL.");
      return;
    }

    if (!cleanSource) {
      setError("Please enter the original video source.");
      return;
    }

    if (selectedEraId && !selectedEraRecord) {
      setError("The selected era is no longer available. Refresh and choose an active era.");
      return;
    }

    if (
      selectedEraRecord &&
      !selectedEraRecord.is_active &&
      selectedEraRecord.id !== initialEraId
    ) {
      setError("Inactive eras cannot be assigned to new videos.");
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

    const supabase = createClient();

    const videoPayload = {
      slug,
      title: cleanTitle,
      description: description.trim() || null,
      published_at: publishedAt || null,
      youtube_video_id: youtubeId,
      source_name: cleanSource,
      source_url: `https://www.youtube.com/watch?v=${youtubeId}`,
      status,
      is_featured: isFeatured,
      // Keep the legacy text column synchronized during the transition.
      era: selectedEraRecord?.name ?? null,
      era_id: selectedEraRecord?.id ?? null,
    };

    try {
      // --------------------------------------------------
      // EDIT EXISTING VIDEO
      // --------------------------------------------------

      if (initialVideo) {
        const previousCollections =
          initialVideo.collectionIds;

        const previousMembers =
          initialVideo.memberIds;

        const collectionsToAdd = selectedCollections.filter(
          (id) => !previousCollections.includes(id)
        );

        const collectionsToRemove = previousCollections.filter(
          (id) => !selectedCollections.includes(id)
        );

        const membersToAdd = selectedMembers.filter(
          (id) => !previousMembers.includes(id)
        );

        const membersToRemove = previousMembers.filter(
          (id) => !selectedMembers.includes(id)
        );

        let addedCollectionLinks = false;
        let addedMemberLinks = false;

        // Add new collection relationships first.

        if (collectionsToAdd.length > 0) {
          const collectionLinks = collectionsToAdd.map(
            (collectionId) => ({
              video_id: initialVideo.id,
              collection_id: collectionId,
              display_order: 0,
            })
          );

          const { error: collectionError } = await supabase
            .from("watch_video_collections")
            .insert(collectionLinks);

          if (collectionError) {
            throw new Error(
              `Could not add collections: ${collectionError.message}`
            );
          }

          addedCollectionLinks = true;
        }

        // Add new member relationships.

        if (membersToAdd.length > 0) {
          const memberLinks = membersToAdd.map(
            (memberId) => ({
              video_id: initialVideo.id,
              member_id: memberId,
            })
          );

          const { error: memberError } = await supabase
            .from("watch_video_members")
            .insert(memberLinks);

          if (memberError) {
            if (addedCollectionLinks) {
              await supabase
                .from("watch_video_collections")
                .delete()
                .eq("video_id", initialVideo.id)
                .in("collection_id", collectionsToAdd);
            }

            throw new Error(
              `Could not add participating members: ${memberError.message}`
            );
          }

          addedMemberLinks = true;
        }

        // Update the main video information.

        const { error: updateError } = await supabase
          .from("watch_videos")
          .update(videoPayload)
          .eq("id", initialVideo.id);

        if (updateError) {
          // Roll back newly added relationships if the main update fails.

          if (addedCollectionLinks) {
            await supabase
              .from("watch_video_collections")
              .delete()
              .eq("video_id", initialVideo.id)
              .in("collection_id", collectionsToAdd);
          }

          if (addedMemberLinks) {
            await supabase
              .from("watch_video_members")
              .delete()
              .eq("video_id", initialVideo.id)
              .in("member_id", membersToAdd);
          }

          if (updateError.code === "23505") {
            throw new Error(
              "Another video already uses this title or slug. Please choose a different title."
            );
          }

          if (updateError.code === "42501") {
            throw new Error(
              "You are not authorized to edit videos. Please sign in with an active administrator account."
            );
          }

          throw new Error(updateError.message);
        }

        // --------------------------------------------------
        // REMOVE OLD RELATIONSHIPS
        // --------------------------------------------------

        let removalErrorMessage = "";

        if (collectionsToRemove.length > 0) {
          const { error: collectionRemovalError } = await supabase
            .from("watch_video_collections")
            .delete()
            .eq("video_id", initialVideo.id)
            .in("collection_id", collectionsToRemove);

          if (collectionRemovalError) {
            removalErrorMessage =
              collectionRemovalError.message;
          }
        }

        if (membersToRemove.length > 0) {
          const { error: memberRemovalError } = await supabase
            .from("watch_video_members")
            .delete()
            .eq("video_id", initialVideo.id)
            .in("member_id", membersToRemove);

          if (memberRemovalError && !removalErrorMessage) {
            removalErrorMessage =
              memberRemovalError.message;
          }
        }

        if (removalErrorMessage) {
          router.refresh();

          throw new Error(
            `The video information was updated, but some old relationships could not be removed. Please reopen the video and review its collections and members. Details: ${removalErrorMessage}`
          );
        }

        setSuccess("Video updated successfully!");

        router.push("/admin/videos");
        router.refresh();

        return;
      }

      // --------------------------------------------------
      // CREATE NEW VIDEO
      // --------------------------------------------------

      const { data: video, error: videoError } = await supabase
        .from("watch_videos")
        .insert(videoPayload)
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

      // Connect selected collections.

      const collectionLinks = selectedCollections.map(
        (collectionId) => ({
          video_id: video.id,
          collection_id: collectionId,
          display_order: 0,
        })
      );

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

      // Connect selected members.

      if (selectedMembers.length > 0) {
        const memberLinks = selectedMembers.map(
          (memberId) => ({
            video_id: video.id,
            member_id: memberId,
          })
        );

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
            <label
              htmlFor="video-title"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              VIDEO TITLE *
            </label>

            <input
              id="video-title"
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: BABYMONSTER - SHEESH Performance"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-purple-400"
            />
          </div>

          <div>
            <label
              htmlFor="youtube-url"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              YOUTUBE URL *
            </label>

            <input
              id="youtube-url"
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
            <label
              htmlFor="video-description"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              DESCRIPTION
            </label>

            <textarea
              id="video-description"
              rows={4}
              maxLength={3000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the video and provide additional context..."
              className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-purple-400"
            />
          </div>

          {/* ERA */}

          <div>
            <label
              htmlFor="video-era"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              ERA (OPTIONAL)
            </label>

            <select
              id="video-era"
              value={selectedEraId}
              onChange={(event) => setSelectedEraId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
            >
              <option value="">No era / Not era-specific</option>

              {eras
                .filter(
                  (item) =>
                    item.is_active || item.id === selectedEraId
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {!item.is_active ? " — INACTIVE (CURRENT VIDEO)" : ""}
                  </option>
                ))}
            </select>

            <p className="mt-2 text-xs leading-6 text-zinc-600">
              Choose an era from the central catalog. New videos can only
              be assigned to active eras. Manage the catalog in{" "}
              <Link
                href="/admin/eras"
                className="font-bold text-purple-300 transition hover:text-purple-200"
              >
                Era Management
              </Link>
              .
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">

            <div>
              <label
                htmlFor="published-at"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
              >
                PUBLICATION DATE
              </label>

              <input
                id="published-at"
                type="date"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label
                htmlFor="source-name"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
              >
                ORIGINAL SOURCE *
              </label>

              <input
                id="source-name"
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
            <label
              htmlFor="video-status"
              className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
            >
              VIDEO STATUS
            </label>

            <select
              id="video-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as VideoStatus)
              }
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            >
              <option value="draft">
                Draft — Not visible publicly
              </option>

              <option value="published">
                Published — Visible in WATCH
              </option>
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
          {saving
            ? isEditing
              ? "UPDATING VIDEO..."
              : "SAVING VIDEO..."
            : isEditing
              ? "UPDATE VIDEO →"
              : "SAVE VIDEO →"}
        </button>
      </div>
    </form>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useAdminText } from "@/components/useAdminText";

type AdminVideo = {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  source_name: string;
  source_url: string;
  created_at: string;
  era: string | null;
  era_id: string | null;
};

type Props = {
  videos: AdminVideo[];
};

type PublishResponse = {
  publishedCount?: number;
  skippedCount?: number;
  error?: string;
};

export default function AdminVideoBulkList({ videos }: Props) {
  const t = useAdminText();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const draftVideos = useMemo(
    () => videos.filter((video) => video.status === "draft"),
    [videos]
  );

  const selectedVideos = useMemo(
    () =>
      videos.filter(
        (video) =>
          selectedIds.includes(video.id) && video.status === "draft"
      ),
    [videos, selectedIds]
  );

  const selectedCount = selectedVideos.length;
  const allDraftsSelected =
    draftVideos.length > 0 &&
    draftVideos.every((video) => selectedIds.includes(video.id));

  function toggleVideo(videoId: string) {
    setSelectedIds((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId]
    );
    setFeedback(null);
  }

  function toggleAllDrafts() {
    const draftIds = draftVideos.map((video) => video.id);

    setSelectedIds((current) => {
      if (allDraftsSelected) {
        return current.filter((id) => !draftIds.includes(id));
      }

      return Array.from(new Set([...current, ...draftIds]));
    });
    setFeedback(null);
  }

  async function publishSelected() {
    if (selectedCount === 0 || saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/videos/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIds: selectedVideos.map((video) => video.id),
        }),
      });

      const result = (await response.json().catch(() => null)) as PublishResponse | null;

      if (!response.ok) {
        throw new Error(
          result?.error || t("Could not publish selected videos. Try again.")
        );
      }

      const publishedCount = result?.publishedCount ?? 0;
      const skippedCount = result?.skippedCount ?? 0;

      setSelectedIds([]);
      setConfirmOpen(false);

      if (publishedCount === 0) {
        setFeedback({
          type: "error",
          message: t("No videos were published. Refresh the list and try again."),
        });
      } else if (skippedCount > 0) {
        setFeedback({
          type: "success",
          message:
            String(publishedCount) +
            " " +
            t("videos published successfully.") +
            " " +
            String(skippedCount) +
            " " +
            t("were skipped because they were no longer drafts."),
        });
      } else {
        setFeedback({
          type: "success",
          message:
            String(publishedCount) + " " + t("videos published successfully."),
        });
      }

      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : t("Could not publish selected videos. Try again."),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {draftVideos.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-purple-400/20 bg-purple-400/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-zinc-200">
              <input
                type="checkbox"
                checked={allDraftsSelected}
                onChange={toggleAllDrafts}
                className="h-4 w-4 accent-purple-500"
                aria-label={t("Select all draft videos on this page")}
              />
              {t("Select all draft videos on this page")}
            </label>
            <span className="text-xs text-zinc-500">
              {draftVideos.length} {t("drafts available on this page")}
            </span>
          </div>

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg bg-purple-500 px-5 py-3 text-xs font-black text-white transition hover:bg-purple-400"
            >
              {t("PUBLISH SELECTED")} ({selectedCount})
            </button>
          )}
        </section>
      )}

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={
            feedback.type === "error"
              ? "rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
              : "rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300"
          }
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-3">
        {videos.map((video) => (
          <article
            key={video.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-purple-400/30"
          >
            {video.status === "draft" ? (
              <label className="flex shrink-0 cursor-pointer items-center self-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(video.id)}
                  onChange={() => toggleVideo(video.id)}
                  className="h-4 w-4 accent-purple-500"
                  aria-label={t("Select draft") + ": " + video.title}
                />
              </label>
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="break-words font-bold">{video.title}</p>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                <span>{video.published_at || t("Date not registered")}</span>
                <span>{video.source_name}</span>
                {video.era && (
                  <span className="font-bold text-purple-300">
                    {t("ERA:")} {video.era}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={
                  "rounded-full px-3 py-2 text-[10px] font-bold uppercase " +
                  (video.status === "published"
                    ? "bg-green-500/10 text-green-400"
                    : video.status === "draft"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-zinc-500/10 text-zinc-400")
                }
              >
                {video.status === "published"
                  ? t("Published")
                  : video.status === "draft"
                    ? t("Draft")
                    : video.status}
              </span>

              <a
                href={video.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-purple-400 transition hover:text-purple-300"
              >
                {t("SOURCE ↗")}
              </a>

              <Link
                href={"/admin/videos/" + video.id + "/edit"}
                className="rounded-lg border border-purple-400/30 px-4 py-2 text-xs font-bold text-purple-300 transition hover:border-purple-400 hover:bg-purple-400/10"
              >
                {t("EDIT")}
              </Link>
            </div>
          </article>
        ))}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setConfirmOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-publish-title"
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101116] p-6 shadow-2xl"
          >
            <p className="text-xs font-bold tracking-[0.25em] text-purple-400">
              {t("FINAL REVIEW")}
            </p>
            <h2 id="bulk-publish-title" className="mt-3 text-2xl font-black text-white">
              {t("Confirm bulk publication")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {t("You are about to publish the following selected drafts.")}
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold text-zinc-400">
                {selectedCount} {t("videos selected")}
              </p>
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {selectedVideos.map((video) => (
                  <li
                    key={video.id}
                    className="break-words text-sm text-zinc-200"
                  >
                    {video.title}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-500">
              {t("Only these videos will be published. Their collection, era and member assignments will remain unchanged.")}
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-white/10 px-5 py-3 text-xs font-bold text-zinc-300 transition hover:border-white/30 disabled:opacity-50"
              >
                {t("CANCEL")}
              </button>
              <button
                type="button"
                disabled={saving || selectedCount === 0}
                onClick={publishSelected}
                className="rounded-lg bg-purple-500 px-5 py-3 text-xs font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t("PUBLISHING...") : t("CONFIRM PUBLISH")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

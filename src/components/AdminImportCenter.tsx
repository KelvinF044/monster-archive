"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import AdminImportVideoReview from "@/components/AdminImportVideoReview";
import AdminImportSuggestionPanel from "@/components/AdminImportSuggestionPanel";
import {
  IMPORT_BATCH_LIMIT,
  applyImportSuggestionToBatch,
  resolveImportClassification,
  type ImportReviewOverride,
} from "@/lib/admin/import/review";

import { createClient } from "@/lib/supabase/client";
import { useAdminText } from "@/components/useAdminText";
import { useAdminLocale } from "@/components/AdminLocaleProvider";

type Collection = {
  id: string;
  slug: string;
  title: string;
  category: string;
};

type Era = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
};

type Member = {
  id: string;
  slug: string;
  name: string;
};

type ImportSource = {
  id: string;
  name: string;
  playlist_id: string;
  playlist_url: string;
  default_collection_id: string;
  default_era_id: string | null;
  is_active: boolean;
  last_scanned_at: string | null;
  created_at: string;
};

type Candidate = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  playlistAddedAt: string | null;
  position: number;
  alreadyRegistered: boolean;
  youtubeUrl: string;
};

type Props = {
  initialSources: ImportSource[];
  collections: Collection[];
  eras: Era[];
  members: Member[];
  apiConfigured: boolean;
  refreshConfigured: boolean;
  aiEnabled: boolean;
};

function parsePlaylistId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      return null;
    }

    const playlistId = url.searchParams.get("list");

    return playlistId && /^[A-Za-z0-9_-]{10,100}$/.test(playlistId)
      ? playlistId
      : null;
  } catch {
    return null;
  }
}

function mergeCandidates(current: Candidate[], incoming: Candidate[]): Candidate[] {
  const byVideoId = new Map(current.map((candidate) => [candidate.videoId, candidate]));
  for (const candidate of incoming) {
    if (!byVideoId.has(candidate.videoId) || candidate.alreadyRegistered) {
      byVideoId.set(candidate.videoId, candidate);
    }
  }

  return Array.from(byVideoId.values());
}

function formatDate(value: string | null, locale: "en" | "pt-BR") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AdminImportCenter({
  initialSources,
  collections,
  eras,
  members,
  apiConfigured,
  refreshConfigured,
  aiEnabled,
}: Props) {
  const supabase = createClient();
  const t = useAdminText();
  const { locale } = useAdminLocale();

  const [sources, setSources] = useState(initialSources);
  const [sourceName, setSourceName] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [newCollectionId, setNewCollectionId] = useState(
    collections[0]?.id ?? ""
  );
  const [newEraId, setNewEraId] = useState("");
  const [savingSource, setSavingSource] = useState(false);

  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<Record<string, ImportReviewOverride>>({});

  const [batchCollectionId, setBatchCollectionId] = useState("");
  const [batchEraId, setBatchEraId] = useState("");
  const [batchMemberIds, setBatchMemberIds] = useState<string[]>([]);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importSummary, setImportSummary] = useState("");

  const activeSource = sources.find((source) => source.id === activeSourceId) ?? null;

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");

    if (!query) return candidates;

    return candidates.filter((candidate) =>
      candidate.title.toLocaleLowerCase("pt-BR").includes(query)
    );
  }, [candidates, search]);

  const availableCandidates = filteredCandidates.filter(
    (candidate) => !candidate.alreadyRegistered
  );

  const selectedCount = selectedIds.length;
  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.videoId));
  const reviewIds = selectedCandidates.map(candidate => candidate.videoId);
  const activeEras = eras.filter((era) => era.is_active);
  const batch = {
    collectionId: batchCollectionId,
    eraId: batchEraId || null,
    memberIds: batchMemberIds,
  };
  const items = selectedIds.map((videoId) => ({
    videoId,
    ...resolveImportClassification(batch, overrides[videoId]),
  }));
  const missingCollection = items.some((item) => !collections.some((collection) => collection.id === item.collectionId));
  const missingMvConfirmation = items.some((item) =>
    !item.officialMvConfirmed && collections.some(
      (collection) => collection.id === item.collectionId && collection.category === "MV"
    )
  );
  const importedCount = candidates.filter((candidate) => candidate.alreadyRegistered).length;

  function clearMessages() {
    setError("");
    setSuccess("");
    setImportSummary("");
  }

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const cleanName = sourceName.trim();
    const cleanUrl = playlistUrl.trim();
    const playlistId = parsePlaylistId(cleanUrl);

    if (!cleanName) {
      setError(t("Enter a name to identify this playlist."));
      return;
    }

    if (!playlistId) {
      setError(t("Enter a valid public YouTube playlist URL."));
      return;
    }

    if (!newCollectionId) {
      setError(t("Choose a default collection for this playlist."));
      return;
    }

    setSavingSource(true);

    const { data, error: insertError } = await supabase
      .from("watch_import_sources")
      .insert({
        name: cleanName,
        playlist_id: playlistId,
        playlist_url: cleanUrl,
        default_collection_id: newCollectionId,
        default_era_id: newEraId || null,
        is_active: true,
      })
      .select(
        "id, name, playlist_id, playlist_url, default_collection_id, default_era_id, is_active, last_scanned_at, created_at"
      )
      .single();

    if (insertError || !data) {
      setError(
        insertError?.code === "23505"
          ? t("This playlist is already registered.")
          : insertError?.message ?? t("Unable to register the playlist.")
      );
      setSavingSource(false);
      return;
    }

    setSources((current) => [data as ImportSource, ...current]);
    setSourceName("");
    setPlaylistUrl("");
    setNewEraId("");
    setActiveSourceId(data.id);
    setBatchCollectionId(data.default_collection_id);
    setBatchEraId(data.default_era_id ?? "");
    setCandidates([]);
    setSelectedIds([]);
    setSuccess(t("Playlist registered. You can now scan its videos."));
    setSavingSource(false);
  }

  async function toggleSource(source: ImportSource) {
    clearMessages();

    const nextActive = !source.is_active;

    const { error: updateError } = await supabase
      .from("watch_import_sources")
      .update({
        is_active: nextActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSources((current) =>
      current.map((item) =>
        item.id === source.id ? { ...item, is_active: nextActive } : item
      )
    );

    if (!nextActive && activeSourceId === source.id) {
      setActiveSourceId(null);
      setCandidates([]);
      setSelectedIds([]);
      setNextPageToken(null);
    }

    setSuccess(
      nextActive
        ? t("Source activated.")
        : t("Source deactivated. Existing imported videos were not changed.")
    );
  }

  async function saveSourceDefaults() {
    if (!activeSource || !batchCollectionId) {
      setError(t("Choose a default collection for this source."));
      return;
    }

    clearMessages();
    setSavingDefaults(true);

    const { error: updateError } = await supabase
      .from("watch_import_sources")
      .update({
        default_collection_id: batchCollectionId,
        default_era_id: batchEraId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeSource.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSources((current) =>
        current.map((source) =>
          source.id === activeSource.id
            ? {
                ...source,
                default_collection_id: batchCollectionId,
                default_era_id: batchEraId || null,
              }
            : source
        )
      );
      setSuccess(t("Playlist defaults updated."));
    }

    setSavingDefaults(false);
  }

  async function scanSource(source: ImportSource) {
    clearMessages();
    setActiveSourceId(source.id);
    setBatchCollectionId(source.default_collection_id);
    setBatchEraId(source.default_era_id ?? "");
    setCandidates([]);
    setSelectedIds([]);
    setOverrides({});
    setNextPageToken(null);
    setTotalResults(null);
    setSearch("");
    setLoadingPage(true);

    try {
      const response = await fetch(
        `/api/admin/import/playlist?sourceId=${encodeURIComponent(source.id)}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? t("Unable to scan the playlist."));
      }

      setCandidates(mergeCandidates([], result.items ?? []));
      setNextPageToken(result.nextPageToken ?? null);
      setTotalResults(result.totalResults ?? null);
      setSuccess(t("Playlist scanned. Results are loaded live from YouTube."));
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : t("Unexpected error while scanning the playlist.")
      );
    } finally {
      setLoadingPage(false);
    }
  }

  async function loadMore() {
    if (!activeSource || !nextPageToken) return;

    clearMessages();
    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        sourceId: activeSource.id,
        pageToken: nextPageToken,
      });
      const response = await fetch(
        `/api/admin/import/playlist?${params.toString()}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? t("Unable to load the next page."));
      }

      setCandidates((current) => mergeCandidates(current, result.items ?? []));
      setNextPageToken(result.nextPageToken ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("Unexpected error while loading more videos.")
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleCandidate(videoId: string) {
    setSelectedIds((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId]
    );
  }

  function toggleAllVisible() {
    const visibleIds = availableCandidates.map((candidate) => candidate.videoId);
    const everyVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      everyVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function toggleMember(memberId: string) {
    setBatchMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  async function importSelected() {
    if (!activeSource || selectedIds.length === 0 || importing || loadingMore) return;

    if (!refreshConfigured) {
      setError(
        t("Configure SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET in Vercel before importing. They keep YouTube metadata updated.")
      );
      return;
    }

    if (missingCollection) {
      setError(t("Choose a collection for each selected video."));
      return;
    }

    if (missingMvConfirmation) {
      setError(t("Review the selected videos that require official MV confirmation."));
      return;
    }

    if (selectedIds.length > IMPORT_BATCH_LIMIT) {
      setError(t("Import a maximum of 20 videos per batch."));
      return;
    }

    clearMessages();
    setImporting(true);

    try {
      const response = await fetch("/api/admin/import/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: activeSource.id,
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(t(result.error ?? "Unable to import videos."));
      }

      const registered = new Set<string>([
        ...(result.imported ?? []),
        ...(result.duplicates ?? []),
      ]);
      const unavailable = new Set<string>(result.unavailable ?? []);

      setCandidates((current) =>
        current.map((candidate) =>
          registered.has(candidate.videoId)
            ? { ...candidate, alreadyRegistered: true }
            : candidate
        )
      );
      setSelectedIds((current) => current.filter((id) => !registered.has(id) && !unavailable.has(id)));

      const summary = [
        `${result.importedCount ?? 0} ${t("saved as drafts")}`,
        result.duplicates?.length ? `${result.duplicates.length} ${t("already registered")}` : "",
        result.unavailable?.length ? `${result.unavailable.length} ${t("unavailable")}` : "",
        result.failed?.length ? `${result.failed.length} ${t("failed")}` : "",
      ].filter(Boolean).join(" · ");

      setImportSummary(summary);

      if (result.failed?.length) {
        setError(
          result.failed
            .map((item: { videoId: string; reason: string }) => {
              const title = candidates.find((candidate) => candidate.videoId === item.videoId)?.title;
              return `${title ?? item.videoId} · ${t(item.reason)}`;
            })
            .join("\n")
        );
      } else if (result.importedCount > 0) {
        setSuccess(t("Batch imported. Videos are saved as drafts and are not publicly visible yet."));
      }
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : t("Unexpected error while importing the batch.")
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-9">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("PLAYLIST SOURCES"), value: sources.length },
          { label: t("ACTIVE SOURCES"), value: sources.filter((source) => source.is_active).length },
          { label: t("VIDEOS IN CURRENT REVIEW"), value: candidates.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-[10px] font-bold tracking-widest text-zinc-500">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-black">{item.value}</p>
          </div>
        ))}
      </section>

      {!apiConfigured && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
          <p className="font-bold text-amber-200">{t("YouTube API not configured.")}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t("Add YOUTUBE_API_KEY to the server environment to query public playlists. Never send the key to the browser or publish it to GitHub.")}
          </p>
        </div>
      )}

      {apiConfigured && !refreshConfigured && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
          <p className="font-bold text-amber-200">{t("Import is waiting for the metadata refresh configuration.")}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t("Playlist lookup is available. To approve videos, also configure SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET in Vercel. The importer only enables registration after scheduled metadata refresh is configured.")}
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 whitespace-pre-line">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          {success}
        </div>
      )}

      {importSummary && (
        <div className="rounded-lg border border-purple-400/20 bg-purple-400/5 p-4 text-sm text-purple-200">
          {importSummary}
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-bold tracking-[0.25em] text-purple-400">
            {t("YOUTUBE SOURCES")}
          </p>
          <h2 className="mt-3 text-2xl font-black">{t("Add a playlist source.")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            {t("Register official public playlists and set a default classification to make batch review easier.")}
          </p>
        </div>

        <form onSubmit={addSource} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="source-name" className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              {t("SOURCE NAME *")}
            </label>
            <input
              id="source-name"
              required
              maxLength={80}
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder={t("Example: BABYMONSTER — DRIP playlist")}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label htmlFor="playlist-url" className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              {t("YOUTUBE PLAYLIST URL *")}
            </label>
            <input
              id="playlist-url"
              required
              value={playlistUrl}
              onChange={(event) => setPlaylistUrl(event.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label htmlFor="source-default-collection" className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              {t("DEFAULT COLLECTION *")}
            </label>
            <select
              id="source-default-collection"
              required
              value={newCollectionId}
              onChange={(event) => setNewCollectionId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            >
              <option value="">{t("Choose a collection")}</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title} · {collection.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="source-default-era" className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
              {t("DEFAULT ERA (OPTIONAL)")}
            </label>
            <select
              id="source-default-era"
              value={newEraId}
              onChange={(event) => setNewEraId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            >
              <option value="">{t("No default era")}</option>
              {eras.filter((era) => era.is_active).map((era) => (
                <option key={era.id} value={era.id}>{era.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <p className="text-xs leading-5 text-zinc-600">
              {t("The collection and era are suggested defaults that you can configure. Each batch can be reviewed and adjusted before import.")}
            </p>
            <button
              type="submit"
              disabled={savingSource}
              className="rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingSource ? t("SAVING...") : t("ADD PLAYLIST SOURCE +")}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-purple-400">{t("REGISTERED SOURCES")}</p>
            <h2 className="mt-2 text-2xl font-black">{t("Playlist library.")}</h2>
            <p className="mt-2 text-sm text-zinc-500">{t("Choose an active source to fetch the next videos.")}</p>
          </div>
          <span className="text-xs text-zinc-600">{sources.length} {t("SOURCE(S)")}</span>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-lg font-bold">{t("No playlists registered.")}</p>
            <p className="mt-2 text-sm text-zinc-500">{t("Start by adding a public playlist from the official channel.")}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sources.map((source) => {
              const sourceCollection = collections.find((item) => item.id === source.default_collection_id);
              const sourceEra = eras.find((item) => item.id === source.default_era_id);

              return (
                <div
                  key={source.id}
                  className={`rounded-xl border p-5 transition ${
                    activeSourceId === source.id
                      ? "border-purple-400/40 bg-purple-400/[0.06]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">{source.name}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider ${
                          source.is_active ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-500"
                        }`}>
                          {source.is_active ? t("ACTIVE SOURCE") : t("INACTIVE SOURCE")}
                        </span>
                      </div>
                      <p className="mt-2 break-all text-xs text-zinc-500">{t("Playlist ID:")} {source.playlist_id}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {t("Default:")} {sourceCollection?.title ?? t("Collection not found")}
                        {sourceEra ? ` · ${sourceEra.name}` : ""}
                      </p>
                      {source.last_scanned_at && (
                        <p className="mt-2 text-[10px] text-zinc-600">
                          {t("Last scanned:")} {formatDate(source.last_scanned_at, locale)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={source.playlist_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-zinc-400 hover:text-white"
                      >
                        {t("OPEN YOUTUBE ↗")}
                      </a>
                      <button
                        type="button"
                        onClick={() => void toggleSource(source)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-zinc-400 hover:text-white"
                      >
                        {source.is_active ? t("DEACTIVATE") : t("ACTIVATE")}
                      </button>
                      <button
                        type="button"
                        disabled={!source.is_active || !apiConfigured || loadingPage || loadingMore || importing}
                        onClick={() => void scanSource(source)}
                        className="rounded-lg bg-white px-4 py-2 text-[10px] font-black text-black hover:bg-purple-200 disabled:opacity-40"
                      >
                        {loadingPage && activeSourceId === source.id ? t("SCANNING...") : t("SCAN PLAYLIST")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {activeSource && (
        <section className="space-y-5">
          <div className="border-b border-white/10 pb-5">
            <p className="text-xs font-bold tracking-[0.25em] text-purple-400">{t("IMPORT REVIEW")}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{activeSource.name}</h2>
                <p className="mt-2 text-sm text-zinc-500">{t("Temporary results fetched directly from YouTube.")}</p>
              </div>
              <span className="text-xs text-zinc-500">
                {totalResults !== null ? `${totalResults} ${t("ITEMS IN PLAYLIST")}` : ""}
              </span>
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-2">
            <div>
              <label htmlFor="batch-collection" className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
                {t("COLLECTION FOR THIS BATCH *")}
              </label>
              <select
                id="batch-collection"
                value={batchCollectionId}
                disabled={importing}
                onChange={(event) => setBatchCollectionId(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              >
                <option value="">{t("Choose a collection")}</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title} · {collection.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="batch-era" className="mb-2 block text-xs font-bold tracking-widest text-zinc-400">
                {t("ERA FOR THIS BATCH")}
              </label>
              <select
                id="batch-era"
                value={batchEraId}
                disabled={importing}
                onChange={(event) => setBatchEraId(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              >
                <option value="">{t("No era")}</option>
                {eras.filter((era) => era.is_active).map((era) => (
                  <option key={era.id} value={era.id}>{era.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold tracking-widest text-zinc-400">{t("MEMBERS IN THIS BATCH (OPTIONAL)")}</p>
                <span className="text-[10px] text-zinc-600">{batchMemberIds.length} {t("SELECTED")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const checked = batchMemberIds.includes(member.id);

                  return (
                    <label
                      key={member.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                        checked
                          ? "border-purple-400/50 bg-purple-500/15 text-white"
                          : "border-white/10 bg-black/20 text-zinc-500 hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={importing}
                        onChange={() => toggleMember(member.id)}
                        className="accent-purple-500"
                      />
                      {member.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 md:col-span-2">
              <button
                type="button"
                onClick={saveSourceDefaults}
                disabled={savingDefaults || !batchCollectionId}
                className="rounded-lg border border-white/10 px-4 py-3 text-[10px] font-bold text-zinc-300 hover:border-purple-400/40 disabled:opacity-40"
              >
                {savingDefaults ? t("SAVING...") : t("SAVE AS PLAYLIST DEFAULT")}
              </button>
              <p className="text-[10px] text-zinc-600">{t("All selected videos will be created as drafts.")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-zinc-400">
                {candidates.length} {t("LOADED")} · {importedCount} {t("ALREADY REGISTERED")}
              </p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Filter loaded videos...")}
              className="w-full max-w-xs rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-400"
            />
          </div>

          {candidates.length === 0 && !loadingPage ? (
            <div className="rounded-xl border border-dashed border-white/15 p-12 text-center">
              <p className="font-bold">{t("No videos loaded for this query.")}</p>
              <p className="mt-2 text-sm text-zinc-500">{t("Use Scan Playlist to load items from this source.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((candidate) => (
                <label
                  key={candidate.videoId}
                  className={`flex flex-col gap-4 rounded-xl border p-4 transition sm:flex-row sm:items-center ${
                    candidate.alreadyRegistered
                      ? "border-white/5 bg-white/[0.01] opacity-60"
                      : selectedIds.includes(candidate.videoId)
                        ? "border-purple-400/40 bg-purple-500/[0.06]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(candidate.videoId)}
                    disabled={candidate.alreadyRegistered || importing}
                    onChange={() => toggleCandidate(candidate.videoId)}
                    className="h-4 w-4 shrink-0 accent-purple-500"
                  />
                  <img
                    src={candidate.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full rounded-lg object-cover sm:w-40"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{candidate.title}</span>
                      {candidate.alreadyRegistered && (
                        <span className="rounded-full bg-green-500/10 px-2 py-1 text-[9px] font-bold text-green-400">
                          {t("ALREADY IN ARCHIVE")}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block text-xs text-zinc-500">
                      {candidate.channelTitle} · {t("Playlist position")} {candidate.position + 1}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-600">
                      {t("Added to playlist:")} {formatDate(candidate.playlistAddedAt, locale)}
                    </span>
                    <span className="mt-3 inline-block text-[10px] font-bold text-purple-300">
                      {t("YOUTUBE · ORIGINAL VIDEO")}
                    </span>
                  </span>
                  <a
                    href={candidate.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-zinc-400 hover:text-white"
                  >
                    {t("OPEN ↗")}
                  </a>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleAllVisible}
              disabled={availableCandidates.length === 0 || importing}
              className="text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-40"
            >
              {t("SELECT / DESELECT VISIBLE")}
            </button>

            {nextPageToken && (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore || importing}
                className="rounded-lg border border-white/10 px-5 py-3 text-xs font-bold text-zinc-300 hover:border-purple-400/40 disabled:opacity-50"
              >
                {loadingMore ? t("LOADING...") : t("LOAD NEXT 50")}
              </button>
            )}
          </div>

          {selectedCandidates.length > 0 && (
            <section aria-labelledby="import-video-review" className="space-y-3">
              <h3 id="import-video-review" className="text-lg font-bold text-white">{t("Review selected videos")}</h3>
              {aiEnabled && selectedCount > 1 && (
                <AdminImportSuggestionPanel
                  key={JSON.stringify([activeSource.id, ...reviewIds])}
                  videoIds={reviewIds}
                  sourceId={activeSource.id}
                  collections={collections}
                  eras={activeEras}
                  members={members}
                  disabled={importing || loadingMore}
                  canApply={(suggestion, individual) => applyImportSuggestionToBatch(batch, overrides, reviewIds, suggestion, individual) !== overrides}
                  onApply={(suggestion, individual) => setOverrides(current => applyImportSuggestionToBatch(batch, current, reviewIds, suggestion, individual))}
                />
              )}
              {selectedCandidates.map((candidate, index) => (
                <AdminImportVideoReview
                  key={candidate.videoId}
                  videoId={candidate.videoId}
                  title={selectedCount > 1 ? `${index + 1}. ${candidate.title}` : candidate.title}
                  sourceId={activeSource.id}
                  collections={collections}
                  eras={activeEras}
                  members={members}
                  batch={batch}
                  override={overrides[candidate.videoId]}
                  disabled={importing}
                  aiEnabled={aiEnabled && selectedCount === 1}
                  onChange={(override) => setOverrides((current) => ({
                    ...current,
                    [candidate.videoId]: override,
                  }))}
                />
              ))}
            </section>
          )}

          <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-purple-400/20 bg-[#101017]/95 p-4 shadow-2xl backdrop-blur">
            <div>
              <p className="font-black">{selectedCount} {t("VIDEO(S) SELECTED")}</p>
              <p className="mt-1 text-[10px] text-zinc-500">
                {t("Batch import · drafts · manual review before publication.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void importSelected()}
              disabled={
                importing ||
                loadingMore ||
                selectedCount === 0 ||
                selectedCount > IMPORT_BATCH_LIMIT ||
                missingCollection ||
                missingMvConfirmation ||
                !refreshConfigured
              }
              className="rounded-lg bg-purple-500 px-5 py-3 text-xs font-black text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {importing ? t("IMPORTING...") : t("IMPORT SELECTED AS DRAFTS →")}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-xs font-bold tracking-widest text-purple-300">{t("IMPORTANT")}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {t("Approved imports fetch current YouTube metadata and create drafts. Publication requires a separate confirmation.")}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
          <Link href="/admin/videos" className="text-purple-300 hover:text-purple-200">{t("OPEN VIDEO MANAGER →")}</Link>
          <Link href="/admin/eras" className="text-purple-300 hover:text-purple-200">{t("MANAGE ERAS →")}</Link>
        </div>
      </section>
    </div>
  );
}

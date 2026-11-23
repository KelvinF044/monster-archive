import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
  era?: string | string[];
  collection?: string | string[];
  page?: string | string[];
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const PAGE_SIZE = 20;

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function buildPageUrl(
  page: number,
  filters: {
    q: string;
    status: string;
    era: string;
    collection: string;
  }
) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.era) params.set("era", filters.era);
  if (filters.collection) {
    params.set("collection", filters.collection);
  }

  params.set("page", String(page));

  return `/admin/videos?${params.toString()}`;
}

function AdminVideosLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-48 rounded bg-purple-400/20" />
        <div className="mt-5 h-12 w-72 rounded bg-white/10" />

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 rounded-xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>

        <div className="mt-10 h-64 rounded-xl border border-white/10 bg-white/[0.03]" />
      </div>
    </main>
  );
}

export default function AdminVideosPage({
  searchParams,
}: PageProps) {
  return (
    <Suspense fallback={<AdminVideosLoading />}>
      <AdminVideosContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminVideosContent({
  searchParams,
}: PageProps) {
  await connection();

  const supabase = await createClient();

  const params = await searchParams;

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
  // FILTER PARAMETERS
  // --------------------------------------------------

  const searchText = getParam(params.q).trim().slice(0, 100);

  const requestedStatus = getParam(params.status);

  const statusFilter =
    requestedStatus === "published" ||
    requestedStatus === "draft"
      ? requestedStatus
      : "";

  const eraFilter = getParam(params.era).trim();

  const requestedCollection = getParam(params.collection);

  const requestedPage = Math.max(
    1,
    Number.parseInt(getParam(params.page) || "1", 10) || 1
  );

  // Remove characters that could interfere with PostgREST OR syntax.
  const safeSearch = searchText
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  // --------------------------------------------------
  // LOAD FILTER OPTIONS AND STATISTICS
  // --------------------------------------------------

  const [
    collectionsResult,
    erasResult,
    totalResult,
    publishedResult,
    draftsResult,
  ] = await Promise.all([
    supabase
      .from("watch_collections")
      .select("id, slug, title, category")
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("watch_videos")
      .select("era")
      .not("era", "is", null)
      .order("era")
      .limit(5000),

    supabase
      .from("watch_videos")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("watch_videos")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("watch_videos")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "draft"),
  ]);

  const collections = collectionsResult.data ?? [];

  const eras = Array.from(
    new Set(
      (erasResult.data ?? [])
        .map((item) => item.era?.trim())
        .filter((item): item is string => Boolean(item))
    )
  ).sort((a, b) => a.localeCompare(b));

  const selectedCollection = collections.find(
    (item) => item.id === requestedCollection
  );

  const collectionFilter = selectedCollection?.id ?? "";

  const total = totalResult.count ?? 0;
  const published = publishedResult.count ?? 0;
  const drafts = draftsResult.count ?? 0;

  // --------------------------------------------------
  // COLLECTION FILTER
  // --------------------------------------------------

  let collectionVideoIds: string[] | null = null;
  let relationErrorMessage = "";

  if (collectionFilter) {
    const { data: relations, error: relationsError } =
      await supabase
        .from("watch_video_collections")
        .select("video_id")
        .eq("collection_id", collectionFilter)
        .limit(10000);

    if (relationsError) {
      relationErrorMessage = relationsError.message;
      collectionVideoIds = [];
    } else {
      collectionVideoIds = Array.from(
        new Set((relations ?? []).map((item) => item.video_id))
      );
    }
  }

  // --------------------------------------------------
  // VIDEO QUERY
  // --------------------------------------------------

  let videos: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    published_at: string | null;
    source_name: string;
    source_url: string;
    created_at: string;
    era: string | null;
  }> = [];

  let filteredCount = 0;
  let listError = relationErrorMessage;

  const filters = {
    q: searchText,
    status: statusFilter,
    era: eraFilter,
    collection: collectionFilter,
  };

  if (!listError) {
    if (
      collectionVideoIds === null ||
      collectionVideoIds.length > 0
    ) {
      let videoQuery = supabase
        .from("watch_videos")
        .select(
          `
            id,
            slug,
            title,
            status,
            published_at,
            source_name,
            source_url,
            created_at,
            era
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (statusFilter) {
        videoQuery = videoQuery.eq("status", statusFilter);
      }

      if (eraFilter) {
        videoQuery = videoQuery.eq("era", eraFilter);
      }

      if (safeSearch) {
        videoQuery = videoQuery.or(
          [
            `title.ilike.%${safeSearch}%`,
            `era.ilike.%${safeSearch}%`,
            `source_name.ilike.%${safeSearch}%`,
            `slug.ilike.%${safeSearch}%`,
          ].join(",")
        );
      }

      if (collectionVideoIds !== null) {
        videoQuery = videoQuery.in("id", collectionVideoIds);
      }

      const { data, error, count } = await videoQuery
        .range(
          (requestedPage - 1) * PAGE_SIZE,
          requestedPage * PAGE_SIZE - 1
        );

      if (error) {
        listError = error.message;
      } else {
        videos = data ?? [];
        filteredCount = count ?? 0;
      }
    }
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / PAGE_SIZE)
  );

  // If the user requests a page beyond the result set,
  // the list will remain empty rather than silently changing filters.
  const currentPage = Math.min(requestedPage, totalPages);

  const firstRecord =
    filteredCount === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const lastRecord = Math.min(
    currentPage * PAGE_SIZE,
    filteredCount
  );

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
              MONSTER ARCHIVE / CONTENT
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Watch Videos.
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Manage your audiovisual archive.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 px-5 py-3 text-xs font-bold text-zinc-400 transition hover:text-white"
            >
              ← DASHBOARD
            </Link>

            <Link
              href="/admin/videos/new"
              className="rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
            >
              + ADD NEW VIDEO
            </Link>
          </div>
        </div>

        {/* STATISTICS */}

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "TOTAL VIDEOS", value: total },
            { label: "PUBLISHED", value: published },
            { label: "DRAFTS", value: drafts },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-xs font-bold tracking-widest text-zinc-500">
                {item.label}
              </p>

              <p className="mt-4 text-4xl font-black">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {/* SEARCH AND FILTERS */}

        <section className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold tracking-widest text-zinc-300">
              SEARCH AND FILTERS
            </h2>

            <p className="mt-2 text-xs leading-6 text-zinc-500">
              Search by video title, era or original source.
            </p>
          </div>

          <form
            method="get"
            action="/admin/videos"
            className="grid gap-4 lg:grid-cols-12"
          >
            <div className="lg:col-span-12">
              <label
                htmlFor="video-search"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-500"
              >
                SEARCH VIDEOS
              </label>

              <input
                id="video-search"
                name="q"
                type="search"
                defaultValue={searchText}
                placeholder="Search by title, era or source..."
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-400"
              />
            </div>

            <div className="lg:col-span-4">
              <label
                htmlFor="collection-filter"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-500"
              >
                COLLECTION
              </label>

              <select
                id="collection-filter"
                name="collection"
                defaultValue={collectionFilter}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              >
                <option value="">All collections</option>

                {collections.map((collection) => (
                  <option
                    key={collection.id}
                    value={collection.id}
                  >
                    {collection.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label
                htmlFor="era-filter"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-500"
              >
                ERA
              </label>

              <select
                id="era-filter"
                name="era"
                defaultValue={eraFilterId}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              >
                <option value="">All eras</option>

                {eras.map((era) => (
                  <option key={era} value={era}>
                    {era}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label
                htmlFor="status-filter"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-500"
              >
                STATUS
              </label>

              <select
                id="status-filter"
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              >
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 lg:col-span-12">
              <button
                type="submit"
                className="rounded-lg bg-white px-6 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                APPLY FILTERS →
              </button>

              <Link
                href="/admin/videos"
                className="rounded-lg border border-white/10 px-6 py-3 text-xs font-bold text-zinc-400 transition hover:text-white"
              >
                CLEAR FILTERS
              </Link>
            </div>
          </form>
        </section>

        {/* VIDEO LIST */}

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-widest text-zinc-400">
              REGISTERED CONTENT
            </h2>

            <span className="text-xs text-zinc-500">
              {filteredCount.toLocaleString("en-US")} MATCHING RECORDS
            </span>
          </div>

          {collectionsResult.error || erasResult.error ? (
            <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-sm text-yellow-300">
              Some filter options could not be loaded. Refresh the page
              or check the database connection.
            </div>
          ) : null}

          {listError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
              <p className="font-bold text-red-400">
                Unable to load videos
              </p>

              <p className="mt-3 text-sm text-zinc-400">
                {listError}
              </p>
            </div>
          ) : videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((video) => (
                <article
                  key={video.id}
                  className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-purple-400/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-bold">
                      {video.title}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                      <span>
                        {video.published_at || "Date not registered"}
                      </span>

                      <span>{video.source_name}</span>

                      {video.era && (
                        <span className="font-bold text-purple-300">
                          ERA: {video.era}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase ${
                        video.status === "published"
                          ? "bg-green-500/10 text-green-400"
                          : video.status === "draft"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {video.status}
                    </span>

                    <a
                      href={video.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-purple-400 transition hover:text-purple-300"
                    >
                      SOURCE ↗
                    </a>

                    <Link
                      href={`/admin/videos/${video.id}/edit`}
                      className="rounded-lg border border-purple-400/30 px-4 py-2 text-xs font-bold text-purple-300 transition hover:border-purple-400 hover:bg-purple-400/10"
                    >
                      EDIT
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
              <p className="text-xl font-black">
                No videos found.
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Try another search or clear the filters.
              </p>
            </div>
          )}

          {/* PAGINATION */}

          {!listError && filteredCount > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <p className="text-xs text-zinc-500">
                Showing {firstRecord.toLocaleString("en-US")}–{lastRecord.toLocaleString("en-US")} of{" "}
                {filteredCount.toLocaleString("en-US")} videos
              </p>

              <div className="flex items-center gap-3">
                {currentPage > 1 ? (
                  <Link
                    href={buildPageUrl(currentPage - 1, filters)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-white"
                  >
                    ← PREVIOUS
                  </Link>
                ) : (
                  <span className="rounded-lg border border-white/5 px-4 py-2 text-xs font-bold text-zinc-700">
                    ← PREVIOUS
                  </span>
                )}

                <span className="text-xs font-bold text-zinc-400">
                  {currentPage} / {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={buildPageUrl(currentPage + 1, filters)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-white"
                  >
                    NEXT →
                  </Link>
                ) : (
                  <span className="rounded-lg border border-white/5 px-4 py-2 text-xs font-bold text-zinc-700">
                    NEXT →
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
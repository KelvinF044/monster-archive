
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function AdminVideosPage() {
  return (
    <Suspense fallback={<AdminVideosLoading />}>
      <AdminVideosContent />
    </Suspense>
  );
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
async function AdminVideosContent() {
  await connection();

  const supabase = await createClient();

  // Verify authenticated session
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  // Verify administrator permission
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?access=denied");
  }

  // Retrieve all videos, including drafts
  const { data: videos, error } = await supabase
    .from("watch_videos")
    .select(
      "id, slug, title, status, published_at, source_name, source_url, created_at"
    )
    .order("created_at", { ascending: false });

  const total = videos?.length ?? 0;
  const published = videos?.filter((v) => v.status === "published").length ?? 0;
  const drafts = videos?.filter((v) => v.status === "draft").length ?? 0;

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">

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
              className="rounded-lg border border-white/10 px-5 py-3 text-xs font-bold text-zinc-400 hover:text-white"
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

        {/* VIDEO LIST */}

        <section className="mt-12">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest text-zinc-400">
              REGISTERED CONTENT
            </h2>

            <span className="text-xs text-zinc-500">
              {total.toString().padStart(2, "0")} RECORDS
            </span>
          </div>

          {error ? (

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
              <p className="font-bold text-red-400">
                Unable to load videos
              </p>
              <p className="mt-3 text-sm text-zinc-400">
                {error.message}
              </p>
            </div>

          ) : videos && videos.length > 0 ? (

            <div className="space-y-3">

              {videos.map((video) => (

                <article
                  key={video.id}
                  className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-purple-400/30"
                >

                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {video.title}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                      <span>
                        {video.published_at || "Date not registered"}
                      </span>

                      <span>
                        {video.source_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                      className="text-xs font-bold text-purple-400 hover:text-purple-300"
                    >
                      SOURCE ↗
                    </a>
                  </div>

                </article>

              ))}

            </div>

          ) : (

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
              <p className="text-xl font-black">
                Your archive is waiting.
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Start by adding your first video.
              </p>
            </div>

          )}

        </section>

      </div>
    </main>
  );
}


import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { connection } from "next/server";
import AdminText from "@/components/AdminText";

export default async function AdminDashboard() {
  await connection();
  const supabase = await createClient();

  // 1. Validate the authenticated user.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  // 2. Confirm administrator authorization in the database.
  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/admin/login?access=denied");
  }

  // 3. Load dashboard statistics.
  const [videosResult, collectionsResult, membersResult] =
    await Promise.all([
      supabase
        .from("watch_videos")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("watch_collections")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("members")
        .select("id", { count: "exact", head: true }),
    ]);

  const statsError =
    videosResult.error ||
    collectionsResult.error ||
    membersResult.error;

  const videosCount = videosResult.count ?? 0;
  const collectionsCount = collectionsResult.count ?? 0;
  const membersCount = membersResult.count ?? 0;

  // 4. Load latest registered videos.
  const { data: recentVideos, error: recentError } = await supabase
    .from("watch_videos")
    .select("id, title, status, published_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">

      <div className="mx-auto max-w-7xl">

        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8">

          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-purple-400">
              <AdminText>MONSTER ARCHIVE / ADMIN</AdminText>
            </p>

            <h1 className="mt-3 text-4xl font-black">
              <AdminText>Dashboard.</AdminText>
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              <AdminText>Manage your global fan archive.</AdminText>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-zinc-400 hover:text-white"
            >
              <AdminText>VIEW WEBSITE ↗</AdminText>
            </Link>

            <AdminLogoutButton />
          </div>

        </div>

        <section className="mt-10">

          <h2 className="mb-5 text-sm font-bold tracking-widest text-zinc-400">
            <AdminText>ARCHIVE OVERVIEW</AdminText>
          </h2>

          {statsError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
              <AdminText>Unable to load dashboard statistics. Check database permissions.</AdminText>
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">

              {[
                {
                  label: "REGISTERED VIDEOS",
                  value: videosCount,
                },
                {
                  label: "COLLECTIONS",
                  value: collectionsCount,
                },
                {
                  label: "MEMBERS",
                  value: membersCount,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <p className="text-xs font-bold tracking-widest text-zinc-500">
                    <AdminText>{item.label}</AdminText>
                  </p>

                  <p className="mt-4 text-4xl font-black">
                    {item.value}
                  </p>
                </div>
              ))}

            </div>
          )}

        </section>

        <section className="mt-12">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest text-zinc-400">
              <AdminText>CONTENT MANAGEMENT</AdminText>
            </h2>

            <span className="text-xs text-purple-400">
              <AdminText>ADMIN AREA</AdminText>
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                <AdminText>Watch Videos</AdminText>
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                <AdminText>Register, edit, organize and publish BABYMONSTER videos.</AdminText>
              </p>

              <Link
                href="/admin/videos"
                className="mt-7 inline-flex rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                <AdminText>MANAGE VIDEOS →</AdminText>
              </Link>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                <AdminText>Era Management</AdminText>
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                <AdminText>Create, rename, reorder, activate and deactivate the eras used across the Watch archive.</AdminText>
              </p>

              <Link
                href="/admin/eras"
                className="mt-7 inline-flex rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                <AdminText>MANAGE ERAS →</AdminText>
              </Link>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                <AdminText>Content Import Center</AdminText>
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                <AdminText>Discover videos from YouTube playlists, review duplicates and import selected batches as drafts.</AdminText>
              </p>

              <Link
                href="/admin/import"
                className="mt-7 inline-flex rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                <AdminText>OPEN IMPORT CENTER →</AdminText>
              </Link>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                <AdminText>Collections & Members</AdminText>
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                <AdminText>Manage the categories and relationships in the archive.</AdminText>
              </p>

              <span className="mt-7 inline-block text-xs font-bold text-zinc-600">
                <AdminText>EXPANSION COMING SOON</AdminText>
              </span>

            </div>

          </div>

        </section>

        <section className="mt-12">

          <h2 className="mb-5 text-sm font-bold tracking-widest text-zinc-400">
            <AdminText>RECENTLY REGISTERED VIDEOS</AdminText>
          </h2>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">

            {recentError ? (
              <p className="p-5 text-sm text-red-400">
                <AdminText>Unable to load recent videos.</AdminText>
              </p>
            ) : recentVideos && recentVideos.length > 0 ? (

              recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 last:border-0"
                >
                  <div>
                    <p className="font-bold">
                      {video.title}
                    </p>

                    <p className="mt-2 text-xs text-zinc-500">
                      {video.published_at || <AdminText>Date not registered</AdminText>}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                      video.status === "published"
                        ? "bg-green-500/10 text-green-400"
                        : video.status === "draft"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-zinc-500/10 text-zinc-400"
                    }`}
                  >
                    {video.status === "published" ? <AdminText>Published</AdminText> : video.status === "draft" ? <AdminText>Draft</AdminText> : video.status}
                  </span>

                </div>
              ))

            ) : (
              <p className="p-5 text-sm text-zinc-500">
                <AdminText>No videos registered yet.</AdminText>
              </p>
            )}

          </div>

        </section>

        <footer className="mt-16 border-t border-white/10 pt-7 text-xs text-zinc-600">
          <AdminText>MONSTER ARCHIVE ADMIN · Restricted access</AdminText>
        </footer>

      </div>

    </main>
  );
}

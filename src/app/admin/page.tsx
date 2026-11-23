
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { translateAdminText } from "@/lib/i18n/admin";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { connection } from "next/server";

export default async function AdminDashboard() {
  await connection();
  const locale = await getLocale();
  const t = (value: string) => translateAdminText(locale, value);
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
              MONSTER ARCHIVE / ADMIN
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Dashboard.
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Manage your global fan archive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-zinc-400 hover:text-white"
            >
              VIEW WEBSITE ↗
            </Link>

            <AdminLogoutButton />
          </div>

        </div>

        <section className="mt-10">

          <h2 className="mb-5 text-sm font-bold tracking-widest text-zinc-400">
            ARCHIVE OVERVIEW
          </h2>

          {statsError ? (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
              Unable to load dashboard statistics. Check database permissions.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">

              {[
                {
                  label: t("REGISTERED VIDEOS"),
                  value: videosCount,
                },
                {
                  label: t("COLLECTIONS"),
                  value: collectionsCount,
                },
                {
                  label: t("MEMBERS"),
                  value: membersCount,
                },
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

            </div>
          )}

        </section>

        <section className="mt-12">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest text-zinc-400">
              {t("CONTENT MANAGEMENT")}
            </h2>

            <span className="text-xs text-purple-400">
              {t("ADMIN AREA")}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                {t("Watch Videos")}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {t("Register, edit, organize and publish BABYMONSTER videos.")}
              </p>

              <Link
                href="/admin/videos"
                className="mt-7 inline-flex rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                {t("MANAGE VIDEOS →")}
              </Link>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                {t("Era Management")}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {t("Create, rename, reorder, activate and deactivate the eras used across the Watch archive.")}
              </p>

              <Link
                href="/admin/eras"
                className="mt-7 inline-flex rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                {t("MANAGE ERAS →")}
              </Link>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                {t("Content Import Center")}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {t("Discover videos from YouTube playlists, review duplicates and import selected batches as drafts.")}
              </p>

              <Link
                href="/admin/import"
                className="mt-7 inline-flex rounded-lg bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-purple-200"
              >
                {t("OPEN IMPORT CENTER →")}
              </Link>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-lg font-black">
                {t("Collections & Members")}
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {t("Manage the categories and relationships in the archive.")}
              </p>

              <span className="mt-7 inline-block text-xs font-bold text-zinc-600">
                {t("EXPANSION COMING SOON")}
              </span>

            </div>

          </div>

        </section>

        <section className="mt-12">

          <h2 className="mb-5 text-sm font-bold tracking-widest text-zinc-400">
            {t("RECENTLY REGISTERED VIDEOS")}
          </h2>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">

            {recentError ? (
              <p className="p-5 text-sm text-red-400">
                {t("Unable to load recent videos.")}
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
                      {video.published_at || t("Date not registered")}
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
                    {video.status === "published" ? t("Published") : video.status === "draft" ? t("Draft") : video.status}
                  </span>

                </div>
              ))

            ) : (
              <p className="p-5 text-sm text-zinc-500">
                {t("No videos registered yet.")}
              </p>
            )}

          </div>

        </section>

        <footer className="mt-16 border-t border-white/10 pt-7 text-xs text-zinc-600">
          {t("MONSTER ARCHIVE ADMIN · Restricted access")}
        </footer>

      </div>

    </main>
  );
}

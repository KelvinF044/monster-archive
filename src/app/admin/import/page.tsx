import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import AdminImportCenter from "@/components/AdminImportCenter";
import { createClient } from "@/lib/supabase/server";
import AdminText from "@/components/AdminText";
import { isImportAiEnabled } from "@/lib/admin/import/gateway";

export default async function AdminImportPage() {
  await connection();

  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string" || !userId) {
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

  const [sourcesResult, collectionsResult, erasResult, membersResult] =
    await Promise.all([
      supabase
        .from("watch_import_sources")
        .select("id, name, playlist_id, playlist_url, default_collection_id, default_era_id, is_active, last_scanned_at, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("watch_collections")
        .select("id, slug, title, category")
        .eq("is_active", true)
        .order("display_order"),

      supabase
        .from("watch_eras")
        .select("id, name, display_order, is_active")
        .order("display_order")
        .order("name"),

      supabase
        .from("members")
        .select("id, slug, name")
        .eq("is_active", true)
        .order("display_order"),
    ]);

  const loadError =
    sourcesResult.error ||
    collectionsResult.error ||
    erasResult.error ||
    membersResult.error;

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-500/20 bg-red-500/5 p-7">
          <h1 className="text-2xl font-black text-red-400">
            <AdminText>Unable to load Content Import Center.</AdminText>
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{loadError.message}</p>
          <p className="mt-3 text-xs leading-6 text-zinc-500">
            <AdminText>Confirm that migration 202611230005_content_import_center.sql has been applied in Supabase.</AdminText>
          </p>
          <Link href="/admin" className="mt-6 inline-block text-xs font-bold text-purple-300">
            <AdminText>← BACK TO DASHBOARD</AdminText>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/10 pb-8">
          <Link
            href="/admin"
            className="text-xs font-bold text-zinc-500 transition hover:text-white"
          >
            <AdminText>← BACK TO DASHBOARD</AdminText>
          </Link>

          <p className="mt-8 text-xs font-bold tracking-[0.3em] text-purple-400">
            <AdminText>MONSTER ARCHIVE / CONTENT / IMPORT</AdminText>
          </p>

          <h1 className="mt-3 text-4xl font-black"><AdminText>Content Import Center.</AdminText></h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500">
            <AdminText>Discover videos from public YouTube playlists, avoid duplicates and register reviewed batches as drafts in the archive.</AdminText>
          </p>
        </header>

        <div className="mt-10">
          <AdminImportCenter
            initialSources={sourcesResult.data ?? []}
            collections={collectionsResult.data ?? []}
            eras={erasResult.data ?? []}
            members={membersResult.data ?? []}
            aiEnabled={isImportAiEnabled()}
            apiConfigured={Boolean(process.env.YOUTUBE_API_KEY)}
            refreshConfigured={
              Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
              Boolean(process.env.CRON_SECRET)
            }
          />
        </div>
      </div>
    </main>
  );
}

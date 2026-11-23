import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import AdminEraManager from "@/components/AdminEraManager";
import { createClient } from "@/lib/supabase/server";
import AdminText from "@/components/AdminText";

export default async function AdminErasPage() {
  await connection();

  const supabase = await createClient();

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

  const { data: eraRows, error: erasError } = await supabase
    .from("watch_eras")
    .select("id, name, slug, display_order, is_active")
    .order("display_order")
    .order("name");

  if (erasError) {
    return (
      <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin"
            className="text-xs font-bold text-zinc-500 transition hover:text-white"
          >
            <AdminText>← BACK TO DASHBOARD</AdminText>
          </Link>

          <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/10 p-6">
            <h1 className="text-2xl font-black text-red-400">
              <AdminText>Unable to load the era catalog.</AdminText>
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {erasError.message}
            </p>
            <p className="mt-3 text-xs leading-6 text-zinc-500">
              <AdminText>Confirm that migration 202611230002_manage_watch_eras.sql has been applied in Supabase.</AdminText>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const eras = await Promise.all(
    (eraRows ?? []).map(async (era) => {
      const { count, error } = await supabase
        .from("watch_videos")
        .select("id", { count: "exact", head: true })
        .eq("era_id", era.id);

      return {
        ...era,
        video_count: error ? null : count ?? 0,
      };
    })
  );

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-white/10 pb-8">
          <Link
            href="/admin"
            className="text-xs font-bold text-zinc-500 transition hover:text-white"
          >
            <AdminText>← BACK TO DASHBOARD</AdminText>
          </Link>

          <p className="mt-8 text-xs font-bold tracking-[0.3em] text-purple-400">
            <AdminText>MONSTER ARCHIVE / ADMIN / WATCH</AdminText>
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black"><AdminText>Era management.</AdminText></h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
                <AdminText>Maintain the central era catalog used to organize BABYMONSTER videos.</AdminText>
              </p>
            </div>

            <Link
              href="/admin/videos"
              className="rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-purple-400/50 hover:text-white"
            >
              <AdminText>MANAGE VIDEOS →</AdminText>
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <AdminEraManager initialEras={eras} />
        </div>

        <footer className="mt-16 border-t border-white/10 pt-7 text-xs text-zinc-600">
          <AdminText>MONSTER ARCHIVE ADMIN · Restricted access</AdminText>
        </footer>
      </div>
    </main>
  );
}

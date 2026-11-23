
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import AdminVideoForm from "@/components/AdminVideoForm";
import { Suspense } from "react";
import AdminText from "@/components/AdminText";

export default function NewVideoPage() {
  return (
    <Suspense fallback={<NewVideoLoading />}>
      <NewVideoContent />
    </Suspense>
  );
}

function NewVideoLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl animate-pulse">

        <div className="h-4 w-48 rounded bg-purple-400/20" />

        <div className="mt-5 h-12 w-80 rounded bg-white/10" />

        <div className="mt-10 h-64 rounded-xl border border-white/10 bg-white/[0.03]" />

        <div className="mt-8 h-52 rounded-xl border border-white/10 bg-white/[0.03]" />

      </div>
    </main>
  );
}

async function NewVideoContent() {
  await connection();

  const supabase = await createClient();

  // Verify authentication
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  // Verify administrator authorization
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?access=denied");
  }

  // Load active collections, members and eras.
  const [collectionsResult, membersResult, erasResult] =
    await Promise.all([
      supabase
        .from("watch_collections")
        .select("id, slug, title, category")
        .eq("is_active", true)
        .order("display_order"),

      supabase
        .from("members")
        .select("id, slug, name")
        .eq("is_active", true)
        .order("display_order"),

      supabase
        .from("watch_eras")
        .select("id, name, slug, display_order, is_active")
        .eq("is_active", true)
        .order("display_order")
        .order("name"),
    ]);

  const dataError =
    collectionsResult.error ||
    membersResult.error ||
    erasResult.error;

  if (dataError) {
    return (
      <main className="min-h-[60vh] bg-[#08090d] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-black text-red-400">
            <AdminText>Unable to load registration form</AdminText>
          </h1>

          <p className="mt-4 text-sm text-zinc-400">
            {dataError.message}
          </p>

          <Link
            href="/admin/videos"
            className="mt-8 inline-block text-sm font-bold text-purple-400"
          >
            <AdminText>← BACK TO VIDEOS</AdminText>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">

      <div className="mx-auto max-w-5xl">

        <div className="border-b border-white/10 pb-8">

          <Link
            href="/admin/videos"
            className="text-xs font-bold text-zinc-500 transition hover:text-white"
          >
            <AdminText>← BACK TO VIDEO MANAGEMENT</AdminText>
          </Link>

          <p className="mt-8 text-xs font-bold tracking-[0.3em] text-purple-400">
            <AdminText>MONSTER ARCHIVE / CONTENT / NEW</AdminText>
          </p>

          <h1 className="mt-3 text-4xl font-black">
            <AdminText>Add new video.</AdminText>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            <AdminText>Register an audiovisual entry in the archive. Complete the information and choose where the content should appear.</AdminText>
          </p>

        </div>

        <div className="mt-10">

          <AdminVideoForm
            collections={collectionsResult.data ?? []}
            members={membersResult.data ?? []}
            eras={erasResult.data ?? []}
          />

        </div>

      </div>

    </main>
  );
}

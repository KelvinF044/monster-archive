import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { listCandidates, listSources } from "@/lib/admin/editorial/repository";
import AdminEditorialCenter from "@/components/admin-editorial/Center";
import AdminText from "@/components/AdminText";

export const metadata: Metadata = { title: "Editorial Center", robots: { index: false, follow: false } };

async function Workspace() {
  await connection();
  const admin = await requireActiveAdmin();
  if (!admin) redirect("/admin/login");
  const result = await Promise.all([
    listSources(admin.supabase),
    listCandidates(admin.supabase, new URLSearchParams()),
  ]).catch(() => null);
  return (
    <AdminEditorialCenter sources={result?.[0] ?? []} queue={result?.[1] ?? { candidates: [], page: 1, total: 0 }} failed={!result} />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#08090d] p-8 text-zinc-400"><AdminText>Loading...</AdminText></main>}>
      <Workspace />
    </Suspense>
  );
}

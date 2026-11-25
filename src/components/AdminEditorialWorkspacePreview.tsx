import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AdminText from "@/components/AdminText";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";

const sections = {
  news: {
    label: "News",
    description: "News management will be implemented in the next editorial stage.",
  },
  schedule: {
    label: "Events",
    description: "Event management will be implemented in the next schedule stage.",
  },
  editorial: {
    label: "Editorial",
    description: "Source management and editorial review will be implemented in the editorial stage.",
  },
};

export default async function AdminEditorialWorkspacePreview({
  section,
}: {
  section: keyof typeof sections;
}) {
  await connection();
  const admin = await requireActiveAdmin();
  if (!admin) redirect("/admin/login");

  const content = sections[section];

  return (
    <main className="min-h-screen bg-[#08090d] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-xs font-bold text-zinc-500 transition hover:text-white">
          <AdminText>← BACK TO DASHBOARD</AdminText>
        </Link>
        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-xs font-bold tracking-[0.25em] text-purple-400">
            MONSTER ARCHIVE / <AdminText>Phase 2.3 — Preview</AdminText>
          </p>
          <h1 className="mt-4 text-4xl font-black"><AdminText>{content.label}</AdminText>.</h1>
        </header>
        <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="text-lg font-bold"><AdminText>Workspace under development</AdminText></h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400"><AdminText>{content.description}</AdminText></p>
        </section>
      </div>
    </main>
  );
}

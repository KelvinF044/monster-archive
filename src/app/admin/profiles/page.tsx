import { redirect } from "next/navigation";
import AdminCommunityProfiles from "@/components/AdminCommunityProfiles";
import { getCommunityProfileDirectory } from "@/lib/admin/community-profiles/data";
import { directoryHref } from "@/lib/admin/community-profiles/model";
import { getAccount } from "@/lib/auth/session";

export default async function CommunityProfilesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const account = await getAccount();
  if (!account) redirect("/login?next=profiles");
  if (account.role !== "admin") redirect("/account?status=restricted");

  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
  const sort = query.sort === "oldest" ? "oldest" : "newest";
  const page = Number(query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) redirect(directoryHref({ sort, search }));

  const directory = await getCommunityProfileDirectory(search, sort, page);
  if (page > 1 && directory?.entries.length === 0) redirect(directoryHref({ sort, search }));

  return <AdminCommunityProfiles directory={directory} search={search} sort={sort} page={page} />;
}

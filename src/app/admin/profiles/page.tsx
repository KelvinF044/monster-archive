import { redirect } from "next/navigation";
import AdminCommunityAccountActivity from "@/components/AdminCommunityAccountActivity";
import AdminCommunityProfiles from "@/components/AdminCommunityProfiles";
import { getCommunityAccountActivity, getCommunityProfileDirectory } from "@/lib/admin/community-profiles/data";
import { accountActivityHref, accountDeletedStatus, directoryHref } from "@/lib/admin/community-profiles/model";
import { getAccount } from "@/lib/auth/session";

export default async function CommunityProfilesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; view?: string; status?: string }>;
}) {
  const account = await getAccount();
  if (!account) redirect("/login?next=profiles");
  if (account.role !== "admin") redirect("/account?status=restricted");

  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
  const sort = query.sort === "oldest" ? "oldest" : "newest";
  const page = Number(query.page ?? 1);
  const activityView = query.view === "activity";
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
    redirect(activityView ? accountActivityHref() : directoryHref({ sort, search }));
  }
  if (activityView) {
    const activity = await getCommunityAccountActivity(page);
    if (page > 1 && activity?.events.length === 0) redirect(accountActivityHref());
    return <AdminCommunityAccountActivity activity={activity} page={page} />;
  }

  const directory = await getCommunityProfileDirectory(search, sort, page);
  if (page > 1 && directory?.entries.length === 0) redirect(directoryHref({ sort, search }));

  return (
    <AdminCommunityProfiles
      actorId={account.claims.sub} directory={directory} search={search} sort={sort} page={page}
      accountDeleted={query.status === accountDeletedStatus}
    />
  );
}

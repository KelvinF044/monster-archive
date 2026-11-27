import { redirect } from "next/navigation";
import ModerationQueue from "@/components/ModerationQueue";
import { getAccount } from "@/lib/auth/session";
import { getReportQueue } from "@/lib/moderation/data";
import { queueHref, reportFilters } from "@/lib/moderation/model";

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const [account, query] = await Promise.all([getAccount(), searchParams]);
  if (!account) redirect("/login?next=moderation");
  if (account.role === "member") redirect("/account?status=restricted");

  const status = reportFilters.find((filter) => filter === query.status) ?? "pending";
  const page = Number(query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) redirect(queueHref(status));

  const queue = await getReportQueue(status, page);
  if (page > 1 && queue?.reports.length === 0) redirect(queueHref(status));

  return <ModerationQueue queue={queue} status={status} page={page} />;
}

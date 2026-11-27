"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { communityAccountControlMessages } from "@/lib/admin/community-profiles/control-messages";
import type { getCommunityAccountActivity } from "@/lib/admin/community-profiles/data";
import { communityProfileAdminMessages } from "@/lib/admin/community-profiles/messages";
import { accountActivityHref, profilesHref } from "@/lib/admin/community-profiles/model";

export default function AdminCommunityAccountActivity({ activity, page }: {
  activity: Awaited<ReturnType<typeof getCommunityAccountActivity>>;
  page: number;
}) {
  const { locale } = useLanguage();
  const copy = communityAccountControlMessages(locale);
  const profilesCopy = communityProfileAdminMessages(locale);
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  return (
    <main className="community-surface min-h-[65vh] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black sm:text-4xl">{copy.audit}</h1>
          <Link href={profilesHref} className="text-sm font-semibold text-purple-200 hover:underline">{copy.directory}</Link>
        </div>
        {!activity ? <p role="alert" className="text-sm text-red-200">{copy.loadError}</p> : activity.events.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#15111d] p-5 text-sm text-zinc-300">{copy.empty}</p>
        ) : (
          <ul className="space-y-3">
            {activity.events.map((event) => (
              <li key={event.id} className="rounded-xl border border-white/10 bg-[#15111d] p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="font-bold">{copy.operation[event.operation]}</h2>
                  <time dateTime={event.created_at} className="text-sm text-zinc-300">{dateTime.format(new Date(event.created_at))}</time>
                </div>
                <dl className="mt-3 grid gap-2 break-words text-sm text-zinc-300 sm:grid-cols-2">
                  <div className="min-w-0"><dt className="font-semibold">{copy.actor}</dt><dd>{event.actor_name ?? event.actor_id}</dd></div>
                  <div className="min-w-0"><dt className="font-semibold">{copy.target}</dt><dd>{event.target_handle ? `@${event.target_handle}` : event.target_id}</dd></div>
                </dl>
                {event.new_role && (
                  <p className="mt-3 text-sm text-purple-200">{profilesCopy.role[event.previous_role]} → {profilesCopy.role[event.new_role]}</p>
                )}
                {event.effective_until && (
                  <p className="mt-3 text-sm text-purple-200">{copy.until} <time dateTime={event.effective_until}>{dateTime.format(new Date(event.effective_until))}</time></p>
                )}
                {event.reason && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-300">{event.reason}</p>}
              </li>
            ))}
          </ul>
        )}
        {activity && (page > 1 || activity.hasNext) && (
          <div className="mt-6 flex gap-4 text-sm font-semibold text-purple-200">
            {page > 1 && <Link href={accountActivityHref(page - 1)}>{profilesCopy.previous}</Link>}
            {activity.hasNext && <Link href={accountActivityHref(page + 1)}>{profilesCopy.next}</Link>}
          </div>
        )}
      </div>
    </main>
  );
}

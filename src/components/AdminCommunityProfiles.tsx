"use client";

import Form from "next/form";
import Link from "next/link";
import { useActionState, useState } from "react";
import AdminCommunityAccountControls from "@/components/AdminCommunityAccountControls";
import { useLanguage } from "@/components/LanguageProvider";
import { updateCommunityProfile } from "@/lib/admin/community-profiles/actions";
import type { getCommunityProfileDirectory } from "@/lib/admin/community-profiles/data";
import { communityAccountControlMessages } from "@/lib/admin/community-profiles/control-messages";
import { communityProfileAdminMessages } from "@/lib/admin/community-profiles/messages";
import { accountActivityHref, directoryHref, profilesHref, type ProfileDirectoryEntry, type ProfileSort } from "@/lib/admin/community-profiles/model";

const field = "w-full min-w-0 rounded-lg border border-white/20 bg-[#111019] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-purple-400";
const button = "rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white hover:border-purple-400 focus-visible:outline-2 focus-visible:outline-purple-400 disabled:opacity-60";

function ProfileFields({ name, bio }: { name: string; bio: string }) {
  const { locale } = useLanguage();
  const copy = communityProfileAdminMessages(locale);
  const [displayName, setDisplayName] = useState(name);
  const [biography, setBiography] = useState(bio);
  return (
    <>
      <input type="hidden" name="expectedName" value={name} />
      <input type="hidden" name="expectedBio" value={bio} />
      <label className="block space-y-1.5 text-sm font-semibold">
        <span>{copy.displayName}</span>
        <input name="displayName" value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} required maxLength={40} className={field} />
      </label>
      <label className="block space-y-1.5 text-sm font-semibold">
        <span>{copy.bio}</span>
        <textarea name="bio" value={biography} onChange={(event) => setBiography(event.currentTarget.value)} rows={3} maxLength={280} className={field} />
      </label>
    </>
  );
}

function ProfileEditor({ entry, dateTime }: { entry: ProfileDirectoryEntry; dateTime: Intl.DateTimeFormat }) {
  const { locale } = useLanguage();
  const copy = communityProfileAdminMessages(locale);
  const [state, submit, pending] = useActionState(updateCommunityProfile, {});
  const name = entry.display_name ?? "";
  const bio = entry.bio ?? "";
  return (
    <details className="mt-4 border-t border-white/10 pt-3">
      <summary className="w-fit cursor-pointer text-sm font-semibold text-purple-200 hover:underline">{copy.edit}</summary>
      <form className="mt-3 max-w-xl space-y-3" action={submit}>
        <input type="hidden" name="accountId" value={entry.account_id} />
        <ProfileFields key={JSON.stringify([name, bio])} name={name} bio={bio} />
        <button type="submit" disabled={pending} className={`${button} bg-purple-700`}>{copy.save}</button>
        {state.result && (
          <p role={state.result === "saved" || state.result === "unchanged" ? "status" : "alert"} className="text-sm text-zinc-200">
            {copy.result[state.result]}
          </p>
        )}
        {entry.last_edited_at && (
          <p className="text-xs text-zinc-400">{copy.lastChange} · <time dateTime={entry.last_edited_at}>{dateTime.format(new Date(entry.last_edited_at))}</time></p>
        )}
      </form>
    </details>
  );
}

export default function AdminCommunityProfiles({ actorId, directory, search, sort, page, accountDeleted }: {
  actorId: string;
  directory: Awaited<ReturnType<typeof getCommunityProfileDirectory>>;
  search: string;
  sort: ProfileSort;
  page: number;
  accountDeleted: boolean;
}) {
  const { locale } = useLanguage();
  const copy = communityProfileAdminMessages(locale);
  const controlsCopy = communityAccountControlMessages(locale);
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  return (
    <main className="community-surface min-h-[65vh] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black sm:text-4xl">{copy.title}</h1>
          <Link href={accountActivityHref()} className={button}>{controlsCopy.audit}</Link>
        </div>
        {accountDeleted && (
          <p role="status" className="mt-4 rounded-xl border border-purple-400/35 bg-purple-500/10 p-4 text-sm text-purple-100">
            {controlsCopy.deletedNotice}
          </p>
        )}

        <div className="my-6 flex flex-wrap items-end gap-4">
          <Form action={profilesHref} prefetch={false} className="flex w-full max-w-md items-end gap-2">
            {sort === "oldest" && <input type="hidden" name="sort" value={sort} />}
            <label className="min-w-0 flex-1 space-y-1.5 text-sm font-semibold">
              <span>{copy.search}</span>
              <input key={search} name="q" type="search" defaultValue={search} maxLength={80} className={field} />
            </label>
            <button type="submit" className={button}>{copy.searchAction}</button>
          </Form>
          <nav aria-label={copy.order} className="flex flex-wrap gap-2">
            {(["newest", "oldest"] as const).map((option) => (
              <Link key={option} href={directoryHref({ search, sort: option })} prefetch={false} aria-current={sort === option ? "page" : undefined}
                className={`${button} ${sort === option ? "border-purple-400/60 bg-purple-500/15" : ""}`}>
                {copy[option]}
              </Link>
            ))}
          </nav>
          {search && <Link href={directoryHref({ search: "", sort })} className="py-2.5 text-sm font-semibold text-purple-200 hover:underline">{copy.clearSearch}</Link>}
        </div>

        {!directory ? <p role="alert" className="text-sm text-red-200">{copy.loadError}</p> : directory.entries.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#15111d] p-5 text-sm text-zinc-300">{copy.empty}</p>
        ) : (
          <ul className="space-y-3">
            {directory.entries.map((entry) => (
              <li key={entry.account_id} className="rounded-xl border border-white/10 bg-[#15111d] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold">{entry.display_name ?? copy.noProfile}</h2>
                    <p className="mt-1 break-all text-sm text-zinc-400">{entry.handle ? `@${entry.handle}` : entry.account_id}</p>
                  </div>
                  <div className="text-sm text-zinc-300">
                    {copy.registered} · {entry.registered_at ? <time dateTime={entry.registered_at}>{dateTime.format(new Date(entry.registered_at))}</time> : "—"}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-300">
                  <span className="rounded border border-purple-400/35 px-2 py-1 text-purple-200">{copy.role[entry.account_role]}</span>
                  <span className="rounded border border-white/15 px-2 py-1">{entry.confirmed ? copy.confirmed : copy.unconfirmed}</span>
                  {entry.handle && <span className="rounded border border-white/15 px-2 py-1">{entry.moderation_hidden ? copy.hidden : entry.is_public ? copy.public : copy.private}</span>}
                  {entry.suspended_until && <span className="rounded border border-amber-400/35 px-2 py-1 text-amber-200">{copy.suspended} <time dateTime={entry.suspended_until}>{dateTime.format(new Date(entry.suspended_until))}</time></span>}
                  {entry.is_public && entry.handle && (
                    <Link href={`/u/${entry.handle}`} prefetch={false} className="px-1 py-1 text-purple-200 hover:underline">{copy.view}</Link>
                  )}
                </div>
                {entry.handle && <ProfileEditor entry={entry} dateTime={dateTime} />}
                {entry.account_id !== actorId && <AdminCommunityAccountControls entry={entry} />}
              </li>
            ))}
          </ul>
        )}
        {directory && (page > 1 || directory.hasNext) && (
          <nav className="mt-6 flex gap-4 text-sm font-semibold text-purple-200">
            {page > 1 && <Link href={directoryHref({ search, sort, page: page - 1 })} className="hover:underline">{copy.previous}</Link>}
            {directory.hasNext && <Link href={directoryHref({ search, sort, page: page + 1 })} className="hover:underline">{copy.next}</Link>}
          </nav>
        )}
      </div>
    </main>
  );
}

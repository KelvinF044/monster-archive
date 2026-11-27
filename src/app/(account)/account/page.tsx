import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountLogout } from "@/components/AccountForm";
import CommunityProfileCard from "@/components/CommunityProfileCard";
import CommunityProfileForm, { CopyProfileLink } from "@/components/CommunityProfileForm";
import { authMessages } from "@/lib/auth/messages";
import { getAccount } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { getOwnProfile } from "@/lib/profiles/data";
import { profileMessages } from "@/lib/profiles/messages";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [account, locale, { status }] = await Promise.all([getAccount(), getLocale(), searchParams]);
  if (!account) redirect("/login");

  const data = await getOwnProfile(account.claims.sub);
  const copy = authMessages(locale);
  const profileCopy = profileMessages(locale);
  const name = account.claims.user_metadata?.display_name;
  const fallbackName = typeof name === "string" ? name.trim().slice(0, 40) : "";
  const profile = data?.profile;
  const statusText = status === "confirmed"
    ? copy.confirmed
    : status === "password-updated"
      ? copy.passwordUpdated
      : status === "restricted"
        ? copy.restricted
        : status === "profile-saved"
          ? profileCopy.saved
          : null;

  return (
    <main className="min-h-[calc(100svh-5rem)] bg-[#08090d] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">{copy.account}</h1>
            {statusText && <p role="status" className="mt-3 text-sm text-purple-200">{statusText}</p>}
          </div>
          <div className="flex flex-wrap items-start gap-3">
            {account.role !== "member" && (
              <Link href="/admin" prefetch={false} className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400">
                {copy.manage}
              </Link>
            )}
            <AccountLogout />
          </div>
        </div>
        {data ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
            <section className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-200">{profileCopy.yourProfile}</p>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200">
                  {profile?.is_public ? profileCopy.public : profileCopy.private}
                </span>
              </div>
              <CommunityProfileCard profile={data.profile} catalog={data.catalog} locale={locale} fallbackName={fallbackName} heading="h2" />
              {profile?.is_public && (
                <div className="flex flex-wrap items-start gap-3">
                  <Link href={`/u/${profile.handle}`} prefetch={false} className="rounded-lg border border-purple-400/35 px-3 py-2 text-sm font-semibold text-purple-200 hover:bg-purple-500/15 focus-visible:outline-2 focus-visible:outline-purple-400">{profileCopy.viewPublic}</Link>
                  <CopyProfileLink key={profile.handle} handle={profile.handle} />
                </div>
              )}
              <dl className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm">
                <dt className="font-semibold text-zinc-300">{profileCopy.email}</dt>
                <dd className="mt-1 break-all text-zinc-400">{account.claims.email}</dd>
              </dl>
            </section>
            <CommunityProfileForm profile={data.profile} sharing={data.sharing} catalog={data.catalog} fallbackName={fallbackName} />
          </div>
        ) : (
          <p role="alert" className="rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">{profileCopy.unavailable}</p>
        )}
      </div>
    </main>
  );
}

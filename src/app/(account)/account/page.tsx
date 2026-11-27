import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountLogout } from "@/components/AccountForm";
import { authMessages } from "@/lib/auth/messages";
import { getAccount } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [account, locale, { status }] = await Promise.all([getAccount(), getLocale(), searchParams]);
  if (!account) redirect("/login");

  const copy = authMessages(locale);
  const name = account.claims.user_metadata?.display_name;
  const statusText = status === "confirmed"
    ? copy.confirmed
    : status === "password-updated"
      ? copy.passwordUpdated
      : status === "restricted"
        ? copy.restricted
        : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 text-white sm:px-6">
      <h1 className="text-3xl font-black">{copy.account}</h1>
      {statusText && <p role="status" className="mt-5 text-sm text-purple-200">{statusText}</p>}
      <div className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {typeof name === "string" && <p className="break-words text-lg font-bold">{name}</p>}
        <p className="break-all text-sm text-zinc-400">{account.claims.email}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-start gap-4">
        {account.role !== "member" && (
          <Link href="/admin" prefetch={false} className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400">
            {copy.manage}
          </Link>
        )}
        <AccountLogout />
      </div>
    </main>
  );
}

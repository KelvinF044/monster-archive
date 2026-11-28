"use client";

import { useActionState, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { manageCommunityAccount } from "@/lib/admin/community-profiles/actions";
import { communityAccountControlMessages } from "@/lib/admin/community-profiles/control-messages";
import { communityProfileAdminMessages } from "@/lib/admin/community-profiles/messages";
import { accountRoles, type AccountOperation, type ProfileDirectoryEntry } from "@/lib/admin/community-profiles/model";

const label = "block space-y-1.5 text-sm font-semibold";
const field = "w-full min-w-0 rounded-lg border border-white/20 bg-[#111019] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-purple-400";

export default function AdminCommunityAccountControls({ entry }: { entry: ProfileDirectoryEntry }) {
  const { locale } = useLanguage();
  const copy = communityAccountControlMessages(locale);
  const profilesCopy = communityProfileAdminMessages(locale);
  const [state, submit, pending] = useActionState(manageCommunityAccount, {});
  const [selection, setSelection] = useState<AccountOperation | "">("");
  const [unit, setUnit] = useState<"hours" | "days">("hours");

  const roleChoices = accountRoles.filter((role) =>
    role !== entry.account_role && (role === "member" || (entry.confirmed && !entry.suspended_until)));
  const operations: AccountOperation[] = roleChoices.length ? ["role"] : [];
  if (entry.suspended_until) operations.push("revoke");
  else if (entry.account_role !== "admin") operations.push("suspend");
  if (entry.handle) operations.push("remove_profile");
  if (entry.account_role !== "admin") operations.push("delete_account");

  const operation = selection && operations.includes(selection) ? selection : "";
  const deleting = operation === "remove_profile" || operation === "delete_account";
  const identifier = entry.handle ? `@${entry.handle}` : entry.account_id;

  return (
    <details className="mt-4 border-t border-white/10 pt-3">
      <summary className="w-fit cursor-pointer text-sm font-semibold text-purple-200 hover:underline">{copy.manage}</summary>
      <form className="mt-3 max-w-xl space-y-3" action={submit}>
        <input type="hidden" name="accountId" value={entry.account_id} />
        <input type="hidden" name="expectedRole" value={entry.account_role} />
        <input type="hidden" name="expectedUntil" value={entry.suspended_until ?? ""} />
        <label className={label}>
          <span>{copy.action}</span>
          <select name="operation" value={operation} onChange={(event) => setSelection(event.currentTarget.value as AccountOperation | "")} required className={field}>
            <option value="">{copy.choose}</option>
            {operations.map((value) => <option key={value} value={value}>{copy.operation[value]}</option>)}
          </select>
        </label>
        {operation === "suspend" && (
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              <span>{copy.duration}</span>
              <input name="quantity" type="number" min={1} max={unit === "days" ? 365 : 8760} step={1} required defaultValue={1} className={field} />
            </label>
            <label className={label}>
              <span>{copy.unit}</span>
              <select name="unit" value={unit} onChange={(event) => setUnit(event.currentTarget.value as "hours" | "days")} className={field}>
                <option value="hours">{copy.hours}</option>
                <option value="days">{copy.days}</option>
              </select>
            </label>
          </div>
        )}
        {operation === "role" && (
          <label className={label}>
            <span>{copy.newRole}</span>
            <select name="newRole" defaultValue="" required className={field}>
              <option value="">{copy.choose}</option>
              {roleChoices.map((role) => <option key={role} value={role}>{profilesCopy.role[role]}</option>)}
            </select>
          </label>
        )}
        {deleting && (
          <div className="space-y-2 rounded-lg border border-red-400/35 bg-red-950/30 p-3">
            <p className="text-sm text-red-100">{operation === "remove_profile" ? copy.profileWarning : copy.accountWarning}</p>
            <label className={label}>
              <span className="break-all">{copy.confirm.replace("{account}", identifier)}</span>
              <input name="confirmation" maxLength={40} autoComplete="off" required className={field} />
            </label>
          </div>
        )}
        {operation && (
          <>
            <label className={label}>
              <span>{operation === "suspend" ? copy.reason : copy.optionalReason}</span>
              <textarea name="reason" rows={2} maxLength={400} required={operation === "suspend"} className={field} />
            </label>
            <button type="submit" disabled={pending} className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-white disabled:opacity-60 ${deleting ? "bg-red-800 hover:bg-red-700" : "bg-purple-700 hover:bg-purple-600"}`}>
              {copy.apply}
            </button>
          </>
        )}
        {state.result && (
          <p role={state.result === "saved" || state.result === "unchanged" ? "status" : "alert"} className="text-sm text-zinc-200">
            {copy.result[state.result]}
          </p>
        )}
      </form>
    </details>
  );
}

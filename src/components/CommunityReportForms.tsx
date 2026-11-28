"use client";

import { useActionState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { decideReport, submitReport } from "@/lib/moderation/actions";
import { moderationMessages } from "@/lib/moderation/messages";
import { reportReasons, type ReportDecision, type ReportKind } from "@/lib/moderation/model";

const field = "mt-1.5 w-full min-w-0 rounded-lg border border-white/20 bg-[#111019] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-purple-400";
const button = "rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-60";

export function ReportContent({ kind, target }: { kind: ReportKind; target: string }) {
  const { locale } = useLanguage();
  const copy = moderationMessages(locale);
  const [state, submit, pending] = useActionState(submitReport, {});

  return (
    <details className="mt-5 max-w-md">
      <summary className="w-fit cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-300 hover:text-white">{copy.report[kind]}</summary>
      {state.result === "sent" ? (
        <p role="status" className="mt-3 text-sm text-purple-200">{copy.result.sent}</p>
      ) : (
        <form action={submit} className="mt-3 space-y-4 rounded-xl border border-white/10 bg-[#15111d] p-4">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="target" value={target} />
          <label className="block text-sm font-semibold">
            {copy.reason}
            <select name="reason" defaultValue="" className={field} required>
              <option value="" disabled>{copy.chooseReason}</option>
              {reportReasons.map((reason) => <option value={reason} key={reason}>{copy.reasons[reason]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {copy.details}
            <textarea name="details" rows={3} maxLength={400} className={field} />
          </label>
          <button type="submit" className={button} disabled={pending}>{copy.submit}</button>
          {state.result && <p role="alert" className="text-sm text-red-200">{copy.result[state.result]}</p>}
        </form>
      )}
    </details>
  );
}

export function ReportDecisionForm({ id, decisions }: { id: string; decisions: ReportDecision[] }) {
  const { locale } = useLanguage();
  const copy = moderationMessages(locale);
  const [state, submit, pending] = useActionState(decideReport, {});

  return (
    <form className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2" action={submit}>
      <input type="hidden" name="report" value={id} />
      <label className="block text-sm font-semibold">
        {copy.decision}
        <select name="action" required defaultValue={decisions.length === 1 ? decisions[0] : ""} className={field}>
          {decisions.length > 1 && <option value="" disabled>{copy.chooseDecision}</option>}
          {decisions.map((decision) => <option value={decision} key={decision}>{copy.decisions[decision]}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        {copy.note}
        <textarea name="note" rows={2} maxLength={400} className={field} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className={button} disabled={pending}>{copy.logDecision}</button>
        {state.failed && <p role="alert" className="mt-2 text-sm text-red-200">{copy.staleDecision}</p>}
      </div>
    </form>
  );
}

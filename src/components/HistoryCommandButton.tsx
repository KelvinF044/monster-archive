"use client";

import { useActionState, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { manageHistory } from "@/lib/history/actions";
import { historyMessages } from "@/lib/history/messages";
import type { HistoryCommand, HistoryState } from "@/lib/history/model";

const buttonStyle = "rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-purple-400 focus-visible:outline-2 focus-visible:outline-purple-400 disabled:opacity-60";

export default function HistoryCommandButton({
  command, videoId, title,
}: {
  command: HistoryCommand;
  videoId?: string;
  title?: string;
}) {
  const { locale } = useLanguage();
  const copy = historyMessages(locale);
  const [confirmed, setConfirmed] = useState(false);
  const [state, submit, pending] = useActionState(async (previous: HistoryState, form: FormData) => {
    const result = await manageHistory(previous, form);
    if (!result.failed) setConfirmed(false);
    return result;
  }, {});

  if (command === "clear" && !confirmed) {
    return <button type="button" onClick={() => setConfirmed(true)} className={buttonStyle}>{copy.clear}</button>;
  }
  return (
    <form action={submit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="command" value={command} />
      {videoId && <input type="hidden" name="videoId" value={videoId} />}
      {command === "clear" && <p className="w-full text-sm text-zinc-200">{copy.clearConfirm}</p>}
      <button type="submit" disabled={pending} aria-label={title ? `${copy[command]}: ${title}` : undefined} className={buttonStyle}>
        {copy[command]}
      </button>
      {command === "clear" && (
        <button type="button" disabled={pending} onClick={() => setConfirmed(false)} className={buttonStyle}>{copy.cancel}</button>
      )}
      {state.failed && <p role="alert" className="w-full text-sm text-red-200">{copy.updateError}</p>}
    </form>
  );
}

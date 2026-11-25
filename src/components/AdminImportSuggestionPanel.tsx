"use client";

import { useState } from "react";
import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { useAdminText } from "@/components/useAdminText";
import { EDITORIAL_NOTE_LIMIT, IMPORT_BATCH_LIMIT, type ImportSuggestion } from "@/lib/admin/import/review";

type Props = {
  videoIds: readonly string[];
  sourceId: string;
  collections: { id: string; title: string }[];
  eras: { id: string; name: string }[];
  members: { id: string; name: string }[];
  disabled: boolean;
  canApply: (suggestion: ImportSuggestion) => boolean;
  onApply: (suggestion: ImportSuggestion) => void;
};

export default function AdminImportSuggestionPanel({
  videoIds, sourceId, collections, eras, members, disabled, canApply, onApply,
}: Props) {
  const t = useAdminText();
  const { locale } = useAdminLocale();
  const [note, setNote] = useState("");
  const [suggestion, setSuggestion] = useState<ImportSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [message, setMessage] = useState("");
  const shared = videoIds.length > 1;
  const tooMany = videoIds.length > IMPORT_BATCH_LIMIT;
  const suggestedCollection = collections.find(item => item.id === suggestion?.collectionId);
  const suggestedEra = eras.find(item => item.id === suggestion?.eraId);
  const suggestedMembers = suggestion ? members.filter(item => suggestion.memberIds.includes(item.id)) : [];
  const reviewedSuggestion = suggestion && {
    ...suggestion,
    collectionId: suggestedCollection?.id ?? null,
    eraId: suggestedEra?.id ?? null,
    memberIds: suggestedMembers.map(member => member.id),
  };

  async function suggestClassification() {
    if (!note.trim() || disabled || suggesting || !videoIds.length || tooMany) return;
    setSuggesting(true);
    setSuggestion(null);
    setMessage("");
    try {
      const response = await fetch("/api/admin/import/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId, note: note.trim(), locale,
          ...(shared ? { videoIds } : { videoId: videoIds[0] }),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Suggestions are unavailable. You can finish the review manually.");
        return;
      }
      setSuggestion(result.suggestion);
    } catch {
      setMessage("Suggestions are unavailable. You can finish the review manually.");
    } finally {
      setSuggesting(false);
    }
  }

  function applySuggestion() {
    if (disabled || !reviewedSuggestion || !canApply(reviewedSuggestion)) return;
    onApply(reviewedSuggestion);
    setSuggestion(null);
    setMessage(shared
      ? "Shared suggestion applied to unedited fields. Review every video before importing."
      : "Suggestion applied. Review the classification before importing.");
  }

  return (
    <fieldset disabled={disabled || tooMany} className={shared
      ? "space-y-3 rounded-xl border border-purple-400/25 bg-purple-500/[0.05] p-4"
      : "space-y-3 border-t border-white/10 pt-4"}>
      {shared && (
        <div className="space-y-1">
          <p className="text-sm font-bold text-purple-200">{t("Shared classification")} · {videoIds.length} {t("VIDEO(S) SELECTED")}</p>
          <p className="text-xs leading-5 text-zinc-400">{t("Describe only facts verified for every selected video. Different videos can still be edited individually.")}</p>
          {tooMany && <p className="text-xs text-amber-300">{t("Import a maximum of 20 videos per batch.")}</p>}
        </div>
      )}
      <label className="block space-y-1 text-xs text-zinc-300">
        <span>{t(shared ? "Shared editorial note for selected videos" : "Editorial note for this video")}</span>
        <textarea
          value={note}
          onChange={event => {
            setNote(event.target.value);
            setSuggestion(null);
            setMessage("");
          }}
          maxLength={EDITORIAL_NOTE_LIMIT}
          rows={2}
          disabled={suggesting}
          placeholder={t(shared ? "Describe common facts in your own words." : "Describe what you verified in your own words.")}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-purple-400"
        />
      </label>
      <button
        type="button"
        disabled={!note.trim() || suggesting || disabled || tooMany}
        onClick={() => void suggestClassification()}
        className="rounded-lg border border-purple-400/40 px-3 py-2 text-xs font-bold text-purple-300 hover:text-white disabled:opacity-40"
      >
        {t(suggesting ? "Getting suggestion…" : shared ? "Suggest classifications for selected videos" : "Suggest classification")}
      </button>
      {message && <p role="status" className="text-xs text-zinc-300">{t(message)}</p>}
      {reviewedSuggestion && (
        <div role="status" className="space-y-2 rounded-lg bg-purple-500/10 p-3 text-xs text-zinc-200">
          <p className="font-bold text-purple-200">{t(shared ? "AI suggestion for all selected videos" : "AI suggestion")}</p>
          {suggestedCollection && <p>{t("Collection")} · {suggestedCollection.title}</p>}
          {suggestedEra && <p>{t("Era")} · {suggestedEra.name}</p>}
          {suggestedMembers.length > 0 && <p>{t("Participating members")} · {suggestedMembers.map(member => member.name).join(", ")}</p>}
          {(!suggestedCollection || !suggestedEra || !suggestedMembers.length) && (
            <p className="text-amber-200">{t("Some fields have insufficient evidence. Review them manually.")}</p>
          )}
          {reviewedSuggestion.reason && <p>{reviewedSuggestion.reason}</p>}
          {canApply(reviewedSuggestion) ? (
            <button type="button" onClick={applySuggestion} className="font-bold text-purple-300 hover:text-white">
              {t(shared ? "Apply shared suggestion to unedited fields" : "Apply to fields without individual edits")}
            </button>
          ) : (
            <p className="text-zinc-400">{t("No unedited fields can receive this suggestion.")}</p>
          )}
        </div>
      )}
    </fieldset>
  );
}

"use client";

import { useState } from "react";

import { useAdminLocale } from "@/components/AdminLocaleProvider";
import { useAdminText } from "@/components/useAdminText";
import {
  EDITORIAL_NOTE_LIMIT,
  resolveImportClassification,
  type BatchClassification,
  type ImportReviewOverride,
  type ImportSuggestion,
} from "@/lib/admin/import/review";

type Option = { id: string; name: string };
type Collection = { id: string; title: string; category: string };

type Props = {
  videoId: string;
  title: string;
  sourceId: string;
  collections: Collection[];
  eras: Option[];
  members: Option[];
  batch: BatchClassification;
  override?: ImportReviewOverride;
  disabled: boolean;
  aiEnabled: boolean;
  onChange: (override: ImportReviewOverride) => void;
};

const selectClass = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-purple-400";

export default function AdminImportVideoReview({
  videoId, title, sourceId, collections, eras, members, batch, override = {},
  disabled, aiEnabled, onChange,
}: Props) {
  const t = useAdminText();
  const { locale } = useAdminLocale();
  const [note, setNote] = useState("");
  const [suggestion, setSuggestion] = useState<ImportSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState("");

  const current = resolveImportClassification(batch, override);
  const collection = collections.find((item) => item.id === current.collectionId);
  const suggestedCollection = collections.find((item) => item.id === suggestion?.collectionId);
  const suggestedEra = eras.find((item) => item.id === suggestion?.eraId);
  const suggestedMembers = suggestion
    ? members.filter((item) => suggestion.memberIds.includes(item.id))
    : [];
  const applyCollection = override.collectionId === undefined ? suggestedCollection : undefined;
  const applyEra = override.eraId === undefined ? suggestedEra : undefined;
  const applyMembers = override.memberIds === undefined && suggestedMembers.length > 0;
  const canApply = Boolean(applyCollection || applyEra || applyMembers);
  const hasManualOverride = Object.keys(override).length > 0;

  async function suggestClassification() {
    if (!note.trim() || suggesting) return;

    setSuggesting(true);
    setSuggestion(null);
    setSuggestionMessage("");
    try {
      const response = await fetch("/api/admin/import/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, sourceId, note: note.trim(), locale }),
      });
      const result = await response.json();

      if (!response.ok) {
        setSuggestionMessage(result.error ?? "Suggestions are unavailable. You can finish the review manually.");
        return;
      }

      setSuggestion(result.suggestion);
    } catch {
      setSuggestionMessage("Suggestions are unavailable. You can finish the review manually.");
    } finally {
      setSuggesting(false);
    }
  }

  function applySuggestion() {
    if (!canApply) return;

    onChange({
      ...override,
      collectionId: applyCollection?.id ?? override.collectionId,
      eraId: applyEra?.id ?? override.eraId,
      memberIds: applyMembers ? suggestedMembers.map((member) => member.id) : override.memberIds,
      confirmedMvCollectionId: applyCollection && applyCollection.id !== current.collectionId
        ? undefined
        : override.confirmedMvCollectionId,
    });
    setSuggestion(null);
    setSuggestionMessage("Suggestion applied. Review the classification before importing.");
  }

  return (
    <details className="rounded-lg border border-white/10 bg-black/20">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-white">
        {title}
        <span className="mt-1 block text-xs font-normal text-zinc-400">
          {collection?.title ?? t("Choose a collection")}
          {hasManualOverride ? ` · ${t("Individual review")}` : ` · ${t("Batch defaults")}`}
          {collection?.category === "MV" && !current.officialMvConfirmed && (
            <span className="text-amber-300"> · {t("Official MV confirmation required")}</span>
          )}
        </span>
      </summary>

      <fieldset disabled={disabled} className="space-y-4 border-t border-white/10 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-zinc-300">
            <span>{t("Collection")}</span>
            <select
              value={current.collectionId}
              onChange={(event) => onChange({
                ...override,
                collectionId: event.target.value,
                confirmedMvCollectionId: undefined,
              })}
              className={selectClass}
            >
              <option value="">{t("Choose a collection")}</option>
              {collections.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-zinc-300">
            <span>{t("Era")}</span>
            <select
              value={current.eraId ?? ""}
              onChange={(event) => onChange({ ...override, eraId: event.target.value || null })}
              className={selectClass}
            >
              <option value="">{t("No era")}</option>
              {eras.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs text-zinc-300">{t("Participating members")}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {members.map((member) => (
              <label key={member.id} className="flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  className="accent-purple-500"
                  checked={current.memberIds.includes(member.id)}
                  onChange={(event) => onChange({
                    ...override,
                    memberIds: event.target.checked
                      ? [...current.memberIds, member.id]
                      : current.memberIds.filter((id) => id !== member.id),
                  })}
                />
                {member.name}
              </label>
            ))}
          </div>
        </fieldset>

        {collection?.category === "MV" && (
          <label className="flex items-center gap-2 text-xs text-amber-300">
            <input
              type="checkbox"
              className="accent-purple-500"
              checked={current.officialMvConfirmed}
              onChange={(event) => onChange({
                ...override,
                confirmedMvCollectionId: event.target.checked ? collection.id : undefined,
              })}
            />
            {t("I verified that this is an official music video.")}
          </label>
        )}

        {hasManualOverride && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs font-semibold text-purple-300 hover:text-white"
          >
            {t("Use batch defaults")}
          </button>
        )}

        {aiEnabled && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <label className="block space-y-1 text-xs text-zinc-300">
              <span>{t("Editorial note for this video")}</span>
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setSuggestion(null);
                  setSuggestionMessage("");
                }}
                maxLength={EDITORIAL_NOTE_LIMIT}
                rows={2}
                disabled={suggesting}
                placeholder={t("Describe what you verified in your own words.")}
                className={selectClass}
              />
            </label>
            <button
              type="button"
              disabled={!note.trim() || suggesting}
              onClick={() => void suggestClassification()}
              className="rounded-lg border border-purple-400/40 px-3 py-2 text-xs font-bold text-purple-300 hover:text-white disabled:opacity-40"
            >
              {suggesting ? t("Getting suggestion…") : t("Suggest classification")}
            </button>
            {suggestionMessage && (
              <p role="status" className="text-xs text-zinc-300">{t(suggestionMessage)}</p>
            )}
            {suggestion && (
              <div role="status" className="space-y-2 rounded-lg bg-purple-500/10 p-3 text-xs text-zinc-200">
                <p className="font-bold text-purple-200">{t("AI suggestion")}</p>
                {suggestedCollection && <p>{t("Collection")} · {suggestedCollection.title}</p>}
                {suggestedEra && <p>{t("Era")} · {suggestedEra.name}</p>}
                {suggestedMembers.length > 0 && (
                  <p>{t("Participating members")} · {suggestedMembers.map((member) => member.name).join(", ")}</p>
                )}
                {(!suggestedCollection || !suggestedEra || !suggestedMembers.length) && (
                  <p className="text-amber-200">{t("Some fields have insufficient evidence. Review them manually.")}</p>
                )}
                {suggestion.reason && <p>{suggestion.reason}</p>}
                {canApply && (
                  <button type="button" onClick={applySuggestion} className="font-bold text-purple-300 hover:text-white">
                    {t("Apply to fields without individual edits")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </fieldset>
    </details>
  );
}

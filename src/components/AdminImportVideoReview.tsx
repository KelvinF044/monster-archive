"use client";

import { useAdminText } from "@/components/useAdminText";
import AdminImportSuggestionPanel from "@/components/AdminImportSuggestionPanel";
import {
  applyImportSuggestion,
  resolveImportClassification,
  type BatchClassification,
  type ImportReviewOverride,
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
  const current = resolveImportClassification(batch, override);
  const collection = collections.find((item) => item.id === current.collectionId);
  const currentEra = eras.find(item => item.id === current.eraId);
  const currentMembers = members.filter(item => current.memberIds.includes(item.id));
  const hasManualOverride = Object.keys(override).length > 0;

  return (
    <details open={aiEnabled || undefined} className="rounded-lg border border-white/10 bg-black/20">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-white">
        {title}
        <span className="mt-1 block text-xs font-normal text-zinc-400">
          {collection?.title ?? t("Choose a collection")}
          {hasManualOverride ? ` · ${t("Individual review")}` : ` · ${t("Batch defaults")}`}
          {collection?.category === "MV" && !current.officialMvConfirmed && (
            <span className="text-amber-300"> · {t("Official MV confirmation required")}</span>
          )}
        </span>
        <span className="mt-1 block text-xs font-normal text-zinc-500">
          {t("Era")}: {currentEra?.name ?? t("No era")} · {t("Participating members")}: {currentMembers.map(member => member.name).join(", ") || "—"}
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

        {aiEnabled && <AdminImportSuggestionPanel
          key={JSON.stringify([sourceId, videoId])}
          videoIds={[videoId]}
          sourceId={sourceId}
          collections={collections}
          eras={eras}
          members={members}
          disabled={disabled}
          canApply={suggestion => applyImportSuggestion(batch, override, suggestion) !== override}
          onApply={suggestion => onChange(applyImportSuggestion(batch, override, suggestion))}
        />}
      </fieldset>
    </details>
  );
}

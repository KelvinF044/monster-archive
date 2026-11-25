export const IMPORT_BATCH_LIMIT = 20;
export const EDITORIAL_NOTE_LIMIT = 500;
export const BATCH_EDITORIAL_NOTE_LIMIT = 2500;

export const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ImportClassification = {
  collectionId: string;
  eraId: string | null;
  memberIds: string[];
  officialMvConfirmed: boolean;
};

export type BatchClassification = Omit<ImportClassification, "officialMvConfirmed">;

export type ImportReviewOverride = Partial<BatchClassification> & {
  confirmedMvCollectionId?: string;
};

export function resolveImportClassification(
  batch: BatchClassification,
  override: ImportReviewOverride = {}
): ImportClassification {
  const collectionId = override.collectionId ?? batch.collectionId;

  return {
    collectionId,
    eraId: override.eraId === undefined ? batch.eraId : override.eraId,
    memberIds: override.memberIds ?? batch.memberIds,
    officialMvConfirmed: override.confirmedMvCollectionId === collectionId,
  };
}

export type ImportItem = ImportClassification & { videoId: string };

export type ImportSuggestion = {
  collectionId: string | null;
  eraId: string | null;
  memberIds: string[];
  reason: string;
};

export type NumberedEditorialNote = {
  sharedNote: string;
  entries: { number: number; note: string }[];
};

/** Numbers refer to the displayed review order, not YouTube IDs or titles. */
export function parseNumberedEditorialNote(note: string, count: number): NumberedEditorialNote | null {
  const markers = [...note.matchAll(/(?:^|[\r\n;])[ \t]*(?:v[ií]deo[ \t]*)?#?(\d{1,3})[ \t]*[:.)-][ \t]*/giu)];
  if (!markers.length) return { sharedNote: note.trim(), entries: [] };

  const clean = (value: string) => value.trim().replace(/;+$/, "").trim();
  const sharedNote = clean(note.slice(0, markers[0].index));
  const entries: NumberedEditorialNote["entries"] = [];
  const seen = new Set<number>();
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const number = Number(marker[1]);
    const ownNote = clean(note.slice(marker.index! + marker[0].length, markers[i + 1]?.index ?? note.length));
    if (!Number.isInteger(number) || number < 1 || number > count || seen.has(number) || !ownNote) return null;
    seen.add(number);
    entries.push({ number, note: ownNote });
  }
  return { sharedNote, entries };
}

/** Suggestions fill only fields without an explicit individual override. */
export function applyImportSuggestion(
  batch: BatchClassification,
  override: ImportReviewOverride,
  suggestion: ImportSuggestion,
): ImportReviewOverride {
  const next = { ...override };
  let applied = false;
  if (override.collectionId === undefined && suggestion.collectionId) {
    next.collectionId = suggestion.collectionId;
    if (suggestion.collectionId !== resolveImportClassification(batch, override).collectionId) {
      delete next.confirmedMvCollectionId;
    }
    applied = true;
  }
  if (override.eraId === undefined && suggestion.eraId) {
    next.eraId = suggestion.eraId;
    applied = true;
  }
  if (override.memberIds === undefined && suggestion.memberIds.length > 0) {
    next.memberIds = [...suggestion.memberIds];
    applied = true;
  }
  return applied ? next : override;
}

export function applyImportSuggestionToBatch(
  batch: BatchClassification,
  overrides: Record<string, ImportReviewOverride>,
  videoIds: readonly string[],
  suggestion: ImportSuggestion,
  individualSuggestions: Record<string, ImportSuggestion> = {},
) {
  let next = overrides;
  for (const videoId of videoIds) {
    const original = overrides[videoId] ?? {};
    const updated = applyImportSuggestion(batch, original, individualSuggestions[videoId] ?? suggestion);
    if (updated !== original) {
      if (next === overrides) next = { ...overrides };
      next[videoId] = updated;
    }
  }
  return next;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseImportSuggestionRequest(body: unknown): {
  sourceId: string;
  videoIds: string[];
  note: string;
  locale: "en" | "pt-BR";
  scope: "single" | "batch";
} | null {
  if (!isRecord(body)) return null;
  const { sourceId, videoId, videoIds, note, locale } = body;
  const shared = videoIds !== undefined;
  if (typeof sourceId !== "string" || !uuidPattern.test(sourceId) ||
      typeof note !== "string" || !note.trim() ||
      note.length > (shared ? BATCH_EDITORIAL_NOTE_LIMIT : EDITORIAL_NOTE_LIMIT) ||
      (locale !== "en" && locale !== "pt-BR")) return null;

  const ids = shared ? videoIds : [videoId];
  if ((shared && videoId !== undefined) ||
      !Array.isArray(ids) || ids.length < (shared ? 2 : 1) ||
      ids.length > IMPORT_BATCH_LIMIT ||
      ids.some(id => typeof id !== "string" || !youtubeVideoIdPattern.test(id)) ||
      new Set(ids).size !== ids.length) return null;

  return { sourceId, videoIds: ids as string[], note: note.trim(), locale, scope: shared ? "batch" as const : "single" as const };
}

function parseItem(value: unknown): ImportItem | null {
  if (!isRecord(value)) return null;

  const { videoId, collectionId, eraId, memberIds, officialMvConfirmed } = value;
  if (
    typeof videoId !== "string" || !youtubeVideoIdPattern.test(videoId) ||
    typeof collectionId !== "string" || !uuidPattern.test(collectionId) ||
    (eraId != null && eraId !== "" &&
      (typeof eraId !== "string" || !uuidPattern.test(eraId))) ||
    (memberIds !== undefined && (
      !Array.isArray(memberIds) || memberIds.length > 7 ||
      memberIds.some((id) => typeof id !== "string" || !uuidPattern.test(id))
    )) ||
    (officialMvConfirmed !== undefined && typeof officialMvConfirmed !== "boolean")
  ) {
    return null;
  }

  return {
    videoId,
    collectionId,
    eraId: typeof eraId === "string" && eraId ? eraId : null,
    memberIds: Array.isArray(memberIds) ? [...new Set(memberIds)] : [],
    officialMvConfirmed: officialMvConfirmed === true,
  };
}

export function parseImportApproval(body: unknown) {
  if (!isRecord(body) || typeof body.sourceId !== "string" || !uuidPattern.test(body.sourceId)) {
    return null;
  }

  const individual = body.items !== undefined;
  const rows = individual
    ? body.items
    : Array.isArray(body.videoIds)
      ? [...new Set(body.videoIds)].map((videoId) => ({
          videoId,
          collectionId: body.collectionId,
          eraId: body.eraId,
          memberIds: body.memberIds,
          officialMvConfirmed: body.officialMvConfirmed,
        }))
      : null;

  if (!Array.isArray(rows) || rows.length === 0 || rows.length > IMPORT_BATCH_LIMIT) {
    return null;
  }

  const items = new Map<string, ImportItem>();
  for (const row of rows) {
    const item = parseItem(row);
    if (!item || items.has(item.videoId)) return null;
    items.set(item.videoId, item);
  }

  return { sourceId: body.sourceId, items };
}

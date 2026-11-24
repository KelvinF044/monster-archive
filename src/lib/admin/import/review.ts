export const IMPORT_BATCH_LIMIT = 20;
export const EDITORIAL_NOTE_LIMIT = 500;

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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

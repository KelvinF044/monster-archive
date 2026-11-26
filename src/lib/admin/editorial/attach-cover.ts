import "server-only";
import type { AdminDatabase } from "../news/queries";
import { getSource } from "./repository";
import { ygReportUrl } from "./publishers";
import { readYgCover } from "./read-yg";

const COVER_HASH = /^[a-f0-9]{64}$/;
export const isCoverHash = (value: unknown): value is string => typeof value === "string" && COVER_HASH.test(value);

export async function uploadYgDraftCover(db: AdminDatabase, candidate: { id: string; source_id: string; source_url: string }, hash: string) {
  if (!ygReportUrl(candidate.source_url)) return { error: "cover_missing", status: 404 } as const;
  const source = await getSource(db, candidate.source_id);
  if (!source?.is_active) return { error: "candidate_unavailable", status: 409 } as const;
  const cover = await readYgCover(candidate.source_url).catch(() => null);
  if (!cover) return { error: "cover_unavailable", status: 502 } as const;
  if (cover.hash !== hash) return { error: "cover_changed", status: 409 } as const;
  const suffix = cover.mime === "image/jpeg" ? "jpg" : cover.mime.split("/")[1];
  const path = `news/${candidate.id}-${cover.hash.slice(0, 24)}.${suffix}`;
  const bucket = db.storage.from("archive-images");
  const result = await bucket.upload(path, cover.bytes, { contentType: cover.mime, upsert: false, cacheControl: "3600" });
  if (result.error) {
    const status = "statusCode" in result.error ? String(result.error.statusCode) : "";
    const message = result.error.message.toLowerCase();
    // The path is tied to the candidate and content hash. A retry can reuse
    // an earlier upload without replacing pixels or deleting a live cover.
    if (status !== "409" && !(status === "400" && /already exists|duplicate/.test(message))) {
      console.warn("Editorial cover storage failed", { status });
      return { error: "cover_storage", status: 503 } as const;
    }
  }
  return { url: bucket.getPublicUrl(path).data.publicUrl };
}

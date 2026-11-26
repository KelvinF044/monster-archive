import "server-only";
import { isUuid, searchText } from "../news/model";
import type { AdminDatabase } from "../news/queries";
import { isCandidateKind, isCandidateStatus, QUEUE_PAGE_SIZE, type Candidate, type CandidateKind, type Discovery, type DiscoverySource, type Queue } from "./model";

export const sourceFields = "id,name,homepage_url,source_kind,is_active,feed_url,discovery_method,last_scanned_at,updated_at";
const candidateFields = "id,source_id,kind,status,external_id,source_url,canonical_url,original_title,original_excerpt,original_language,source_published_at,duplicate_of_id,editorial_note,created_at,updated_at";

export async function listSources(db: AdminDatabase): Promise<DiscoverySource[]> {
  const sources: DiscoverySource[] = [];
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await db.from("editorial_sources").select(sourceFields)
      .order("name").order("id").range(offset, offset + 249);
    if (error) throw new Error("database_error");
    sources.push(...data as DiscoverySource[]);
    if (data.length < 250) return sources;
  }
}
export async function listCandidates(db: AdminDatabase, params: URLSearchParams): Promise<Queue> {
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1));
  const sourceId = params.get("source"), status = params.get("status"), kind = params.get("kind");
  const term = searchText(params.get("q"));
  let query = db.from("editorial_candidates").select(candidateFields, { count: "exact" });
  if (isUuid(sourceId)) query = query.eq("source_id", sourceId);
  if (isCandidateKind(kind)) query = query.eq("kind", kind);
  if (isCandidateStatus(status)) query = query.eq("status", status);
  if (term) query = query.ilike("original_title", `%${term}%`);
  const { data, error, count } = await query.order("created_at", { ascending: false }).order("id")
    .range((page - 1) * QUEUE_PAGE_SIZE, page * QUEUE_PAGE_SIZE - 1);
  if (error) throw new Error("database_error");
  return { candidates: data as Candidate[], total: count ?? 0, page };
}
export async function getSource(db: AdminDatabase, id: string) {
  const { data, error } = await db.from("editorial_sources").select(sourceFields).eq("id", id).maybeSingle();
  if (error) throw new Error("database_error");
  return data as DiscoverySource | null;
}

export async function insertCandidate(db: AdminDatabase, sourceId: string, kind: CandidateKind, discovery: Discovery) {
  const links = kind === "news" ? "news_article_sources" : "agenda_event_sources";
  const linked = await db.from(links).select("id").eq("canonical_url", discovery.canonical_url).limit(1).maybeSingle();
  if (linked.error) throw new Error("database_error");
  if (linked.data) return "duplicate";

  // The two existing unique indexes cover concurrent submissions and repeated
  // scans: canonical URL across sources and external ID within a source/kind.
  const { error } = await db.from("editorial_candidates").insert({
    ...discovery, source_id: sourceId, kind, status: "pending",
  });
  if (error?.code === "23505") return "duplicate";
  if (error) throw new Error("database_error");
  return "added";
}

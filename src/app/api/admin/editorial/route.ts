import { NextRequest, NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { getSource, insertCandidate, listCandidates, listSources, sourceFields } from "@/lib/admin/editorial/repository";
import { FEED_SCAN_LIMIT, isCandidateKind, isCandidateStatus, matchesFeedTerm, parseDiscovery, parseSource } from "@/lib/admin/editorial/model";
import { discoverNews } from "@/lib/admin/editorial/news-discovery";
import { isNewsProvider, isPressProvider, PRESS_ARCHIVE_PAGE_LIMIT } from "@/lib/admin/editorial/publishers";
import { readFeed } from "@/lib/admin/editorial/read-feed";
import { isUuid, readObject, textValue } from "@/lib/admin/news/model";

export const maxDuration = 60;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
const fail = (error: string, status = 400) => reply({ error }, status);
const dbError = (error: { code?: string }) => error.code === "23505" ? fail("source_duplicate", 409) : fail("database_error", 500);

export async function GET(request: NextRequest) {
  const admin = await requireActiveAdmin();
  if (!admin) return fail("unauthorized", 401);
  try {
    const [sources, queue] = await Promise.all([
      listSources(admin.supabase), listCandidates(admin.supabase, request.nextUrl.searchParams),
    ]);
    return reply({ sources, queue });
  } catch {
    return fail("database_error", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireActiveAdmin();
  if (!admin) return fail("unauthorized", 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return fail("invalid_request", 415);
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (origin && origin !== request.nextUrl.protocol + "//" + host) return fail("invalid_request", 403);
  const raw = await request.text();
  if (raw.length > 16000) return fail("invalid_request", 413);
  let input;
  try { input = readObject(JSON.parse(raw)); } catch { return fail("invalid_request"); }
  if (!input) return fail("invalid_request");

  try {
    const db = admin.supabase;
    if (input.action === "discover_news") {
      if (!isNewsProvider(input.provider) || (input.provider === "rss" && !isUuid(input.sourceId))) return fail("invalid_request");
      const page = input.page ?? 1;
      if (typeof page !== "number" || !Number.isInteger(page) || page < 1 || page > PRESS_ARCHIVE_PAGE_LIMIT ||
          (!isPressProvider(input.provider) && page !== 1)) return fail("invalid_request");
      const result = await discoverNews(db, input.provider, isUuid(input.sourceId) ? input.sourceId : null, page);
      return "error" in result ? fail(result.error!, result.status) : reply(result);
    }

    if (input.action === "save_source") {
      const fields = parseSource(input.fields);
      if (!fields) return fail("invalid_source");
      if (input.id === null) {
        const { data, error } = await db.from("editorial_sources").insert(fields).select(sourceFields).single();
        return error ? dbError(error) : reply({ source: data }, 201);
      }
      if (!isUuid(input.id) || typeof input.expectedUpdatedAt !== "string") return fail("invalid_request");
      const previous = await getSource(db, input.id);
      if (!previous || previous.updated_at !== input.expectedUpdatedAt) return fail("stale", 409);
      const sameFeed = fields.feed_url === previous.feed_url;
      const { data, error } = await db.from("editorial_sources")
        .update({
          ...fields,
          discovery_method: sameFeed && previous.discovery_method === "api" ? "api" : fields.discovery_method,
          ...(sameFeed ? {} : { last_scanned_at: null }),
        })
        .eq("id", input.id).eq("updated_at", input.expectedUpdatedAt).select(sourceFields).maybeSingle();
      return error ? dbError(error) : data ? reply({ source: data }) : fail("stale", 409);
    }

    if (input.action === "curate") {
      const note = textValue(input.note, 1500);
      if (!isUuid(input.id) || !isCandidateStatus(input.status) || note === null || typeof input.expectedUpdatedAt !== "string") {
        return fail("invalid_request");
      }
      const { data, error } = await db.from("editorial_candidates")
        .update({ status: input.status, editorial_note: note || null, ...(input.status === "duplicate" ? {} : { duplicate_of_id: null }) })
        .eq("id", input.id).eq("updated_at", input.expectedUpdatedAt).select("id").maybeSingle();
      return error ? dbError(error) : data ? reply({ id: data.id }) : fail("stale", 409);
    }

    if (!isUuid(input.sourceId) || !isCandidateKind(input.kind)) return fail("invalid_request");
    const source = await getSource(db, input.sourceId);
    if (!source?.is_active) return fail("inactive_source", 409);

    if (input.action === "add_candidate") {
      const discovery = parseDiscovery(input.fields);
      if (!discovery) return fail("invalid_candidate");
      const result = await insertCandidate(db, source.id, input.kind, discovery);
      return result === "duplicate" ? fail("candidate_duplicate", 409) : reply({ added: 1 }, 201);
    }

    if (input.action === "scan") {
      const term = textValue(input.term, 100);
      if (term === null || source.discovery_method !== "rss" || !source.feed_url) return fail("invalid_source");
      let matches;
      try {
        matches = (await readFeed(source.feed_url)).filter(item => matchesFeedTerm(item, term));
      } catch {
        return fail("feed_error", 422);
      }
      const current = await getSource(db, source.id);
      if (!current?.is_active || current.updated_at !== source.updated_at) return fail("stale", 409);

      let added = 0, duplicates = 0;
      const kind = input.kind;
      const items = matches.slice(0, FEED_SCAN_LIMIT);
      for (let index = 0; index < items.length; index += 5) {
        const outcomes = await Promise.allSettled(items.slice(index, index + 5).map(item => insertCandidate(db, source.id, kind, item)));
        for (const outcome of outcomes) {
          if (outcome.status === "fulfilled") {
            if (outcome.value === "added") added++;
            else duplicates++;
          }
        }
        if (outcomes.some(outcome => outcome.status === "rejected")) {
          return fail("scan_partial", 503);
        }
      }
      const saved = await db.from("editorial_sources")
        .update({ last_scanned_at: new Date().toISOString() })
        .eq("id", source.id).eq("updated_at", source.updated_at);
      if (saved.error) return fail("scan_partial", 503);
      return reply({ added, duplicates, matches: matches.length, truncated: matches.length > FEED_SCAN_LIMIT });
    }
    return fail("invalid_request");
  } catch {
    return fail("database_error", 500);
  }
}

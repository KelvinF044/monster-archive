import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { isUuid, readObject, textValue } from "@/lib/admin/news/model";
import { isCandidateKind } from "@/lib/admin/editorial/model";
import { editorialAiEnabled, editorialGatewayToken, generateEditorialSuggestion } from "@/lib/admin/editorial/assist-gateway";
import { editorialDraftSlug, FACTS_LIMIT, parseEditorialSuggestion, PROMPT_VERSION } from "@/lib/admin/editorial/assist-model";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
function fail(error: string, status = 400) { return reply({ error }, status); }
function databaseError(error: { code?: string }) {
  if (error.code === "PGRST202" || error.code === "42883") return fail("ai_setup", 503);
  if (error.code === "42501") return fail("unauthorized", 403);
  console.warn("Editorial AI database operation failed", { code: error.code });
  return fail("database_error", 500);
}

export async function POST(request: NextRequest) {
  const admin = await requireActiveAdmin();
  if (!admin) return fail("unauthorized", 401);
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (origin && origin !== request.nextUrl.protocol + "//" + host) return fail("invalid_request", 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return fail("invalid_request", 415);

  let input;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return fail("invalid_request", 413);
    input = readObject(JSON.parse(raw));
  } catch { return fail("invalid_request"); }
  if (!input || !isUuid(input.id) || !["generate", "save"].includes(String(input.action))
    || typeof input.expectedUpdatedAt !== "string" || input.expectedUpdatedAt.length > 40
    || !Number.isFinite(Date.parse(input.expectedUpdatedAt))) return fail("invalid_request");

  const db = admin.supabase;
  try {
    const { data: candidate, error } = await db.from("editorial_candidates")
      .select("id,kind,original_title,original_excerpt,original_language").eq("id", input.id).maybeSingle();
    if (error) return databaseError(error);
    if (!candidate || !isCandidateKind(candidate.kind)) return fail("candidate_unavailable", 409);
    const expected = { p_candidate: candidate.id, p_expected_updated_at: input.expectedUpdatedAt };

    if (input.action === "save") {
      const suggestion = parseEditorialSuggestion(input.suggestion, candidate.kind);
      if (!isUuid(input.runId) || !suggestion) return fail("invalid_request");
      const saved = await db.rpc("save_editorial_ai_draft", {
        ...expected, p_run: input.runId, p_slug: editorialDraftSlug(suggestion),
        p_category: suggestion.category, p_title_pt: suggestion.title_pt, p_title_en: suggestion.title_en,
        p_summary_pt: suggestion.summary_pt, p_summary_en: suggestion.summary_en,
      });
      if (saved.error) return databaseError(saved.error);
      const data = readObject(saved.data);
      if (data?.state === "draft" && isUuid(data.id)) {
        return reply({ draft: { id: data.id, kind: candidate.kind, existing: data.existing === true } });
      }
      if (data?.state === "candidate_duplicate") return fail("candidate_duplicate", 409);
      if (data?.state === "invalid_request") return fail("invalid_request");
      return fail("candidate_unavailable", 409);
    }

    const facts = textValue(input.facts, FACTS_LIMIT);
    if (facts === null) return fail("invalid_request");
    if (!editorialAiEnabled()) return fail("ai_disabled", 503);
    const token = editorialGatewayToken(request.headers.get("x-vercel-oidc-token"));
    if (!token) return fail("ai_auth", 503);

    // Only explicitly supplied evidence goes to the model. Source URLs,
    // administrative notes, account data, and credentials stay out of prompts.
    const evidence = {
      kind: candidate.kind,
      title: candidate.original_title.slice(0, 250),
      excerpt: candidate.original_excerpt?.slice(0, 500) ?? null,
      language: candidate.original_language?.slice(0, 35) ?? null,
      facts,
    };
    const inputHash = createHash("sha256").update(JSON.stringify([PROMPT_VERSION, candidate.id, evidence])).digest("hex");
    const reserved = await db.rpc("reserve_editorial_ai", { ...expected, p_input_hash: inputHash });
    if (reserved.error) return databaseError(reserved.error);
    const reservation = readObject(reserved.data);
    if (reservation?.state === "ai_budget") return fail("ai_budget", 429);
    if (reservation?.state === "ai_in_progress") return fail("ai_in_progress", 409);
    if (reservation?.state === "candidate_unavailable") return fail("candidate_unavailable", 409);
    if (reservation?.state === "draft" && isUuid(reservation.id)) {
      return reply({ draft: { id: reservation.id, kind: candidate.kind, existing: true } });
    }
    if (!isUuid(reservation?.id)) return fail("database_error", 500);
    const runId = reservation.id;
    if (reservation.state === "reused") {
      const suggestion = parseEditorialSuggestion(reservation.suggestion, candidate.kind);
      return suggestion ? reply({ runId, suggestion, reused: true }) : fail("ai_invalid", 502);
    }
    if (reservation.state !== "reserved") return fail("database_error", 500);

    const model = await generateEditorialSuggestion(token, evidence);
    const completion = await db.rpc("finish_editorial_ai", {
      p_run: runId, p_suggestion: model.suggestion, p_input_tokens: model.inputTokens,
      p_output_tokens: model.outputTokens, p_error: model.error,
    });
    if (completion.error) return databaseError(completion.error);
    if (completion.data !== true) return fail("database_error", 500);
    if (model.suggestion) return reply({ runId, suggestion: model.suggestion, reused: false });
    console.warn("Editorial AI generation failed", { kind: model.error });
    if (model.error === "invalid_output") return fail("ai_invalid", 502);
    if (model.error === "budget_exceeded" || model.error === "credits_unavailable") return fail("ai_gateway_credits", 503);
    if (model.error === "rate_limit") return fail("ai_rate_limit", 429);
    if (model.error === "verification_required") return fail("ai_verify", 503);
    return fail("ai_unavailable", 503);
  } catch {
    return fail("database_error", 500);
  }
}

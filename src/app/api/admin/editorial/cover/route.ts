import { NextRequest, NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin/requireActiveAdmin";
import { isUuid } from "@/lib/admin/news/model";
import { getSource } from "@/lib/admin/editorial/repository";
import { readYgCover } from "@/lib/admin/editorial/read-yg";
import { ygReportUrl } from "@/lib/admin/editorial/publishers";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const admin = await requireActiveAdmin();
  if (!admin) return fail("unauthorized", 401);
  const id = request.nextUrl.searchParams.get("id");
  if (!isUuid(id)) return fail("invalid_request", 400);
  try {
    const { data, error } = await admin.supabase.from("editorial_candidates")
      .select("source_id,source_url,kind,status").eq("id", id).maybeSingle();
    if (error) return fail("database_error", 500);
    if (!data || data.kind !== "news" || data.status !== "accepted" || !ygReportUrl(data.source_url)) return fail("cover_missing", 404);
    const source = await getSource(admin.supabase, data.source_id);
    if (!source?.is_active) return fail("candidate_unavailable", 409);

    const cover = await readYgCover(data.source_url);
    if (!cover) return fail("cover_missing", 404);
    return new Response(new Uint8Array(cover.bytes), {
      headers: {
        "Content-Type": cover.mime,
        "Content-Length": String(cover.bytes.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Editorial-Cover-Hash": cover.hash,
      },
    });
  } catch {
    return fail("cover_unavailable", 502);
  }
}

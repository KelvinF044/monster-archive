import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { RECOVERY_COOKIE } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function sendTo(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: location,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return sendTo("/login?status=invalid-link");

  const supabase = await createClient();
  const flowId = request.nextUrl.searchParams.get("sb_flow_id") ?? undefined;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code, { flowId });
  if (error) return sendTo("/login?status=invalid-link");

  const cookieStore = await cookies();
  cookieStore.delete(RECOVERY_COOKIE);
  if ("redirectType" in data && data.redirectType === "recovery") {
    const { data: session } = await supabase.auth.getClaims();
    const sessionId = session?.claims.session_id;
    if (!sessionId) return sendTo("/login?status=invalid-link");
    cookieStore.set(RECOVERY_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname),
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    return sendTo("/reset-password");
  }

  return sendTo("/account?status=confirmed");
}

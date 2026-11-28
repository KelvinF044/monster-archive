import { NextResponse, type NextRequest } from "next/server";
import { isSignupTokenHash, SIGNUP_CONFIRMATION_COOKIE, signupConfirmationPath } from "@/lib/auth/redirects";

export function GET(request: NextRequest) {
  const tokens = request.nextUrl.searchParams.getAll("token_hash");
  const token = tokens[0];
  const path = tokens.length === 1 && isSignupTokenHash(token)
    ? `${signupConfirmationPath}/${crypto.randomUUID()}`
    : null;
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: path ?? "/login?status=invalid-link",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });

  // Email scanners can follow this URL. Only the confirmation form uses the token.
  if (path && token) {
    response.cookies.set(SIGNUP_CONFIRMATION_COOKIE, token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path,
      maxAge: 15 * 60,
    });
  }
  return response;
}

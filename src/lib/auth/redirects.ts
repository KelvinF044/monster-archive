import { headers } from "next/headers";

export const RECOVERY_COOKIE = "monster_password_recovery";
export const SIGNUP_CONFIRMATION_COOKIE = "monster_signup_confirmation";
export const signupConfirmationPath = "/confirm-email";

export function isSignupTokenHash(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[a-z0-9_-]{24,128}$/i.test(value);
}

export function afterLogin(next: unknown) {
  if (next === "admin") return "/admin";
  if (next === "moderation") return "/admin/moderation";
  if (next === "profiles") return "/admin/profiles";
  if (next === "library") return "/library";
  if (typeof next === "string" && /^\/watch\/[a-z0-9-]{1,120}\/[a-z0-9-]{1,160}$/.test(next)) return next;
  return "/account";
}

export async function authCallbackUrl() {
  const origin = (await headers()).get("origin");
  const allowed = new Set<string>();
  const configured = process.env.AUTH_SITE_URL;
  if (configured) allowed.add(new URL(configured).origin);

  if (process.env.VERCEL_ENV === "preview") {
    for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
      if (host) allowed.add(`https://${host}`);
    }
  } else if (process.env.VERCEL_ENV === "production") {
    allowed.add("https://www.themonsterarchive.com");
    allowed.add("https://themonsterarchive.com");
  } else if (origin && /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)) {
    allowed.add(origin);
  }

  if (!origin || !allowed.has(origin)) return null;
  return new URL("/auth/callback", origin).href;
}

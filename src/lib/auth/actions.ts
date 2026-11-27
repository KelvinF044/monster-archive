"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { afterLogin, authCallbackUrl, RECOVERY_COOKIE } from "./redirects";
import { getSessionClaims } from "./session";

export type AuthState = {
  error?: "invalidLogin" | "unconfirmed" | "invalidInput" | "unavailable" | "rateLimit" | "passwordPolicy" | "invalidLink";
  success?: "signupSent" | "resetSent" | "resent";
  email?: string;
};

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function emailFrom(data: FormData) {
  const email = field(data, "email").trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function passwordIsValid(password: string) {
  return password.length >= 8 && new TextEncoder().encode(password).length <= 72;
}

function failed(code: string | undefined, status?: number): AuthState {
  if (status === 429) return { error: "rateLimit" };
  if (code === "weak_password" || code === "same_password") return { error: "passwordPolicy" };
  return { error: "unavailable" };
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailFrom(form);
  const password = field(form, "password");
  if (!email || !password || password.length > 1024) return { error: "invalidLogin" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed") return { error: "unconfirmed", email };
  if (error?.code === "invalid_credentials") return { error: "invalidLogin" };
  if (error) return failed(error.code, error.status);
  redirect(afterLogin(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailFrom(form);
  const displayName = field(form, "displayName").trim();
  const password = field(form, "password");
  if (!email || !displayName || displayName.length > 40) return { error: "invalidInput" };
  if (!passwordIsValid(password)) return { error: "passwordPolicy" };

  const emailRedirectTo = await authCallbackUrl();
  if (!emailRedirectTo) return { error: "unavailable" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo, data: { display_name: displayName } },
  });

  if (error && error.code !== "user_already_exists" && error.code !== "email_exists") {
    return failed(error.code, error.status);
  }
  if (data.session) redirect("/account");
  return { success: "signupSent", email };
}

export async function resendConfirmation(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailFrom(form);
  if (!email) return { error: "invalidInput" };

  const emailRedirectTo = await authCallbackUrl();
  if (!emailRedirectTo) return { error: "unavailable" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  if (error && error.code !== "user_not_found" && error.code !== "email_confirmed") {
    return failed(error.code, error.status);
  }
  return { success: "resent" };
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = emailFrom(form);
  if (!email) return { error: "invalidInput" };

  const redirectTo = await authCallbackUrl();
  if (!redirectTo) return { error: "unavailable" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error && error.code !== "user_not_found") return failed(error.code, error.status);
  return { success: "resetSent" };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const claims = await getSessionClaims();
  const cookieStore = await cookies();
  if (!claims?.session_id || claims.session_id !== cookieStore.get(RECOVERY_COOKIE)?.value) {
    return { error: "invalidLink" };
  }

  const password = field(form, "password");
  if (!passwordIsValid(password)) return { error: "passwordPolicy" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return failed(error.code, error.status);

  cookieStore.delete(RECOVERY_COOKIE);
  redirect("/account?status=password-updated");
}

export async function signOut(_: AuthState): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return failed(error.code, error.status);
  (await cookies()).delete(RECOVERY_COOKIE);
  redirect("/login");
}

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authMessages } from "@/lib/auth/messages";
import { isSignupTokenHash, SIGNUP_CONFIRMATION_COOKIE, signupConfirmationPath } from "@/lib/auth/redirects";
import { getLocale } from "@/lib/i18n/server";
import { createStatelessAuthClient } from "@/lib/supabase/server";

async function confirmEmail(path: string) {
  "use server";

  const cookieStore = await cookies();
  const token = cookieStore.get(SIGNUP_CONFIRMATION_COOKIE)?.value;
  if (!isSignupTokenHash(token)) redirect("/login?status=invalid-link");

  const supabase = createStatelessAuthClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "signup" });
  cookieStore.set(SIGNUP_CONFIRMATION_COOKIE, "", { path, maxAge: 0 });
  if (error) redirect("/login?status=invalid-link");

  // This browser may already have a different account signed in.
  // Revoke the temporary verification session without changing the browser's session.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?status=email-confirmed");
}

export default async function ConfirmEmailPage({ params }: { params: Promise<{ attempt: string }> }) {
  const [cookieStore, locale, { attempt }] = await Promise.all([cookies(), getLocale(), params]);
  if (!/^[0-9a-f-]{36}$/.test(attempt)) redirect("/login?status=invalid-link");
  const token = cookieStore.get(SIGNUP_CONFIRMATION_COOKIE)?.value;
  if (!isSignupTokenHash(token)) redirect("/login?status=invalid-link");

  const copy = authMessages(locale);
  const confirm = confirmEmail.bind(null, `${signupConfirmationPath}/${attempt}`);
  return (
    <main className="auth-screen flex min-h-[calc(100svh-5rem)] justify-center px-4 py-12 text-white sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-black">{copy.confirmEmail}</h1>
        <div className="auth-card space-y-5 rounded-2xl border p-5 sm:p-7">
          <p className="text-sm text-zinc-300">{copy.confirmEmailHelp}</p>
          <form action={confirm}>
            <button type="submit" className="w-full rounded-lg bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-purple-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400">{copy.confirmEmail}</button>
          </form>
          <Link href="/login" className="block text-center text-sm font-semibold text-purple-300 hover:underline">{copy.backToLogin}</Link>
        </div>
      </div>
    </main>
  );
}

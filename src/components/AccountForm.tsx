"use client";

import Link from "next/link";
import { useActionState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import {
  requestPasswordReset, resendConfirmation, signIn, signOut, signUp, updatePassword,
  type AuthState,
} from "@/lib/auth/actions";
import { authMessages } from "@/lib/auth/messages";

const fieldClass = "mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-sm text-white focus:border-purple-400 focus:outline-none";
const buttonClass = "w-full rounded-lg bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-purple-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400 disabled:opacity-60";
const linkClass = "font-semibold text-purple-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400";

const actions = {
  login: signIn,
  signup: signUp,
  forgot: requestPasswordReset,
  recovery: updatePassword,
};

function Feedback({ state }: { state: AuthState }) {
  const { locale } = useLanguage();
  const copy = authMessages(locale);
  if (state.error) {
    return <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{copy[state.error]}</p>;
  }
  if (state.success) {
    return <p role="status" className="rounded-lg border border-purple-400/30 bg-purple-500/10 p-3 text-sm text-purple-100">{copy[state.success]}</p>;
  }
  return null;
}

function Resend({ email }: { email: string }) {
  const { locale } = useLanguage();
  const copy = authMessages(locale);
  const [state, submit, pending] = useActionState(resendConfirmation, {});

  return (
    <form action={submit} className="space-y-3 text-sm">
      <input type="hidden" name="email" value={email} />
      <button type="submit" disabled={pending} className={linkClass}>
        {pending ? copy.working : copy.resend}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export default function AccountForm({
  variant,
  next,
  invalidLink,
}: {
  variant: keyof typeof actions;
  next?: "admin";
  invalidLink?: boolean;
}) {
  const { locale } = useLanguage();
  const copy = authMessages(locale);
  const [state, submit, pending] = useActionState(actions[variant], {});
  const login = variant === "login";
  const signup = variant === "signup";
  const forgot = variant === "forgot";
  const recovery = variant === "recovery";

  const heading = login ? copy.welcome : copy[variant];
  const button = login ? copy.login : signup ? copy.signup : forgot ? copy.sendLink : copy.updatePassword;

  return (
    <main className="auth-screen flex min-h-[calc(100svh-5rem)] justify-center px-4 py-12 text-white sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-3xl font-black tracking-[0.18em]">MONSTER<span className="text-purple-400">.</span></p>
          <h1 className="mt-5 text-3xl font-black">{heading}</h1>
          {(signup || forgot) && <p className="mt-3 text-sm text-zinc-400">{signup ? copy.signupHelp : copy.forgotHelp}</p>}
        </div>

        <div className="auth-card space-y-5 rounded-2xl border p-5 sm:p-7">
          {invalidLink && <Feedback state={{ error: "invalidLink" }} />}
          {!state.success && (
            <form action={submit} className="space-y-5">
              {next && <input type="hidden" name="next" value={next} />}
              {signup && (
                <label className="block text-sm font-semibold text-zinc-200">
                  {copy.displayName}
                  <input name="displayName" required maxLength={40} autoComplete="nickname" className={fieldClass} />
                </label>
              )}
              {!recovery && (
                <label className="block text-sm font-semibold text-zinc-200">
                  {copy.email}
                  <input name="email" type="email" required maxLength={254} autoComplete="username" defaultValue={state.email} className={fieldClass} />
                </label>
              )}
              {!forgot && (
                <label className="block text-sm font-semibold text-zinc-200">
                  {recovery ? copy.newPassword : copy.password}
                  <input name="password" type="password" required minLength={login ? undefined : 8} maxLength={login ? 1024 : 72} autoComplete={login ? "current-password" : "new-password"} aria-describedby={login ? undefined : "account-password-help"} className={fieldClass} />
                  {!login && <span id="account-password-help" className="mt-2 block text-xs font-normal text-zinc-400">{copy.passwordHelp}</span>}
                </label>
              )}
              {state.error && <Feedback state={state} />}
              <button type="submit" disabled={pending} className={buttonClass}>{pending ? copy.working : button}</button>
            </form>
          )}
          {state.success && (
            <>
              <Feedback state={state} />
              <p className="text-sm text-zinc-400">{copy.openingLink}</p>
            </>
          )}
          {state.email && <Resend key={state.email} email={state.email} />}
          {login ? (
            <div className="space-y-5 text-sm">
              <div className="text-right">
                <Link href="/forgot-password" className={linkClass}>{copy.forgot}</Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
                {copy.newHere}
                <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
              </div>
              <Link href="/signup" className="block rounded-lg border border-purple-400/50 px-4 py-3 text-center font-semibold text-purple-200 transition hover:bg-purple-500/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400">
                {copy.signup}
              </Link>
            </div>
          ) : (
            <Link href="/login" className={`block text-center text-sm ${linkClass}`}>{copy.backToLogin}</Link>
          )}
        </div>
      </div>
    </main>
  );
}

export function AccountLogout() {
  const { locale } = useLanguage();
  const copy = authMessages(locale);
  const [state, submit, pending] = useActionState(signOut, {});

  return (
    <form action={submit} className="space-y-3">
      <button type="submit" disabled={pending} className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-purple-400">
        {pending ? copy.working : copy.signOut}
      </button>
      <Feedback state={state} />
    </form>
  );
}

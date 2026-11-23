
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminText } from "@/components/useAdminText";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useAdminText();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(t("E-mail ou senha inválidos. Confira seus dados."));
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError(t("Não foi possível conectar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-[#08090d] px-6 py-16 text-white">

      <div className="w-full max-w-md">

        <div className="mb-10 text-center">
          <p className="text-3xl font-black tracking-[0.18em]">
            MONSTER<span className="text-purple-400">.</span>
          </p>

          <p className="mt-6 text-xs font-bold tracking-[0.3em] text-purple-400">
            {t("ADMINISTRATOR ACCESS")}
          </p>

          <h1 className="mt-4 text-3xl font-black">
            {t("Welcome back.")}
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            {t("Sign in to manage the archive.")}
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
        >

          <div className="space-y-5">

            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
              >
                {t("EMAIL ADDRESS")}
              </label>

              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("Your administrator email")}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-bold tracking-widest text-zinc-400"
              >
                {t("PASSWORD")}
              </label>

              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("Your password")}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
              />
            </div>

          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-lg bg-white px-5 py-4 text-sm font-black text-black transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t("AUTHENTICATING...") : t("SIGN IN")}
          </button>

          <p className="mt-6 text-center text-xs leading-6 text-zinc-600">
            {t("Restricted access. Authorized administrators only.")}
          </p>

        </form>

      </div>

    </main>
  );
}

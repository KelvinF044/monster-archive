"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminText } from "@/components/useAdminText";

export default function AdminLogoutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const t = useAdminText();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label={t("Sign out")}
      title={compact ? t("Sign out") : undefined}
      className={`rounded-lg border border-white/10 text-xs font-bold text-zinc-400 transition hover:border-red-400/40 hover:bg-red-400/5 hover:text-red-400 disabled:opacity-50 ${
        compact
          ? "flex h-10 w-10 items-center justify-center px-0"
          : "w-full px-4 py-3 text-left"
      }`}
    >
      {loading ? (compact ? "…" : t("SIGNING OUT...")) : compact ? "↗" : t("SIGN OUT ↗")}
    </button>
  );
}

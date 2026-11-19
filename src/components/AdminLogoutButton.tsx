
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-zinc-400 transition hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
    >
      {loading ? "SIGNING OUT..." : "SIGN OUT ↗"}
    </button>
  );
}

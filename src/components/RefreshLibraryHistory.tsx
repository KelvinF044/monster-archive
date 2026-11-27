"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { getPendingHistoryWrites } from "@/lib/history/client";

export default function RefreshLibraryHistory() {
  const router = useRouter();
  const refreshed = useRef<Promise<void>>(undefined);

  useEffect(() => {
    let active = true;
    function refresh() {
      const pending = getPendingHistoryWrites();
      if (!pending || pending === refreshed.current) return;
      void pending.then(() => {
        if (!active) return;
        refreshed.current = pending;
        router.refresh();
      });
    }
    function restored(event: PageTransitionEvent) {
      if (event.persisted) router.refresh();
    }
    refresh();
    window.addEventListener("pageshow", restored);
    return () => {
      active = false;
      window.removeEventListener("pageshow", restored);
    };
  }, [router]);

  return null;
}

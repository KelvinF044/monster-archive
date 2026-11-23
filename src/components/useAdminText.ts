"use client";

import { useAdminLocale } from "@/components/AdminLocaleProvider";

export function useAdminText() {
  return useAdminLocale().t;
}

"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translateAdminText } from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n/config";

type AdminLocaleContextValue = {
  locale: Locale;
  t: (source: string) => string;
};

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

/** Shared, reactive translation boundary for every route below /admin. */
export default function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const t = useCallback((source: string) => translateAdminText(locale, source), [locale]);
  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return (
    <AdminLocaleContext.Provider value={value}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);
  if (!context) throw new Error("useAdminLocale must be used inside AdminLocaleProvider.");
  return context;
}

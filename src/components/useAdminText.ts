"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { translateAdminText } from "@/lib/i18n/admin";

export function useAdminText() {
  const { locale } = useLanguage();

  return (source: string) => translateAdminText(locale, source);
}

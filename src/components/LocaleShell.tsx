
import type { ReactNode } from "react";

import LanguageProvider from "@/components/LanguageProvider";
import SiteHeader from "@/components/SiteHeader";
import { getLocale } from "@/lib/i18n/server";

export default async function LocaleShell({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();

  return (
    <LanguageProvider initialLocale={locale}>
      <SiteHeader />
      {children}
    </LanguageProvider>
  );
}

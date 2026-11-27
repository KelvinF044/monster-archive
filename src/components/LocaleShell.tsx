
import type { ReactNode } from "react";

import LanguageProvider from "@/components/LanguageProvider";
import SiteHeader from "@/components/SiteHeader";
import { getLocale } from "@/lib/i18n/server";
import { members } from "@/data/members";
import { getSessionClaims } from "@/lib/auth/session";

export default async function LocaleShell({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, claims] = await Promise.all([getLocale(), getSessionClaims()]);

  return (
    <LanguageProvider initialLocale={locale}>
      <SiteHeader signedIn={Boolean(claims)} memberLinks={members.map(({ slug, name }) => ({ slug, name }))} />
      {children}
    </LanguageProvider>
  );
}

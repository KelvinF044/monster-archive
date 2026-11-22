
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

import { messages } from "@/lib/i18n/messages";
import type { Dictionary } from "@/lib/i18n/messages";

type LanguageContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LanguageContext =
  createContext<LanguageContextValue | undefined>(undefined);

export default function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [locale, setLocaleState] =
    useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      // Atualização imediata do idioma no navegador.
      setLocaleState(nextLocale);

      // Persistência da escolha para as próximas visitas.
      document.cookie =
        `${LOCALE_COOKIE}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;

      document.documentElement.lang = nextLocale;

      // Na Home, todos os textos já são Client Components
      // ligados ao contexto. Não precisamos fazer nova
      // requisição ao servidor para atualizar o idioma.
      //
      // Nas outras páginas, mantemos o refresh porque
      // elas ainda usam getDictionary() no servidor.

      if (pathname !== "/") {
        router.refresh();
      }
    },
    [locale, pathname, router]
  );

  const value = useMemo(
    () => ({
      locale,
      dictionary: messages[locale],
      setLocale,
    }),
    [locale, setLocale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider."
    );
  }

  return context;
}

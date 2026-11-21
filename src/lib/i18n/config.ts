
export const DEFAULT_LOCALE = "en" as const;

export const LOCALE_COOKIE = "monster_locale";

export type Locale = "en" | "pt-BR";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "pt-BR";
}


import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
} from "./config";
import { messages } from "./messages";

export async function getLocale() {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  return isLocale(storedLocale)
    ? storedLocale
    : DEFAULT_LOCALE;
}

export async function getDictionary() {
  const locale = await getLocale();

  return {
    locale,
    dictionary: messages[locale],
  };
}

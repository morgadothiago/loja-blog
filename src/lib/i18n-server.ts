import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dictionaries, isLocale, type Locale, type MessageKey } from "@/lib/i18n";

// Equivalente server-side de useI18n(): lê o mesmo cookie que o layout raiz.
export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: (key: MessageKey) => dictionaries[locale][key] };
}

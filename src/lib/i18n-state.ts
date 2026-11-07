import { createContext, useContext, type ReactNode } from "react";
import { arabic } from "./arabic";

export type Locale = "en" | "ar";
export const LANGUAGE_KEY = "slams.language.v1";
export const LANGUAGE_EVENT = "slams-language";

export function translateText(source: string, locale: Locale): string {
  if (locale === "en") return source;
  const normalized = source.replace(/\s+/g, " ").trim();
  const translated = arabic[normalized];
  if (!translated) return source;
  return `${source.match(/^\s*/)?.[0] ?? ""}${translated}${source.match(/\s*$/)?.[0] ?? ""}`;
}

export const LanguageContext = createContext({
  locale: "en" as Locale,
  setLocale: (_locale: Locale) => {},
});

export function useLanguage() {
  const context = useContext(LanguageContext);
  return {
    ...context,
    dir: context.locale === "ar" ? ("rtl" as const) : ("ltr" as const),
    t: (source: string) => translateText(source, context.locale),
  };
}

/** Keeps mixed JSX text reactive without translating user-authored values. */
export function useTranslation() {
  const { t, locale } = useLanguage();
  return {
    t: (value: ReactNode): ReactNode => (typeof value === "string" ? t(value) : value),
    locale,
  };
}

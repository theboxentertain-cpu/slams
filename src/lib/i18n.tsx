import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { arabic } from "./arabic";

export type Locale = "en" | "ar";
export const LANGUAGE_KEY = "slams.language.v1";
const LANGUAGE_EVENT = "slams-language";

export function translateText(source: string, locale: Locale): string {
  if (locale === "en") return source;
  const normalized = source.replace(/\s+/g, " ").trim();
  const translated = arabic[normalized];
  if (!translated) return source;
  return `${source.match(/^\s*/)?.[0] ?? ""}${translated}${source.match(/\s*$/)?.[0] ?? ""}`;
}

const LanguageContext = createContext({
  locale: "en" as Locale,
  setLocale: (_locale: Locale) => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("en");
  useEffect(() => {
    const sync = () => {
      try {
        setLanguage(localStorage.getItem(LANGUAGE_KEY) === "ar" ? "ar" : "en");
      } catch { /* Keep English when storage is inaccessible. */ }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(LANGUAGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LANGUAGE_EVENT, sync);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  function setLocale(next: Locale) {
    setLanguage(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
      window.dispatchEvent(new Event(LANGUAGE_EVENT));
    } catch { /* Language switching remains available for this visit. */ }
  }
  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: (source: string) => translateText(source, context.locale) };
}

/** Keeps mixed JSX text reactive without translating user-authored values. */
export function useTranslation() {
  const { t, locale } = useLanguage();
  return {
    t: (value: ReactNode): ReactNode => typeof value === "string" ? t(value) : value,
    locale,
  };
}

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  return (
    <div className={`language-switch ${className}`} role="group" aria-label={locale === "ar" ? "لغة التطبيق" : "App language"} dir="ltr">
      <Button variant={locale === "en" ? "secondary" : "ghost"} size="sm" aria-pressed={locale === "en"} onClick={() => setLocale("en")} lang="en">English</Button>
      <Button variant={locale === "ar" ? "secondary" : "ghost"} size="sm" aria-pressed={locale === "ar"} onClick={() => setLocale("ar")} lang="ar">العربية</Button>
    </div>
  );
}
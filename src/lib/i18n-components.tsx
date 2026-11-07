import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@radix-ui/react-direction";
import {
  LANGUAGE_EVENT,
  LANGUAGE_KEY,
  LanguageContext,
  useLanguage,
  type Locale,
} from "./i18n-state";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("en");
  useEffect(() => {
    const sync = () => {
      try {
        setLanguage(localStorage.getItem(LANGUAGE_KEY) === "ar" ? "ar" : "en");
      } catch {
        /* Keep English when storage is inaccessible. */
      }
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
    } catch {
      /* Language switching remains available for this visit. */
    }
  }
  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <DirectionProvider dir={locale === "ar" ? "rtl" : "ltr"}>{children}</DirectionProvider>
    </LanguageContext.Provider>
  );
}

/** Translate a known, authored JSX label without adding a layout element.
 * Do not pass user-entered values, route identifiers or stored records.
 */
export function T({ children }: { children: string }) {
  const { t } = useLanguage();
  return <>{t(children)}</>;
}

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  return (
    <div
      className={`language-switch ${className}`}
      role="group"
      aria-label={locale === "ar" ? "لغة التطبيق" : "App language"}
      dir="ltr"
    >
      <Button
        variant={locale === "en" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        lang="en"
      >
        English
      </Button>
      <Button
        variant={locale === "ar" ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={locale === "ar"}
        onClick={() => setLocale("ar")}
        lang="ar"
      >
        العربية
      </Button>
    </div>
  );
}

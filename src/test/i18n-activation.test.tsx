import { afterEach, beforeEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  LanguageProvider,
  LanguageSwitch,
  LANGUAGE_KEY,
  translateText,
  useLanguage,
} from "@/lib/i18n";

function LanguageProbe() {
  const { locale, t } = useLanguage();
  return (
    <>
      <p data-testid="translated-progress">{t("Progress")}</p>
      <p data-testid="current-locale">{locale}</p>
      <LanguageSwitch />
    </>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
});

it("falls back to English for catalog gaps and never modifies the source text", () => {
  expect(translateText("Progress", "en")).toBe("Progress");
  expect(translateText("Progress", "ar")).toBe("التقدّم");
  expect(translateText("  Sign in  ", "ar")).toBe("  تسجيل الدخول  ");
  expect(translateText("User-written private reflection", "ar")).toBe(
    "User-written private reflection",
  );
});

it("switches and persists the locale without changing studio records or URL identifiers", () => {
  localStorage.setItem("slams.passport.v1", "private-note");
  render(
    <LanguageProvider>
      <LanguageProbe />
    </LanguageProvider>,
  );
  expect(screen.getByTestId("translated-progress")).toHaveTextContent("Progress");
  fireEvent.click(screen.getByRole("button", { name: "العربية" }));
  expect(screen.getByTestId("translated-progress")).toHaveTextContent("التقدّم");
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
  expect(localStorage.getItem(LANGUAGE_KEY)).toBe("ar");
  expect(localStorage.getItem("slams.passport.v1")).toBe("private-note");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByTestId("translated-progress")).toHaveTextContent("Progress");
  expect(document.documentElement).toHaveAttribute("dir", "ltr");
});

import { afterEach, beforeEach, expect, it } from "vitest";
import { SCENE } from "@/data/scene";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  LanguageProvider,
  LanguageSwitch,
  T,
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

it("renders translated authored text without adding markup or changing saved scene source", () => {
  const originalSetup = SCENE.setup;
  const scriptInArabic = translateText(originalSetup, "ar");
  expect(scriptInArabic).not.toBe(originalSetup);
  const { container } = render(
    <LanguageProvider>
      <p>
        <T>Start rehearsal</T>
      </p>
      <LanguageSwitch />
    </LanguageProvider>,
  );
  expect(container.querySelector("p")?.childElementCount).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "العربية" }));
  expect(container.querySelector("p")).toHaveTextContent("ابدأ");
  expect(SCENE.setup).toBe(originalSetup);
});

it("restores the saved Arabic locale and exposes the correct switch state", () => {
  localStorage.setItem(LANGUAGE_KEY, "ar");
  render(
    <LanguageProvider>
      <LanguageProbe />
    </LanguageProvider>,
  );
  expect(screen.getByTestId("current-locale")).toHaveTextContent("ar");
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
  expect(screen.getByRole("button", { name: "العربية" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false");
});

it("keeps user-authored records intact when toggling the interface twice", () => {
  const personalNote = "Keep my exact personal rehearsal text ملاحظاتي";
  const record = JSON.stringify({ reflection: personalNote, tactic: "To plead" });
  localStorage.setItem("slams.passport.v1", record);
  render(
    <LanguageProvider>
      <LanguageProbe />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "العربية" }));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(localStorage.getItem("slams.passport.v1")).toBe(record);
  expect(JSON.parse(localStorage.getItem("slams.passport.v1")!).reflection).toBe(personalNote);
});

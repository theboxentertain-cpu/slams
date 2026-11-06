import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StanislavskiWorkshopOne } from "@/components/foundation/StanislavskiWorkshopOne";
import { STAN_CHECKS, STAN_EDITORIAL_ROUNDS, STAN_EXERCISES } from "@/data/stanislavski-editorial-workshop-one";
import { LanguageProvider, LANGUAGE_KEY } from "@/lib/i18n";

vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: null, loading: false }),
}));
vi.mock("@/components/slams", () => ({
  DirectorNote: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
beforeEach(() => localStorage.clear());
afterEach(cleanup);

function openSetup() {
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  fireEvent.click(screen.getByRole("button", { name: "Check your understanding" }));
  for (let index = 0; index < STAN_CHECKS.length; index++) {
    const q = STAN_CHECKS[index]!;
    expect(screen.getByText(q.prompt.en)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: q.options[q.answer]!.en }));
    fireEvent.click(screen.getByRole("button", {
      name: index < STAN_CHECKS.length - 1 ? "Next question" : "Prepare practice",
    }));
  }
}

const PROMPTS = [
  "What facts or conditions apply in this attempt?",
  "What precisely are you trying to achieve?",
  "Which playable action did you actually attempt?",
  "What ordinary obstacle affected that action?",
  "What did you observe, not assume?",
  "What did you change in response?",
];

function logThreeRounds(exerciseIndex: number) {
  for (let n = 1; n <= STAN_EDITORIAL_ROUNDS; n++) {
    for (const [index, label] of PROMPTS.entries()) {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: `Different evidence ${index + 1} exercise ${exerciseIndex + 1} round ${n}` },
      });
    }
    const save = screen.getByRole("button", { name: "Log practice round" });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(save).toBeDisabled();
  }
  expect(screen.getByRole("status", { name: "" })).toBeDefined();
}

describe("Stanislavski live editorial workshop", () => {
  it("contains full teaching fields and blocks wrong knowledge choices", () => {
    render(<StanislavskiWorkshopOne />);
    expect(screen.getByRole("heading", { name: "Workshop 01 — Acting with a purpose" })).toBeInTheDocument();
    expect(screen.getByText("WHY")).toBeInTheDocument();
    expect(screen.getByText("HOW")).toBeInTheDocument();
    expect(screen.getByText("WHEN")).toBeInTheDocument();
    expect(screen.getByText("WHAT NOT TO DO")).toBeInTheDocument();
    expect(screen.getByText("COMMON PITFALLS")).toBeInTheDocument();
    expect(screen.getByText("PARTNER / GROUP APPLICATION")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
    fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
    fireEvent.click(screen.getByRole("button", { name: "Check your understanding" }));
    fireEvent.click(screen.getByRole("radio", { name: STAN_CHECKS[0]!.options[1]!.en }));
    expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: STAN_CHECKS[0]!.options[0]!.en }));
    expect(screen.getByRole("button", { name: "Next question" })).toBeEnabled();
  });

  it("gates all three solo exercises on original, distinct rounds without academic awards", () => {
    render(<StanislavskiWorkshopOne />);
    openSetup();
    fireEvent.click(screen.getByRole("button", { name: "Begin practice" }));
    for (let exercise = 0; exercise < STAN_EXERCISES.length; exercise++) {
      expect(screen.getByRole("heading", { name: STAN_EXERCISES[exercise]!.title.en })).toBeInTheDocument();
      const nextName = exercise < STAN_EXERCISES.length - 1 ? "Next exercise" : "Reflect on your attempts";
      expect(screen.getByRole("button", { name: nextName })).toBeDisabled();
      logThreeRounds(exercise);
      expect(screen.getByRole("button", { name: nextName })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: nextName }));
    }
    fireEvent.change(screen.getByLabelText("Which action changed because of an observable circumstance or obstacle?"), {
      target: { value: "I changed from insisting to explaining." },
    });
    fireEvent.change(screen.getByLabelText("What precise adjustment will you try next time?"), {
      target: { value: "Observe the real response before revising my action." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review private practice note" }));
    const note = screen.getByRole("region", { name: "Private practice note" });
    expect(note).toHaveTextContent("NO ASSESSED MASTERY / CERTIFICATION / TERM CREDIT");
    expect(note).toHaveTextContent("solo preparation");
    expect(note).toHaveTextContent("not saved to Passport, cloud or academic records");
    expect(screen.queryByRole("button", { name: /pass|graduate|mastery|unlock/i })).toBeNull();
  });

  it("requires both partner confirmations and does not confuse partner mode with solo credit", () => {
    render(<StanislavskiWorkshopOne />);
    openSetup();
    fireEvent.click(screen.getByRole("radio", { name: "With a human partner" }));
    const begin = screen.getByRole("button", { name: "Begin practice" });
    expect(begin).toBeDisabled();
    fireEvent.click(screen.getByLabelText("My partner freely agreed to take part."));
    expect(begin).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Either of us may stop; no audio or video recording without agreement."));
    expect(begin).toBeEnabled();
    fireEvent.click(begin);
    expect(screen.getByText(/PARTNER · SELF-REPORTED/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next exercise" })).toBeDisabled();
  });

  it("honors a saved Arabic preference on the original lesson and header", () => {
    localStorage.setItem(LANGUAGE_KEY, "ar");
    render(<LanguageProvider><StanislavskiWorkshopOne /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "الورشة الأولى — التمثيل بهدف واضح" })).toBeInTheDocument();
    expect(screen.getByText("لماذا؟")).toBeInTheDocument();
    expect(screen.getByText("تطبيق فردي")).toBeInTheDocument();
  });
});

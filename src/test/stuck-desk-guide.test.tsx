import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_INTERVENTIONS } from "@/data/stuck";
import { formatStuckSession, STUCK_GUIDES } from "@/data/stuck-guides";
import { LanguageProvider } from "@/lib/i18n";
import { StuckDeskGuide } from "@/components/foundation/StuckDeskGuide";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/components/slams", () => ({ btnSecondary: "secondary" }));

beforeEach(() => {
  localStorage.removeItem("slams.language.v1");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
afterEach(cleanup);

describe("Stuck Desk self-guided practice", () => {
  it("preserves the four original unreviewed symptoms, technique labels and working rehearsal link", () => {
    render(<StuckDeskGuide />);
    for (const item of DRAFT_INTERVENTIONS) {
      expect(screen.getByRole("button", { name: item.q })).toBeInTheDocument();
      expect(STUCK_GUIDES[item.id as keyof typeof STUCK_GUIDES]).toBeDefined();
    }
    fireEvent.click(screen.getByRole("button", { name: DRAFT_INTERVENTIONS[0]!.q }));
    expect(screen.getByText(DRAFT_INTERVENTIONS[0]!.fix)).toBeInTheDocument();
    expect(screen.getByText("Why this might help")).toBeInTheDocument();
    expect(screen.getByText("What not to do")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Practice in the scripted demonstration" })).toHaveAttribute("href", "/scene");
    expect(screen.getByText(/no academic credit/i)).toBeInTheDocument();
  });

  it("does not invent a comparison, score or progress before separate observations exist", () => {
    render(<StuckDeskGuide />);
    fireEvent.click(screen.getByRole("button", { name: DRAFT_INTERVENTIONS[1]!.q }));
    expect(screen.queryByRole("button", { name: "Copy my practice note" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Before: what did you actually do?"), {
      target: { value: "I shouted the request" },
    });
    expect(screen.queryByRole("button", { name: "Copy my practice note" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("After the experiment: what did you do differently?"), {
      target: { value: "I shouted the request" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("identical");
    expect(screen.queryByRole("button", { name: "Copy my practice note" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("After the experiment: what did you do differently?"), {
      target: { value: "I asked quietly and waited" },
    });
    expect(screen.getByRole("button", { name: "Copy my practice note" })).toBeInTheDocument();
    expect(screen.getByText(/No result is inferred/)).toBeInTheDocument();
    expect(screen.queryByText(/mastered|passed|improved by/i)).not.toBeInTheDocument();
  });

  it("copies only by explicit user action and never persists practice observations", async () => {
    const writeText = vi.mocked(navigator.clipboard.writeText);
    render(<StuckDeskGuide />);
    fireEvent.click(screen.getByRole("button", { name: DRAFT_INTERVENTIONS[0]!.q }));
    fireEvent.change(screen.getByLabelText("Before: what did you actually do?"), {
      target: { value: "I anticipated my next line" },
    });
    fireEvent.change(screen.getByLabelText("After the experiment: what did you do differently?"), {
      target: { value: "I waited for the reply" },
    });
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Copy my practice note" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("I waited for the reply");
    expect(screen.getByRole("status")).toHaveTextContent("Nothing was saved");
    expect(localStorage.getItem("slams.stuck")).toBeNull();
  });

  it("clears unsaved text on changing problems instead of mixing different practice notes", () => {
    render(<StuckDeskGuide />);
    fireEvent.click(screen.getByRole("button", { name: DRAFT_INTERVENTIONS[0]!.q }));
    fireEvent.change(screen.getByLabelText("Before: what did you actually do?"), {
      target: { value: "Old symptom note" },
    });
    fireEvent.click(screen.getByRole("button", { name: DRAFT_INTERVENTIONS[2]!.q }));
    expect(screen.getByLabelText("Before: what did you actually do?")).toHaveValue("");
    expect(screen.getByLabelText("After the experiment: what did you do differently?")).toHaveValue("");
    expect(screen.queryByText("Old symptom note")).not.toBeInTheDocument();
  });

  it("supplies Arabic prompts and copies an Arabic self-report without changing user text", async () => {
    localStorage.setItem("slams.language.v1", "ar");
    render(<LanguageProvider><StuckDeskGuide /></LanguageProvider>);
    const arabic = STUCK_GUIDES.stiff.arQuestion;
    const button = await screen.findByRole("button", { name: arabic });
    fireEvent.click(button);
    fireEvent.change(screen.getByLabelText("قبل التجربة: عملت إيه فعلاً؟"), {
      target: { value: "كنت متردد" },
    });
    fireEvent.change(screen.getByLabelText("بعد التجربة: عملت إيه بشكل مختلف؟"), {
      target: { value: "حركت إيدي براحة" },
    });
    fireEvent.click(screen.getByRole("button", { name: "انسخ ملاحظات التدريب" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    const note = vi.mocked(navigator.clipboard.writeText).mock.calls[0]?.[0];
    expect(note).toContain("قبل التجربة");
    expect(note).toContain("حركت إيدي براحة");
  });
});

describe("Self-report format boundary", () => {
  it("preserves exactly the learner's notes with an explicit non-assessment disclosure", () => {
    const text = formatStuckSession("Problem", "Stanislavski", "  before  ", "  after  ");
    expect(text).toContain("Before: before");
    expect(text).toContain("After experiment: after");
    expect(text).toContain("No performance was recorded");
    expect(text).not.toContain("score");
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MeisnerWorkshopOne } from "@/components/foundation/MeisnerWorkshopOne";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: null, loading: false }),
}));
vi.mock("@/components/slams", () => ({
  DirectorNote: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
afterEach(cleanup);

function reachPracticeChoice() {
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  fireEvent.click(screen.getByRole("button", { name: "Try knowledge questions" }));
  for (const [choice, next] of [
    ["Observation", "Next example"],
    ["Interpretation", "Next example"],
    ["My experience", "Next example"],
    ["Interpretation", "Choose practice mode"],
  ] as const) {
    fireEvent.click(screen.getByRole("button", { name: choice }));
    fireEvent.click(screen.getByRole("button", { name: next }));
  }
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function completeRounds(fields: [string, string][]) {
  for (let n = 1; n <= 3; n++) {
    for (const [label, value] of fields) fill(label, value + " / round " + n);
    fireEvent.click(screen.getByRole("button", { name: "Record this practice round" }));
  }
}

describe("Meisner Workshop 1 guided editorial preview", () => {
  it("walks through three authored lessons and accurate knowledge distinctions", () => {
    render(<MeisnerWorkshopOne />);
    expect(
      screen.getByRole("heading", { name: "Workshop 1 — Attention on the other person" }),
    ).toBeInTheDocument();
    reachPracticeChoice();
    expect(screen.getByRole("heading", { name: "Who can practise with you?" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark complete|certify|award mastery/i }),
    ).not.toBeInTheDocument();
  });
  it("allows solo preparation but never offers exercise two or progress credit", () => {
    render(<MeisnerWorkshopOne />);
    reachPracticeChoice();
    fireEvent.click(screen.getByRole("button", { name: "Begin practice" }));
    expect(screen.getByRole("button", { name: "Reflect on this attempt" })).toBeDisabled();
    completeRounds([
      ["What observable event did you notice?", "The chair moved."],
      ["What explanation or assumption occurred to you?", "Someone was impatient."],
      ["How can you express this more accurately?", "The chair moved to the left."],
    ]);
    expect(screen.getByRole("button", { name: "Reflect on this attempt" })).toBeEnabled();
    expect(screen.getByText("Practice round 3 of 3 recorded")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exercise 02 — Receive" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reflect on this attempt" }));
    fill("What did you notice about your assumptions?", "I guessed the motive.");
    fill("What specific change will you try next?", "Return to the observable action.");
    fireEvent.click(screen.getByRole("button", { name: "Review private practice note" }));
    const note = screen.getByRole("region", { name: "Private practice note" });
    expect(note).toHaveTextContent("NO MASTERY OR TERM CREDIT");
    expect(note).toHaveTextContent("solo preparation (not partner training)");
    expect(note).toHaveTextContent("no Passport/cloud save");
  });
  it("requires two consent confirmations before partner practice, then offers both exercises", () => {
    render(<MeisnerWorkshopOne />);
    reachPracticeChoice();
    fireEvent.click(screen.getByLabelText("With a real human partner"));
    const begin = screen.getByRole("button", { name: "Begin practice" });
    expect(begin).toBeDisabled();
    fireEvent.click(screen.getByLabelText("My partner voluntarily agreed."));
    expect(begin).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/We can both pause or stop/));
    expect(begin).toBeEnabled();
    fireEvent.click(begin);
    fill("What observable event did you notice?", "The partner looked away.");
    fill("What explanation or assumption occurred to you?", "They wanted to leave.");
    fill("How can you express this more accurately?", "They looked toward the door.");
    fill("How did your partner reply, confirm or correct you?", "They corrected the wording.");
    fireEvent.click(screen.getByRole("button", { name: "Exercise 02 — Receive" }));
    expect(screen.getByRole("heading", { name: "Notice → Offer → Receive" })).toBeInTheDocument();
    fill("What reply did you originally predict?", "Yes.");
    fill("What did your partner actually say or do?", "I heard a noise.");
    fill("How did your next response change?", "I responded to the noise comment.");
    fireEvent.click(screen.getByRole("button", { name: "Reflect on this attempt" }));
    fill("What surprised you in the actual exchange?", "The reply was different.");
    fill("What specific change will you try next?", "Wait until the reply ends.");
    fireEvent.click(screen.getByRole("button", { name: "Review private practice note" }));
    expect(screen.getByRole("region", { name: "Private practice note" })).toHaveTextContent(
      "partner practice (self-reported only)",
    );
  });
});

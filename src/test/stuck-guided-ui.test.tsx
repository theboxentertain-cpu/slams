import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StuckDeskGuided } from "@/components/foundation/StuckDeskGuided";
import { LanguageProvider, LANGUAGE_KEY } from "@/lib/i18n";

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loaded: true,
  error: null as string | null,
  save: vi.fn<(...args: unknown[]) => Promise<{ error?: string }>>(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: state.user, loading: false }),
}));
vi.mock("@/lib/store", () => ({
  usePassport: () => ({
    loaded: state.loaded,
    error: state.error,
    signedIn: Boolean(state.user),
    add: state.save,
  }),
}));
vi.mock("@/components/slams", () => ({
  DirectorNote: ({ children }: { children: ReactNode }) => <aside>{children}</aside>,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));

beforeEach(() => {
  state.user = null;
  state.loaded = true;
  state.error = null;
  state.save.mockReset().mockResolvedValue({});
  localStorage.clear();
  vi.stubGlobal("crypto", { randomUUID: () => "11111111-2222-4333-8444-555555555555" });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function startFirst() {
  fireEvent.click(screen.getByRole("button", { name: /I'm in my head/ }));
  expect(
    screen.getByRole("heading", { name: "02 — Observe your first attempt" }),
  ).toBeInTheDocument();
}
function reachRetake() {
  startFirst();
  const next = screen.getByRole("button", { name: "Choose the adjustment" });
  expect(next).toBeDisabled();
  fireEvent.change(screen.getByLabelText("What did you actually say or do on the first attempt?"), {
    target: { value: "I planned my reply and missed the other line." },
  });
  expect(next).toBeEnabled();
  fireEvent.click(next);
  expect(screen.getByText("WHY IT MAY HELP")).toBeInTheDocument();
  expect(screen.getByText("SOLO APPLICATION")).toBeInTheDocument();
  expect(screen.getByText("WITH A CONSENTING PARTNER")).toBeInTheDocument();
  expect(screen.getByText("DON’T")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Attempt the retake" }));
}
function reachReview() {
  reachRetake();
  const review = screen.getByRole("button", { name: "Review private comparison" });
  expect(review).toBeDisabled();
  fireEvent.change(screen.getByLabelText("What did you actually say or do after the adjustment?"), {
    target: { value: "I waited, noticed the pause and responded to it." },
  });
  expect(review).toBeDisabled();
  fireEvent.change(screen.getByLabelText("What specific difference, if any, did you notice?"), {
    target: { value: "I stopped preparing the next line before the reply." },
  });
  expect(review).toBeEnabled();
  fireEvent.click(screen.getByRole("radio", { name: "I could not identify a difference" }));
  fireEvent.click(review);
}

describe("Stuck Desk guided actor workflow", () => {
  it("does not call text input an AI diagnosis and provides four actionable choices", () => {
    render(<StuckDeskGuided />);
    expect(screen.getByText(/does not watch, diagnose, or grade your acting/)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(screen.getByRole("button", { name: /My scene feels flat/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nothing feels at stake/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My body feels stiff/ })).toBeInTheDocument();
  });
  it("gates the first attempt and the retake on real written observations", () => {
    render(<StuckDeskGuided />);
    reachReview();
    const region = screen.getByRole("region", { name: "Guided Stuck Desk workflow" });
    expect(region).toHaveTextContent("Before");
    expect(region).toHaveTextContent("After");
    expect(region).toHaveTextContent("I could not identify a difference");
    expect(region).toHaveTextContent(
      "No automatic performance analysis, diagnosis, grade or credit",
    );
    expect(screen.getByRole("link", { name: "Practice the Living Scene" })).toHaveAttribute(
      "href",
      "/scene",
    );
    expect(state.save).not.toHaveBeenCalled();
  });
  it("requires an explicit Passport save, using only user-entered evidence", async () => {
    render(<StuckDeskGuided />);
    reachReview();
    const save = screen.getByRole("button", { name: "Save to Actor’s Passport" });
    expect(state.save).not.toHaveBeenCalled();
    fireEvent.click(save);
    await waitFor(() => expect(state.save).toHaveBeenCalledTimes(1));
    expect(state.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "11111111-2222-4333-8444-555555555555",
        obstacle: "I'm in my head / planning lines",
        exerciseNote: "I planned my reply and missed the other line.",
        retakeLine: "I waited, noticed the pause and responded to it.",
      }),
    );
    expect(await screen.findByRole("button", { name: "Saved to Passport" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Open your saved Passport record" })).toHaveAttribute(
      "href",
      "/passport",
    );
  });
  it("does not falsely report a failed save as successful and keeps copy available", async () => {
    state.save.mockResolvedValue({ error: "Unavailable" });
    render(<StuckDeskGuided />);
    reachReview();
    fireEvent.click(screen.getByRole("button", { name: "Save to Actor’s Passport" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Save was not confirmed");
    expect(screen.getByRole("button", { name: "Save to Actor’s Passport" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Copy note (no save)" })).toBeEnabled();
  });
  it("blocks saving when Passport cannot verify account availability", () => {
    state.loaded = false;
    render(<StuckDeskGuided />);
    reachReview();
    expect(screen.getByRole("button", { name: "Save to Actor’s Passport" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Checking Passport availability");
  });
  it("clears unsaved notes when the account identity changes", () => {
    state.user = { id: "actor-a" };
    const result = render(<StuckDeskGuided />);
    startFirst();
    fireEvent.change(
      screen.getByLabelText("What did you actually say or do on the first attempt?"),
      {
        target: { value: "Private rehearsal note for actor A" },
      },
    );
    state.user = { id: "actor-b" };
    result.rerender(<StuckDeskGuided />);
    expect(
      screen.getByRole("heading", { name: "01 — What actually got stuck?" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Private rehearsal note for actor A")).toBeNull();
  });
  it("renders the new guided workflow in Arabic from stored language settings", () => {
    localStorage.setItem(LANGUAGE_KEY, "ar");
    render(
      <LanguageProvider>
        <StuckDeskGuided />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "٠١ — ما المشكلة التي واجهتك؟" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /جسمي متصلّب/ })).toBeInTheDocument();
    expect(screen.getByText(/لا يشاهد أداءك ولا يشخّصه/)).toBeInTheDocument();
  });
});

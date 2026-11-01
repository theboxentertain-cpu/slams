import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressPage } from "@/components/foundation/ProgressPage";
const state = vi.hoisted(() => ({
  entries: [] as { id: string }[],
  loaded: true,
  error: null as string | null,
  signedIn: false,
  records: null as
    { status: string; unit_id: string; unit_kind: "lesson"; updated_at: string }[] | null,
}));
vi.mock("@/lib/store", () => ({ usePassport: () => state }));
vi.mock("@/lib/training", () => ({
  useTrainingProgress: () => ({
    records: state.records,
    loading: false,
    error: null,
    signedIn: state.signedIn,
  }),
  useCatalog: () => ({ units: [], isError: true }),
  schoolHasProgress: () => false,
}));
vi.mock("@/components/foundation/TrainingSummary", () => ({
  TrainingSummary: () => <p>Verified training summary</p>,
}));
vi.mock("@/components/slams", () => ({
  Page: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
beforeEach(() => {
  state.entries = [];
  state.loaded = true;
  state.error = null;
  state.signedIn = false;
  state.records = null;
});
afterEach(cleanup);
describe("Routed progress summary", () => {
  it("shows a real local zero and unknown cloud count without invented percentages", () => {
    render(<ProgressPage tab="by-school" onTabChange={() => {}} />);
    expect(screen.getByText("0", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("—", { exact: true })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d+%/);
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
  it("shows confirmed counts without inventing school completion", () => {
    state.signedIn = true;
    state.entries = [{ id: "a" }, { id: "b" }];
    state.records = [
      { status: "completed", unit_id: "x", unit_kind: "lesson", updated_at: "2026-01-01" },
    ];
    render(<ProgressPage tab="by-school" onTabChange={() => {}} />);
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("1", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Whole-school completion/)).toBeInTheDocument();
  });
  it("keeps failed Passport records unknown and offers the real retry destination", () => {
    state.entries = [{ id: "stale" }];
    state.error = "Denied";
    render(<ProgressPage tab="by-school" onTabChange={() => {}} />);
    expect(screen.getAllByText("—", { exact: true })).toHaveLength(2);
    expect(screen.getByText(/Rehearsal records could not be loaded/)).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByRole("link", { name: "Open Passport to retry." })).toHaveAttribute(
      "href",
      "/passport",
    );
  });
});

import type { AnchorHTMLAttributes } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TrainingSummary } from "@/components/foundation/TrainingSummary";
import type { ProgressRecord, TrainingUnit } from "@/lib/training";
const state = vi.hoisted(() => ({
  units: [] as TrainingUnit[],
  records: [] as ProgressRecord[],
  signedIn: false,
  loading: false,
  error: null as string | null,
  catalogError: false,
}));
vi.mock("@/lib/curriculum.functions", () => ({ getCurriculum: vi.fn() }));
vi.mock("@/lib/training", async (original) => ({
  ...(await original<typeof import("@/lib/training")>()),
  useCatalog: () => ({ units: state.units, isError: state.catalogError }),
  useTrainingProgress: () => ({
    records: state.records,
    signedIn: state.signedIn,
    loading: state.loading,
    error: state.error,
  }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; params?: Record<string, string> }) => (
    <a
      href={Object.entries(params ?? {}).reduce(
        (url, [key, value]) => url.replace(`$${key}`, value),
        to,
      )}
      {...props}
    />
  ),
}));
const unit: TrainingUnit = {
  id: "fixture-only",
  title: "Unit fixture — not curriculum",
  content: "Test only",
  reviewed: true,
  status: "published",
  kind: "lesson",
  school: "meisner",
  year: 1,
  term: 1,
  available: true,
  ancestors: [],
};
const started: ProgressRecord = {
  unit_kind: "lesson",
  unit_id: unit.id,
  status: "started",
  updated_at: "2026-01-01T00:00:00Z",
};
beforeEach(() => {
  state.units = [];
  state.records = [];
  state.signedIn = false;
  state.loading = false;
  state.error = null;
  state.catalogError = false;
});
afterEach(cleanup);
it("gives guests a working first rehearsal without fabricated progress or a curriculum resume", () => {
  render(<TrainingSummary variant="office" />);
  expect(screen.getByRole("link", { name: "Start rehearsal — The Living Scene" })).toHaveAttribute(
    "href",
    "/scene",
  );
  expect(document.body.textContent).not.toMatch(/\d+%/);
  expect(screen.queryByText(/Continue training/)).not.toBeInTheDocument();
});
it("offers rehearsal for a signed-in actor with no verified started work", () => {
  state.signedIn = true;
  render(<TrainingSummary variant="office" />);
  expect(screen.getByRole("link", { name: /Start rehearsal/ })).toHaveAttribute("href", "/scene");
});
it("resumes only an actual eligible saved started unit", () => {
  state.signedIn = true;
  state.units = [unit];
  state.records = [started];
  render(<TrainingSummary variant="office" />);
  expect(screen.getByRole("link", { name: `Continue training: ${unit.title}` })).toHaveAttribute(
    "href",
    "/conservatory/meisner/units/lesson/fixture-only",
  );
  expect(screen.queryByRole("link", { name: /Start rehearsal/ })).not.toBeInTheDocument();
});
it.each(["unavailable", "completed", "missing"])(
  "does not present %s work as resumable",
  (reason) => {
    state.signedIn = true;
    state.units = reason === "missing" ? [] : [{ ...unit, available: reason !== "unavailable" }];
    state.records = [{ ...started, status: reason === "completed" ? "completed" : "started" }];
    render(<TrainingSummary variant="office" />);
    expect(screen.queryByText(/Continue training/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start rehearsal/ })).toHaveAttribute("href", "/scene");
  },
);
it("does not invent a current lesson while identity/progress is loading", () => {
  state.loading = true;
  render(<TrainingSummary variant="office" />);
  expect(screen.getByRole("status")).toHaveTextContent("Checking your account training");
  expect(screen.queryByText(/Continue training/)).not.toBeInTheDocument();
});
it("keeps a real practice action available while disclosing an account curriculum failure", () => {
  state.signedIn = true;
  state.catalogError = true;
  render(<TrainingSummary variant="office" />);
  expect(screen.getByText(/Curriculum status is unavailable/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Start rehearsal/ })).toHaveAttribute("href", "/scene");
});

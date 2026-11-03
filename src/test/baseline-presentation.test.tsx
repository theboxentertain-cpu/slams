import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ActorSetup } from "@/lib/actor-setup";
import { BaselineContent } from "@/components/foundation/BaselinePage";

const state = vi.hoisted(() => ({
  ready: true,
  error: null as string | null,
  data: { version: 1, experience: null, goals: [], language: "en" } as ActorSetup,
  enterStudio: vi.fn(),
}));
vi.mock("@/lib/actor-setup", () => ({ useActorSetup: () => state }));
vi.mock("@/lib/studio-entry", () => ({ enterStudio: state.enterStudio }));
vi.mock("@/components/slams", () => ({
  Page: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    />
  ),
}));
beforeEach(() => {
  state.ready = true;
  state.error = null;
  state.data = { version: 1, experience: null, goals: [], language: "en" };
  state.enterStudio.mockReset();
});
afterEach(cleanup);

it("keeps the optional working next action without inventing a diagnostic result", () => {
  render(<BaselineContent />);
  expect(screen.getByText("No self-description saved.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Skip to a first rehearsal" })).toHaveAttribute(
    "href",
    "/scene",
  );
  expect(screen.getByText(/Guided baseline tasks are in development/)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\d+%|The verdict|Primary path/i);
});
it("shows only the actor's actual saved self-description and chosen goals", () => {
  state.data.experience = "Working actor";
  state.data.goals = ["Prepare for auditions", "Work on specific scenes"];
  render(<BaselineContent />);
  expect(screen.getByText("Working actor", { exact: true })).toBeInTheDocument();
  for (const goal of state.data.goals)
    expect(screen.getByText(goal, { exact: true })).toBeInTheDocument();
  expect(
    screen.getByText(/saved preferences, not a diagnosis or a training score/),
  ).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\d+%/);
});
it("does not show a previous self-description while its owner is loading", () => {
  state.ready = false;
  state.data.experience = "Working actor";
  state.data.goals = ["Prepare for auditions"];
  render(<BaselineContent />);
  expect(screen.getByRole("status")).toHaveTextContent("Checking your saved starting point");
  expect(screen.queryByText("Working actor", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText("Prepare for auditions", { exact: true })).not.toBeInTheDocument();
});
it("discloses a failed saved-profile read without presenting values as verified", () => {
  state.error = "Saved setup could not be read.";
  state.data.experience = "Working actor";
  render(<BaselineContent />);
  expect(screen.getByRole("alert")).toHaveTextContent(state.error);
  expect(screen.queryByText("Working actor", { exact: true })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Skip to a first rehearsal" })).toHaveAttribute(
    "href",
    "/scene",
  );
});
it("retains real welcome entry links and their remembered-studio callback", () => {
  render(<BaselineContent welcome />);
  expect(
    screen.getByText(/Guided baseline assessments are still in development/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Start a first rehearsal" }));
  fireEvent.click(screen.getByRole("link", { name: "Skip to the Office" }));
  expect(state.enterStudio).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("link", { name: /^Explore the schools/ })).toHaveAttribute(
    "href",
    "/conservatory",
  );
  expect(screen.getByRole("link", { name: /^Prepare an audition/ })).toHaveAttribute(
    "href",
    "/work",
  );
});

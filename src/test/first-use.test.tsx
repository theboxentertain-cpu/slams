import type { AnchorHTMLAttributes } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WelcomeLanding, WelcomeAccount, ActorSetupPage } from "@/components/welcome/WelcomePages";
import { OFFICE_PREFERENCES } from "@/lib/office-preferences";
const session = vi.hoisted(() => ({ user: null as null | { id: string }, loading: false }));
vi.mock("@/lib/session", () => ({ useSession: () => session }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search: _search,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; search?: unknown }) => (
    <a href={to} {...props} />
  ),
}));
vi.mock("@/components/office/SchoolBooks", () => ({
  BookCover: () => null,
  SchoolBooks: () => null,
}));
beforeEach(() => {
  localStorage.clear();
  session.user = null;
  session.loading = false;
});
afterEach(cleanup);
it("offers rehearsal directly before optional exploration without a profile or account form", () => {
  render(<WelcomeLanding />);
  const enter = screen.getByRole("link", { name: "Enter the Studio" });
  expect(enter).toHaveAttribute("href", "/scene");
  expect(
    enter.compareDocumentPosition(screen.getByText("Explore more of the studio")) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByText(/Step \d of 5/)).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByText("Explore more of the studio").closest("details")).not.toHaveAttribute(
    "open",
  );
});
it.each(["guest", "loading", "signed-in"])(
  "keeps the optional account page rehearsal available for %s visitors",
  (state) => {
    session.loading = state === "loading";
    session.user = state === "signed-in" ? { id: "actor" } : null;
    render(<WelcomeAccount />);
    expect(screen.getByRole("link", { name: "Start a first rehearsal" })).toHaveAttribute(
      "href",
      "/scene",
    );
  },
);
it("changes real studio controls without replacing saved personal preferences or training records", () => {
  const legacy = JSON.stringify({
    version: 1,
    experience: "Working actor",
    goals: ["Prepare for auditions"],
    language: "en",
  });
  localStorage.setItem("slams.actor-setup.v1.guest", legacy);
  localStorage.setItem("slams.passport.v1", "[existing-record]");
  render(<ActorSetupPage />);
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screen.queryByText("Your goals")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: "Reduce motion" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Office sounds" }));
  expect(JSON.parse(localStorage.getItem(OFFICE_PREFERENCES)!)).toEqual({
    motion: false,
    sound: true,
  });
  expect(localStorage.getItem("slams.actor-setup.v1.guest")).toBe(legacy);
  expect(localStorage.getItem("slams.passport.v1")).toBe("[existing-record]");
  expect(screen.getByRole("link", { name: "Start a first rehearsal" })).toHaveAttribute(
    "href",
    "/scene",
  );
});

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SupportPage } from "@/components/foundation/SupportPage";
import { WorkHub, StuckIntake } from "@/components/foundation/WorkspacePages";
import { SUPPORT_PAGES, validateTab, primarySection, type SupportPageId } from "@/lib/foundation";
import { Route as HelpRoute } from "@/routes/help";
import { SettingsPage } from "@/components/foundation/SettingsPage";
import { DRAFT_INTERVENTIONS } from "@/data/stuck";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({
    to,
    children,
    search: _search,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; search?: unknown }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/slams", () => ({
  Page: ({ title, children }: { title: string; children: ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
  DirectorToggle: () => null,
  AccountLink: () => null,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
vi.mock("@/lib/session", () => ({ useSession: () => ({ user: null, loading: false }) }));
vi.mock("@/lib/store", () => ({
  useAuditionPrep: () => ({
    data: { role: "Existing saved preparation" },
    loaded: true,
    error: null,
  }),
  usePassport: () => ({ entries: [], loaded: true, error: null, signedIn: false }),
}));
afterEach(cleanup);

describe("Unavailable destinations", () => {
  it("keeps supporting tools attached to their actual primary navigation owner", () => {
    expect(primarySection("/matrix")).toBe("/conservatory");
    expect(primarySection("/lab")).toBe("/rehearsal");
    expect(primarySection("/work/character")).toBe("/work");
    expect(primarySection("/passport")).toBeNull();
  });
  it.each(Object.keys(SUPPORT_PAGES) as SupportPageId[])(
    "keeps %s honest and supplies one working next step",
    (id) => {
      render(<SupportPage id={id} />);
      const expected = SUPPORT_PAGES[id];
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(expected.title);
      expect(screen.getByRole("heading", { name: "In development" })).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).toBeNull();
      expect(screen.queryByRole("tab")).toBeNull();
      expect(screen.getAllByRole("link")).toHaveLength(1);
      expect(screen.getByRole("link", { name: expected.label })).toHaveAttribute(
        "href",
        expected.action,
      );
      expect(screen.getByText(expected.message)).toBeInTheDocument();
    },
  );
  it("still parses bookmarked support tabs without promoting unavailable recording tools", () => {
    expect(validateTab("lab", { tab: "compare" })).toEqual({ tab: "compare" });
    expect(validateTab("character", { tab: "notes" })).toEqual({ tab: "notes" });
    expect(validateTab("selfTape", { tab: "export" })).toEqual({ tab: "export" });
  });
});

describe("Available work comes first", () => {
  it("preserves saved audition context and places planned tools in an explicit disclosure", () => {
    render(<WorkHub tab="auditions" onTabChange={vi.fn()} />);
    expect(screen.getByText("Existing saved preparation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open audition preparation" })).toHaveAttribute(
      "href",
      "/work/audition",
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    const disclosure = screen.getByText("Tools in development").closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    expect(within(disclosure!).getAllByRole("link", { hidden: true })).toHaveLength(4);
  });
  it.each(["projects", "characters", "self-tapes"])(
    "gives an old %s bookmark a useful route back",
    (tab) => {
      const change = vi.fn();
      render(<WorkHub tab={tab} onTabChange={change} />);
      expect(screen.getByRole("heading", { name: "In development" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Back to audition preparation" }));
      expect(change).toHaveBeenCalledWith("auditions");
    },
  );
  it("keeps the four original quick intervention prompts behind a disclosure, without replacing the working guided flow", () => {
    render(<StuckIntake tab="describe" onTabChange={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "01 — What actually got stuck?" }),
    ).toBeInTheDocument();
    const disclosure = screen
      .getByText("Browse original quick intervention prompts")
      .closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    for (const item of DRAFT_INTERVENTIONS)
      expect(within(disclosure!).getByText(item.q).closest("button")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("link", { name: "Try the Living Scene instead" })).toHaveAttribute(
      "href",
      "/scene",
    );
  });
  it.each(["scene", "identify"])(
    "lands old Stuck Desk %s bookmarks on the same truthful guided actor workflow",
    (tab) => {
      render(<StuckIntake tab={tab} onTabChange={vi.fn()} />);
      expect(
        screen.getByRole("heading", { name: "01 — What actually got stuck?" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Older Stuck Desk links now open the guided/)).toBeInTheDocument();
      expect(
        within(screen.getByRole("region", { name: "Guided Stuck Desk workflow" })).getByRole(
          "button",
          { name: /My scene feels flat/ },
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Try the Living Scene instead" })).toHaveAttribute(
        "href",
        "/scene",
      );
    },
  );
});

describe("Blueprint task navigation", () => {
  it("provides four canonical task entrances in Help without promoting unavailable services", () => {
    const Component = (HelpRoute as unknown as { component: React.ComponentType }).component;
    render(<Component />);
    const tasks = within(screen.getByRole("navigation", { name: "Choose your studio task" }));
    for (const [name, path] of [
      ["Train", "/conservatory"],
      ["Rehearse", "/rehearsal"],
      ["Work", "/work"],
      ["Get Unstuck", "/stuck"],
    ] as const)
      expect(tasks.getByRole("link", { name })).toHaveAttribute("href", path);
  });
  it.each(["account", "privacy", "language", "accessibility"])(
    "keeps Help reachable from the %s settings tab",
    (tab) => {
      render(<SettingsPage tab={tab} onTabChange={vi.fn()} />);
      expect(screen.getByRole("link", { name: "Help & Studio Guide" })).toHaveAttribute(
        "href",
        "/help",
      );
    },
  );
});

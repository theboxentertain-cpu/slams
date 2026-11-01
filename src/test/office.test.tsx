import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import { DirectorsOffice } from "@/components/office/DirectorsOffice";
import { BOOK_DESIGNS } from "@/components/office/office-data";

const state = vi.hoisted(() => ({
  mode: "on",
  entries: [] as { id: string }[],
  error: null as string | null,
  loaded: true,
  milestones: null as number | null,
  signedIn: false,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; params?: { school: string } }) => (
    <a href={params ? to.replace("$school", params.school) : to} {...props} />
  ),
}));
vi.mock("@/lib/store", () => ({
  useDirectorMode: () => [state.mode, vi.fn()],
  usePassport: () => ({
    entries: state.entries,
    loaded: state.loaded,
    error: state.error,
    signedIn: state.signedIn,
  }),
}));
vi.mock("@/components/office/useOfficeMilestones", () => ({
  useOfficeMilestones: () => state.milestones,
}));
vi.mock("@/components/slams", () => ({
  AccountLink: () => <a href="/auth">Sign in</a>,
  DemoBanner: () => <p>Local-only</p>,
  DirectorToggle: () => <span>Director mode</span>,
  Wordmark: () => <span>SLAMS</span>,
}));

vi.mock("@/components/foundation/AppShell", () => ({
  ProfileMenu: () => <button aria-label="Open profile menu">Profile</button>,
}));
vi.mock("@/components/foundation/TrainingSummary", () => ({
  TrainingSummary: () => <section aria-label="Current training">Training summary</section>,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  state.mode = "on";
  state.entries = [];
  state.error = null;
  state.loaded = true;
  state.milestones = null;
  state.signedIn = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("The interactive office", () => {
  it("routes progress to its real destination and marks only an actual error", () => {
    const { container } = render(<DirectorsOffice />);
    expect(screen.getByRole("link", { name: "Progress and save status" })).toHaveAttribute(
      "href",
      "/progress",
    );
    expect(container.querySelector(".save-attention")).toBeNull();
  });
  it("exposes a real save error through the progress link", () => {
    state.error = "Denied";
    const { container } = render(<DirectorsOffice />);
    expect(
      screen.getByRole("link", { name: "Progress and save status — records unavailable" }),
    ).toHaveAttribute("href", "/progress");
    expect(container.querySelector(".save-attention")).toBeInTheDocument();
  });
  it("offers exactly three equally ranked worlds and no second primary bar", () => {
    render(<DirectorsOffice />);
    const worlds = within(screen.getByRole("navigation", { name: "The three SLAMS worlds" }));
    expect(worlds.getAllByRole("link")).toHaveLength(3);
    expect(worlds.getByRole("link", { name: /Conservatory/ })).toHaveAttribute(
      "href",
      "/conservatory",
    );
    expect(worlds.getByRole("link", { name: /Actor at Work/ })).toHaveAttribute("href", "/work");
    expect(worlds.getByRole("link", { name: /Stuck Desk/ })).toHaveAttribute("href", "/stuck");
    expect(screen.queryByRole("navigation", { name: "Main studio navigation" })).toBeNull();
    expect(screen.getByRole("link", { name: "Go to the rehearsal studio" })).toHaveAttribute(
      "href",
      "/rehearsal",
    );
  });
  it("opens a coaching panel, respects motion and restores the exact trigger", async () => {
    localStorage.setItem(
      "slams.office.preferences.v1",
      JSON.stringify({ motion: false, sound: false }),
    );
    render(<DirectorsOffice />);
    const trigger = screen.getByRole("button", { name: /The Director —/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-motion", "off");
    expect(
      within(screen.getByRole("dialog")).getByRole("link", { name: /Meet the Director/ }),
    ).toHaveAttribute("href", "/director");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("connects the desk props to existing functionality and renders all eight physical books", () => {
    const { container } = render(<DirectorsOffice />);
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: /Start rehearsal/ }),
    ).toHaveAttribute("href", "/scene");
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: /The Stuck Desk/ }),
    ).toHaveAttribute("href", "/stuck");
    expect(
      within(screen.getByRole("main")).getByRole("button", { name: /The Director —/ }),
    ).toHaveAttribute("type", "button");
    expect(container.querySelectorAll(".school-book-mini")).toHaveLength(8);
    expect(screen.getByRole("tab", { name: /The desk/ })).toHaveAttribute("aria-selected", "true");
  });

  it("opens a keyboard-accessible eight-book close-up with the correct school identities", async () => {
    render(<DirectorsOffice />);
    fireEvent.click(screen.getByRole("button", { name: /Explore the eight/ }));
    const dialog = screen.getByRole("dialog");
    for (const book of BOOK_DESIGNS) {
      expect(
        within(dialog).getByRole("link", { name: `Open ${book.school.name} school` }),
      ).toHaveAttribute("href", `/conservatory/${book.slug}`);
    }
    expect(within(dialog).getByRole("link", { name: /View the full/ })).toHaveAttribute(
      "href",
      "/conservatory",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: /Explore the eight/ })).toHaveFocus();
  });

  it("lazy-loads both connected secondary views and preserves every mapped destination", async () => {
    render(<DirectorsOffice />);
    fireEvent.click(screen.getByRole("tab", { name: /Work wall/ }));
    for (const [name, route] of [
      ["Actor at Work", "/work"],
      ["Passport", "/passport"],
      ["Technique Matrix", "/matrix"],
    ])
      expect(
        await within(screen.getByRole("main")).findByRole("link", {
          name: new RegExp("^" + name! + " —"),
        }),
      ).toHaveAttribute("href", route);
    expect(
      within(screen.getByRole("main")).queryByRole("link", { name: /Start rehearsal/ }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Rehearsal corner/ }));
    for (const [name, route] of [
      ["Baseline", "/baseline"],
      ["Performance Lab", "/lab"],
      ["Rehearsal Lounge", "/lounge"],
    ])
      expect(
        await within(screen.getByRole("main")).findByRole("link", {
          name: new RegExp("^" + name! + " —"),
        }),
      ).toHaveAttribute("href", route);
    expect(screen.getByText(/These studio systems are in development/)).toBeInTheDocument();
  });

  it("supports arrow/Home/End keyboard navigation with roving focus", async () => {
    render(<DirectorsOffice />);
    const desk = screen.getByRole("tab", { name: /The desk/ });
    desk.focus();
    fireEvent.keyDown(desk, { key: "ArrowRight" });
    const wall = screen.getByRole("tab", { name: /Work wall/ });
    expect(wall).toHaveFocus();
    expect(wall).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(wall, { key: "End" });
    expect(screen.getByRole("tab", { name: /Rehearsal corner/ })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "Home" });
    expect(desk).toHaveFocus();
    expect(desk).toHaveAttribute("tabindex", "0");
  });

  it("returns to the last office view without modifying stored rehearsal data", async () => {
    sessionStorage.setItem("slams.office.view.v1", "wall");
    localStorage.setItem("slams.passport.v1", "preserve this data");
    render(<DirectorsOffice />);
    expect(
      await within(screen.getByRole("main")).findByRole("link", { name: /^Actor at Work —/ }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("slams.passport.v1")).toBe("preserve this data");
  });

  it("defaults to silent sound and persists motion off including the book dialog", () => {
    const { container } = render(<DirectorsOffice />);
    fireEvent.click(screen.getByRole("button", { name: "Office preferences" }));
    expect(screen.getByRole("button", { name: /Sound off/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Motion on" }));
    expect(container.querySelector(".office-shell")).toHaveAttribute("data-motion", "off");
    expect(JSON.parse(localStorage.getItem("slams.office.preferences.v1")!)).toEqual({
      motion: false,
      sound: false,
    });
    fireEvent.click(screen.getByRole("button", { name: /Explore the eight/ }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-motion", "off");
  });

  it("respects the device reduced-motion preference", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const { container } = render(<DirectorsOffice />);
    expect(container.querySelector(".office-shell")).toHaveAttribute("data-motion", "off");
  });

  it("reacts to confirmed saved records with a factual count rather than an invented assessment", () => {
    state.entries = [{ id: "saved-record" }];
    const { container } = render(<DirectorsOffice />);
    expect(screen.getByText(/1 rehearsal record saved/)).toBeInTheDocument();
    expect(container.querySelector("[data-expression=proud]")).toBeInTheDocument();
  });

  it.each(["failed", "loading"])("does not celebrate %s or stale progress", (status) => {
    state.entries = [{ id: "stale-record" }];
    if (status === "failed") state.error = "Request failed";
    else state.loaded = false;
    const { container } = render(<DirectorsOffice />);
    expect(screen.queryByText(/rehearsal record saved/)).toBeNull();
    expect(container.querySelector("[data-expression=proud]")).toBeNull();
  });

  it("shows a milestone only for verified completed curriculum records", () => {
    state.milestones = 2;
    const { container } = render(<DirectorsOffice />);
    expect(screen.getByText("2 curriculum milestones saved")).toBeInTheDocument();
    expect(
      screen.getByText(/2 curriculum units marked complete in your account/),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-expression=impressed]")).toBeInTheDocument();
  });

  it("keeps Director comments off while retaining the functional navigation object", () => {
    state.mode = "off";
    render(<DirectorsOffice />);
    expect(screen.queryByText("A WORD FROM THE DIRECTOR")).toBeNull();
    expect(
      within(screen.getByRole("main")).getByRole("button", { name: /The Director —/ }),
    ).toBeInTheDocument();
  });
});

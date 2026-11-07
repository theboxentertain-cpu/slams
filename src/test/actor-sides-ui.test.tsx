import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActorSidesPage } from "@/components/foundation/ActorSidesPage";

const owner = "9e18a3fd-0749-4657-945d-f60872c88faa";
const mocks = vi.hoisted(() => ({
  sides: {} as Record<string, unknown>,
  projects: {} as Record<string, unknown>,
  auditions: {} as Record<string, unknown>,
  create: vi.fn(),
  annotate: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/use-actor-sides", () => ({ useActorSides: () => mocks.sides }));
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mocks.projects }));
vi.mock("@/lib/use-actor-auditions", () => ({ useActorAuditions: () => mocks.auditions }));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: "en" }) }));
vi.mock("@/components/slams", () => ({
  Page: ({ children, title }: { children: ReactNode; title: string }) => (
    <main><h1>{title}</h1>{children}</main>
  ),
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
const saved = {
  id: "9d4b12b1-cccb-45c4-9bee-b7fd71943440",
  userId: "actor-A",
  title: "The Balcony",
  content: "THE ROOM\nمريم: ما تمشيش\nSAM: I have to go",
  target: { kind: "project" as const, id: owner },
  annotations: [],
  revision: 1,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("crypto", {
    randomUUID: () => "a823216a-e0af-42b9-9028-c67b94ebf940",
  });
  mocks.sides = {
    userId: "actor-A", signedIn: true, loaded: true, sides: [saved], error: null,
    create: mocks.create, annotate: mocks.annotate, reload: mocks.reload,
  };
  mocks.projects = {
    loaded: true, error: null, projects: [{ id: owner, title: "The Balcony" }],
  };
  mocks.auditions = { loaded: true, error: null, records: [] };
  mocks.create.mockResolvedValue({ value: saved });
  mocks.annotate.mockResolvedValue({
    value: { ...saved, annotations: [{
      id: "a823216a-e0af-42b9-9028-c67b94ebf940",
      fromLine: 2, toLine: 3, beat: "New tactic", objective: "To stop them", tactic: "To reassure",
    }], revision: 2 },
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Script sides UI", () => {
  it("imports pasted multilingual text only after user confirms save and parent", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: "New side" }));
    const save = screen.getByRole("button", { name: "Save side" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Side title"), { target: { value: "Side 2" } });
    fireEvent.change(screen.getByLabelText("Attach to one of your projects or auditions"), {
      target: { value: "project:" + owner },
    });
    fireEvent.change(screen.getByLabelText("Paste original side text"), {
      target: { value: "INT. ROOM\r\nمريم: صدقني" },
    });
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(save);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      { title: "Side 2", content: "INT. ROOM\r\nمريم: صدقني",
        target: { kind: "project", id: owner } },
      [owner], [],
    );
  });
  it("displays script evidence separately from interpretation and saves line-anchored beat", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: /The Balcony/ }));
    expect(screen.getByRole("list", { name: "Original script — immutable snapshot" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("From line"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("To line"), { target: { value: "3" } });
    expect(screen.getAllByText(/مريم: ما تمشيش/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Beat / change"), { target: { value: "New tactic" } });
    fireEvent.change(screen.getByLabelText("Actor's playable objective (interpretation)"), {
      target: { value: "To stop them" },
    });
    fireEvent.change(screen.getByLabelText("Tactic / action (interpretation)"), {
      target: { value: "To reassure" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stage beat" }));
    expect(mocks.annotate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save beat annotations" }));
    await waitFor(() => expect(mocks.annotate).toHaveBeenCalledOnce());
    expect(mocks.annotate).toHaveBeenCalledWith(
      expect.objectContaining({ id: saved.id, content: saved.content, revision: 1 }),
      [expect.objectContaining({ fromLine: 2, toLine: 3, beat: "New tactic" })],
    );
  });
  it("requires sign-in and does not provide guest cloud import", () => {
    mocks.sides = { ...mocks.sides, userId: undefined, signedIn: false, sides: [] };
    render(<ActorSidesPage />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.queryByRole("button", { name: "New side" })).toBeNull();
  });
  it("shows real failure instead of fake import when schema is not installed", () => {
    mocks.sides = { ...mocks.sides, sides: [], error: "table missing" };
    render(<ActorSidesPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("not available");
    expect(screen.queryByRole("button", { name: "New side" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
});

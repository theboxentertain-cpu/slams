import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankProjectDraft } from "@/lib/actor-project-model";
import { ActorProjects } from "@/components/foundation/ActorProjects";

const mock = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  create: vi.fn(),
  update: vi.fn(),
  loadHistory: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mock.store }));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: "en" }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
vi.mock("@/components/slams", () => ({
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));

const project = {
  id: "p1",
  userId: "actor-a",
  title: "The Tempest",
  roleName: "Miranda",
  status: "active" as const,
  notes: { ...blankProjectDraft().notes, objective: "Change a mind" },
  revision: 3,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  mock.update.mockResolvedValue({ value: { ...project, revision: 4 } });
  mock.create.mockResolvedValue({ value: project });
  mock.loadHistory.mockResolvedValue({
    value: [{ revision: 2, title: "Old title", roleName: "Miranda", status: "active",
      notes: { ...blankProjectDraft().notes, beats: "Old beat" },
      createdAt: "2026-11-06T00:00:00Z" }],
  });
  mock.store = {
    userId: "actor-a",
    signedIn: true,
    loaded: true,
    projects: [project],
    error: null,
    create: mock.create,
    update: mock.update,
    loadHistory: mock.loadHistory,
    reload: mock.reload,
  };
});
afterEach(cleanup);

describe("Actor at Work project workspace", () => {
  it("opens a saved character file, edits its scene breakdown and submits to an owner-safe writer", async () => {
    render(<ActorProjects />);
    fireEvent.click(screen.getByRole("button", { name: /The Tempest/ }));
    expect(screen.getByLabelText("Project / production title")).toHaveValue("The Tempest");
    expect(screen.getByLabelText("Role / character")).toHaveValue("Miranda");
    const breakdown = screen.getByText("Scene breakdown").closest("details")!;
    fireEvent.click(within(breakdown).getByText("Scene breakdown"));
    fireEvent.change(screen.getByLabelText("Scene beats / changes"), {
      target: { value: "Beat 1: reassurance" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));
    await waitFor(() => expect(mock.update).toHaveBeenCalledOnce());
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", userId: "actor-a", revision: 3 }),
      expect.objectContaining({ notes: expect.objectContaining({ beats: "Beat 1: reassurance" }) }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Project saved");
  });

  it("loads a past version as an unsaved editor draft and does not overwrite without Save", async () => {
    render(<ActorProjects />);
    fireEvent.click(screen.getByRole("button", { name: /The Tempest/ }));
    fireEvent.click(screen.getByRole("button", { name: "View version history" }));
    await waitFor(() => expect(mock.loadHistory).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByText(/Version 2/));
    fireEvent.click(screen.getByRole("button", { name: "Load this version into the editor (not saved)" }));
    expect(screen.getByLabelText("Project / production title")).toHaveValue("Old title");
    expect(mock.update).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Save it to create a new revision.");
  });

  it("requires an authenticated account without creating deceptive guest project storage", () => {
    mock.store = { ...mock.store, userId: undefined, signedIn: false, loaded: true, projects: [] };
    render(<ActorProjects />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.getByRole("link", { name: "Open existing audition notes" })).toHaveAttribute(
      "href", "/work/audition",
    );
    expect(screen.queryByRole("button", { name: "New project" })).toBeNull();
  });

  it("does not offer false files when the production migration is absent", () => {
    mock.store = { ...mock.store, projects: [], error: "Project files could not be loaded." };
    render(<ActorProjects />);
    expect(screen.getByRole("alert")).toHaveTextContent("Project files could not be loaded");
    expect(screen.getByRole("alert")).toHaveTextContent("No project was saved");
    expect(screen.queryByRole("button", { name: "New project" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    expect(mock.reload).toHaveBeenCalledOnce();
  });
});

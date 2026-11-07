import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankAuditionDraft } from "@/lib/actor-audition-model";
import { AuditionFiles } from "@/components/foundation/AuditionFiles";

const ownerProjectId = "4e395745-dc7b-4be4-b7cb-6b5c956707d8";
const mocks = vi.hoisted(() => ({
  audition: {} as Record<string, unknown>,
  projects: {} as Record<string, unknown>,
  create: vi.fn(),
  update: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/use-actor-auditions", () => ({ useActorAuditions: () => mocks.audition }));
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mocks.projects }));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: "en" }) }));
vi.mock("@/components/slams", () => ({
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
const saved = {
  id: "a1",
  userId: "owner-A",
  projectId: ownerProjectId,
  title: "The Station",
  roleName: "Maya",
  dueDate: "2026-11-13",
  status: "preparing" as const,
  notes: { ...blankAuditionDraft().notes, objective: "Persuade Sam" },
  revision: 2,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.audition = {
    userId: "owner-A",
    signedIn: true,
    loaded: true,
    records: [saved],
    error: null,
    create: mocks.create,
    update: mocks.update,
    reload: mocks.reload,
  };
  mocks.projects = {
    loaded: true,
    error: null,
    projects: [{ id: ownerProjectId, title: "The Station", roleName: "Maya" }],
  };
  mocks.create.mockResolvedValue({ value: { ...saved, id: "a2", revision: 1 } });
  mocks.update.mockResolvedValue({ value: { ...saved, revision: 3 } });
});
afterEach(cleanup);

describe("Multi-audition workflow", () => {
  it("creates a distinct audition with due date and explicit project association", async () => {
    render(<AuditionFiles />);
    fireEvent.click(screen.getByRole("button", { name: "New audition" }));
    fireEvent.change(screen.getByLabelText("Audition / opportunity"), {
      target: { value: "Film call-back" },
    });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "Nora" } });
    fireEvent.change(screen.getByLabelText("Associated project"), {
      target: { value: ownerProjectId },
    });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), {
      target: { value: "2026-11-15" },
    });
    fireEvent.change(screen.getByLabelText("Audition status"), {
      target: { value: "ready" },
    });
    fireEvent.change(screen.getByLabelText("What do I want?"), {
      target: { value: "Get the truth" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create audition" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Film call-back",
        roleName: "Nora",
        projectId: ownerProjectId,
        dueDate: "2026-11-15",
        status: "ready",
        notes: expect.objectContaining({ objective: "Get the truth" }),
      }),
      [ownerProjectId],
    );
    expect(screen.getByRole("link", { name: "Open original audition-preparation notes" })).toHaveAttribute(
      "href",
      "/work/audition",
    );
  });
  it("reopens a prior file, then saves independent notes without rewriting another file", async () => {
    render(<AuditionFiles />);
    fireEvent.click(screen.getByRole("button", { name: /The Station/ }));
    expect(screen.getByLabelText("What do I want?")).toHaveValue("Persuade Sam");
    fireEvent.change(screen.getByLabelText("What do I want?"), {
      target: { value: "To change their mind" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save audition" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", userId: "owner-A", revision: 2 }),
      expect.objectContaining({
        notes: expect.objectContaining({ objective: "To change their mind" }),
      }),
      [ownerProjectId],
    );
  });
  it("shows unavailable state instead of offering a fake save when schema is missing", () => {
    mocks.audition = { ...mocks.audition, error: "missing table", records: [] };
    render(<AuditionFiles />);
    expect(screen.getByRole("alert")).toHaveTextContent("unavailable");
    expect(screen.queryByRole("button", { name: "New audition" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
  it("keeps guest mode signed-out and preserves the legacy destination", () => {
    mocks.audition = {
      ...mocks.audition,
      userId: undefined,
      signedIn: false,
      records: [],
    };
    render(<AuditionFiles />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.queryByRole("button", { name: "New audition" })).toBeNull();
    expect(screen.getByRole("link", { name: "Open original audition-preparation notes" })).toHaveAttribute(
      "href",
      "/work/audition",
    );
  });
});

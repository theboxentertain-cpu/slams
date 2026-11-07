import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActorProjects } from "@/components/foundation/ActorProjects";
import { AuditionFiles } from "@/components/foundation/AuditionFiles";
import { AuditionWorkspace } from "@/components/foundation/AuditionWorkspace";
import { UnsavedWorkProvider } from "@/lib/unsaved-work";
import { blankProjectDraft } from "@/lib/actor-project-model";
import { blankAuditionDraft } from "@/lib/actor-audition-model";

type BlockerOptions = { shouldBlockFn: () => boolean; enableBeforeUnload: () => boolean };
const mock = vi.hoisted(() => ({
  options: null as BlockerOptions | null,
  projects: {} as Record<string, unknown>,
  auditions: {} as Record<string, unknown>,
  save: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mock.projects }));
vi.mock("@/lib/use-actor-auditions", () => ({ useActorAuditions: () => mock.auditions }));
vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ locale: "en" }),
  T: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/slams", () => ({ btnPrimary: "primary", btnSecondary: "secondary" }));
vi.mock("@tanstack/react-router", () => ({
  useBlocker: (options: BlockerOptions) => {
    mock.options = options;
  },
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
const project = {
  ...blankProjectDraft(),
  id: "p1",
  userId: "actor-a",
  title: "Hamlet",
  status: "active",
  revision: 1,
  createdAt: "now",
  updatedAt: "now",
};
const audition = {
  ...blankAuditionDraft(),
  id: "a1",
  userId: "actor-a",
  title: "Callback",
  revision: 1,
  createdAt: "now",
  updatedAt: "now",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(false);
  mock.projects = {
    userId: "actor-a",
    signedIn: true,
    loaded: true,
    projects: [project],
    error: null,
    create: mock.create,
    update: mock.update,
  };
  mock.auditions = {
    userId: "actor-a",
    signedIn: true,
    loaded: true,
    records: [audition],
    error: null,
    create: mock.create,
    update: mock.update,
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Actor editor unsaved work coverage", () => {
  it("protects project edits during navigation and local editor switches, and clears only after a confirmed save", async () => {
    render(
      <UnsavedWorkProvider>
        <ActorProjects />
      </UnsavedWorkProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Hamlet/ }));
    expect(mock.options?.enableBeforeUnload()).toBe(false);
    fireEvent.change(screen.getByLabelText("Project / production title"), {
      target: { value: "My production" },
    });
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Close editor" }));
    expect(screen.getByLabelText("Project / production title")).toHaveValue("My production");
    mock.update.mockResolvedValueOnce({ error: "Conflict" });
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Conflict"));
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    mock.update.mockImplementationOnce(async () => {
      const saved = { ...project, title: "My production", revision: 2 };
      mock.projects = { ...mock.projects, projects: [saved] };
      return { value: saved };
    });
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));
    await waitFor(() => expect(mock.options?.enableBeforeUnload()).toBe(false));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Project / production title"), {
      target: { value: "Another edit" },
    });
    expect(mock.options?.enableBeforeUnload()).toBe(true);
  });
  it("guards new auditions and existing edits, honoring an explicit discard without blocking saved transitions", async () => {
    render(
      <UnsavedWorkProvider>
        <AuditionFiles />
      </UnsavedWorkProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "New audition" }));
    expect(mock.options?.enableBeforeUnload()).toBe(false);
    fireEvent.change(screen.getByLabelText("Audition / opportunity"), {
      target: { value: "New casting" },
    });
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Callback/ }));
    expect(screen.getByLabelText("Audition / opportunity")).toHaveValue("New casting");
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Callback/ }));
    expect(mock.options?.enableBeforeUnload()).toBe(false);
    fireEvent.change(screen.getByLabelText("Audition / opportunity"), {
      target: { value: "Edited casting" },
    });
    mock.update.mockImplementationOnce(async () => {
      const saved = { ...audition, title: "Edited casting", revision: 2 };
      mock.auditions = { ...mock.auditions, records: [saved] };
      return { value: saved };
    });
    fireEvent.click(screen.getByRole("button", { name: "Save audition" }));
    await waitFor(() => expect(mock.options?.enableBeforeUnload()).toBe(false));
    expect(window.confirm).toHaveBeenCalledTimes(2);
  });
  it("protects unsaved legacy browser notes and retains the warning when saving fails", async () => {
    mock.save.mockResolvedValueOnce({ error: "Offline" }).mockResolvedValueOnce({});
    const prep = {
      error: null,
      data: { role: "Original" },
      loaded: true,
      signedIn: false,
      sessionLoading: false,
      localHasData: true,
      save: mock.save,
      importLocalToCloud: vi.fn(),
    };
    render(
      <UnsavedWorkProvider>
        <AuditionWorkspace prep={prep} />
      </UnsavedWorkProvider>,
    );
    expect(mock.options?.enableBeforeUnload()).toBe(false);
    fireEvent.change(screen.getByLabelText("Role & project"), {
      target: { value: "Unsaved role" },
    });
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save audition prep" }));
    await screen.findByText("Save failed: Offline");
    expect(mock.options?.enableBeforeUnload()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save audition prep" }));
    await screen.findByText("Saved in this browser.");
    expect(mock.options?.enableBeforeUnload()).toBe(false);
  });
});

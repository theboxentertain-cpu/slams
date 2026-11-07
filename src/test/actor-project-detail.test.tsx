import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankProjectDraft } from "@/lib/actor-project-model";
import { ActorProjectDetail } from "@/components/foundation/ActorProjectDetail";

const projectId = "d43a1c12-7cf5-4b03-85aa-a9a8a71512ef";
const mock = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  audition: {} as Record<string, unknown>,
  update: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/use-actor-projects", () => ({
  useActorProjects: () => mock.store,
}));
vi.mock("@/lib/store", () => ({
  useAuditionPrep: () => mock.audition,
}));
vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ locale: "en" }),
}));
vi.mock("@/components/slams", () => ({
  Page: ({ title, children }: { title: string; children: ReactNode }) => (
    <main><h1>{title}</h1>{children}</main>
  ),
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const project = {
  id: projectId,
  userId: "actor-a",
  title: "The Station",
  roleName: "Maya",
  status: "active" as const,
  notes: {
    ...blankProjectDraft().notes,
    circumstances: "Already written in the project",
    beats: "A first beat",
  },
  revision: 1,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  mock.store = {
    signedIn: true,
    loaded: true,
    userId: "actor-a",
    projects: [project],
    error: null,
    update: mock.update,
    reload: mock.reload,
  };
  mock.audition = {
    signedIn: true,
    loaded: true,
    error: null,
    data: {
      role: "Two roles",
      circumstances: "Different existing audition circumstances",
      objective: "أقنعه يفضل",
      obstacle: "An obstacle",
    },
  };
  mock.update.mockImplementation(async (_prior, draft) => ({
    value: { ...project, notes: { ...draft.notes }, revision: 2 },
  }));
});
afterEach(cleanup);

describe("Dedicated project workspaces", () => {
  it("offers no project-editor save action for an unknown / non-owner ID", () => {
    render(<ActorProjectDetail kind="character" projectId="another-account-id" />);
    expect(screen.getByRole("alert")).toHaveTextContent("not available");
    expect(screen.queryByRole("button", { name: "Save this file" })).toBeNull();
    expect(screen.queryByText("Already written in the project")).toBeNull();
    expect(screen.getByRole("link", { name: /The Station/ })).toHaveAttribute(
      "href", "/work/character",
    );
  });

  it("writes a changed scene breakdown without deleting its character notes", async () => {
    render(<ActorProjectDetail kind="breakdown" projectId={projectId} />);
    expect(screen.getByLabelText("Scene beats / changes")).toHaveValue("A first beat");
    expect(screen.queryByLabelText("Given circumstances")).toBeNull();
    fireEvent.change(screen.getByLabelText("Scene beats / changes"), {
      target: { value: "Beat 1: Reassure. Beat 2: Withdraw." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save this file" }));
    await waitFor(() => expect(mock.update).toHaveBeenCalledOnce());
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: projectId, userId: "actor-a", revision: 1 }),
      expect.objectContaining({
        notes: expect.objectContaining({
          circumstances: "Already written in the project",
          beats: "Beat 1: Reassure. Beat 2: Withdraw.",
        }),
      }),
    );
  });

  it("stages selected legacy audition text but never overwrites filled fields or saves automatically", async () => {
    render(<ActorProjectDetail kind="character" projectId={projectId} />);
    fireEvent.click(screen.getByRole("button", { name: "Bring in existing audition preparation" }));
    expect(
      screen.getByRole("checkbox", { name: /Given circumstances/ }),
    ).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /Objective/ })).not.toBeChecked();
    expect(mock.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Objective/ }));
    fireEvent.click(screen.getByRole("button", { name: "Copy selected notes into this unsaved editor" }));
    expect(screen.getByLabelText("Objective")).toHaveValue("أقنعه يفضل");
    expect(screen.getByLabelText("Given circumstances")).toHaveValue(
      "Already written in the project",
    );
    expect(mock.update).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Source notes staged");
    fireEvent.click(screen.getByRole("button", { name: "Save this file" }));
    await waitFor(() => expect(mock.update).toHaveBeenCalledOnce());
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: projectId }),
      expect.objectContaining({
        notes: expect.objectContaining({
          objective: "أقنعه يفضل",
          circumstances: "Already written in the project",
        }),
      }),
    );
    expect(mock.audition.data.objective).toBe("أقنعه يفضل");
  });

  it("requires signing in and does not expose browser-only projects", () => {
    mock.store = { ...mock.store, signedIn: false, loaded: true, userId: undefined, projects: [] };
    render(<ActorProjectDetail kind="character" projectId={projectId} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.queryByRole("button", { name: "Save this file" })).toBeNull();
  });

  it("does not falsely offer editing if the project database is unavailable", () => {
    mock.store = { ...mock.store, error: "Missing table", projects: [] };
    render(<ActorProjectDetail kind="character" projectId={projectId} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load");
    expect(screen.queryByRole("button", { name: "Save this file" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    expect(mock.reload).toHaveBeenCalledOnce();
  });
});

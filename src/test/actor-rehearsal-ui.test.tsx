import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextualRehearsal } from "@/components/foundation/ContextualRehearsal";
import {
  validateRehearsalSearch,
  type ActorWorkRehearsal,
  type ActorWorkScene,
  type RehearsalContext,
  type RehearsalDraft,
} from "@/lib/actor-rehearsal-model";
import type { ActorSide } from "@/lib/use-actor-sides";
const mocks = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  projects: {} as Record<string, unknown>,
  auditions: {} as Record<string, unknown>,
  sides: {} as Record<string, unknown>,
  locale: "en",
  save: vi.fn(),
  start: vi.fn(),
  create: vi.fn(),
  markSaved: vi.fn(),
  dirty: vi.fn(),
}));
vi.mock("@/lib/use-actor-rehearsals", async (original) => {
  const actual = await original<typeof import("@/lib/use-actor-rehearsals")>();
  return { ...actual, useActorRehearsals: () => mocks.store };
});
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mocks.projects }));
vi.mock("@/lib/use-actor-auditions", () => ({ useActorAuditions: () => mocks.auditions }));
vi.mock("@/lib/use-actor-sides", () => ({ useActorSides: () => mocks.sides }));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: mocks.locale }) }));
vi.mock("@/lib/unsaved-work", () => ({
  useUnsavedWork: (dirty: boolean) => {
    mocks.dirty(dirty);
    return mocks.markSaved;
  },
}));
vi.mock("@/components/slams", () => ({ btnPrimary: "primary", btnSecondary: "secondary" }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search = {},
    className,
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, unknown>;
    className?: string;
  }) => (
    <a
      href={
        to +
        "?" +
        new URLSearchParams(
          Object.entries(search)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )
      }
      className={className}
    >
      {children}
    </a>
  ),
}));
const projectId = "51594f9d-5da4-4c05-883e-6ed0d29542f2";
const auditionId = "272db393-3b20-4383-9a26-f37553932a03";
const sideId = "be82ca4f-3744-4d7c-9c02-9ced5638ee80";
const sceneId = "670d214a-b53a-47bd-903b-d6eb2d88ee7e";
const sessionId = "e0076fe4-ec44-4762-a023-ff0adcd83852";
const stamp = "2026-11-07T00:00:00Z";
const context: RehearsalContext = {
  project_id: projectId,
  audition_id: auditionId,
  source_version: 1,
  source_title: "Original source",
  source_kind: "paste",
  scene_title: "The station",
  objective: "أقنعه يفضل",
  circumstances: "The train has left.",
  return_to: "audition",
};
const scene: ActorWorkScene = {
  id: sceneId,
  userId: "actor-A",
  projectId,
  auditionId,
  sideId,
  title: context.scene_title,
  objective: context.objective,
  circumstances: context.circumstances,
  revision: 1,
  createdAt: stamp,
  updatedAt: stamp,
};
const session: ActorWorkRehearsal = {
  id: sessionId,
  userId: "actor-A",
  sceneId,
  sideId,
  context,
  phase: "prepare",
  takes: [],
  reflection: "",
  status: "draft",
  revision: 1,
  createdAt: stamp,
  updatedAt: stamp,
};
const side: ActorSide = {
  id: sideId,
  userId: "actor-A",
  title: context.source_title,
  content: "ليلى: استنى\nADAM: I can't.",
  target: { kind: "audition", id: auditionId },
  sourceVersion: 1,
  annotations: [],
  revision: 1,
  createdAt: stamp,
  updatedAt: stamp,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.locale = "en";
  mocks.store = {
    userId: "actor-A",
    signedIn: true,
    loaded: true,
    error: null,
    scenes: [scene],
    sessions: [session],
    createScene: mocks.create,
    start: mocks.start,
    save: mocks.save,
    reload: vi.fn(),
  };
  mocks.projects = {
    userId: "actor-A",
    loaded: true,
    error: null,
    projects: [{ id: projectId, title: "The station" }],
    reload: vi.fn(),
  };
  mocks.auditions = {
    userId: "actor-A",
    loaded: true,
    error: null,
    records: [{ id: auditionId, projectId, title: "Film callback" }],
    reload: vi.fn(),
  };
  mocks.sides = { userId: "actor-A", loaded: true, error: null, sides: [side], reload: vi.fn() };
  mocks.save.mockImplementation(
    async (prior: ActorWorkRehearsal, draft: RehearsalDraft, complete: boolean) => ({
      value: {
        ...prior,
        ...draft,
        status: complete ? "completed" : "draft",
        revision: prior.revision + 1,
      },
    }),
  );
  mocks.start.mockResolvedValue({ value: session });
  mocks.create.mockResolvedValue({ value: scene });
});
afterEach(cleanup);
describe("Actor-owned contextual rehearsal workflow", () => {
  it("creates a scene from an owned source and navigates only after a confirmed save", async () => {
    mocks.store = { ...mocks.store, scenes: [], sessions: [] };
    const navigate = vi.fn();
    render(
      <ContextualRehearsal
        search={validateRehearsalSearch({ auditionId, sideId })}
        onNavigate={navigate}
      />,
    );
    fireEvent.change(screen.getByLabelText("Scene title"), { target: { value: "The station" } });
    fireEvent.change(screen.getByLabelText("What do you want from the other person?"), {
      target: { value: "أقنعه يفضل" },
    });
    mocks.create.mockResolvedValueOnce({ error: "offline" });
    fireEvent.click(screen.getByRole("button", { name: "Save scene" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("not confirmed"));
    expect(screen.getByLabelText("Scene title")).toHaveValue("The station");
    expect(navigate).not.toHaveBeenCalled();
    expect(mocks.markSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save scene" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ sceneId, returnTo: "audition" }));
    expect(mocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "The station", objective: "أقنعه يفضل" }),
      side,
      projectId,
      auditionId,
    );
    expect(mocks.markSaved).toHaveBeenCalledOnce();
  });
  it("pins the scene and original source when starting a new cloud draft", async () => {
    const navigate = vi.fn();
    render(
      <ContextualRehearsal
        search={validateRehearsalSearch({ sceneId, returnTo: "breakdown" })}
        onNavigate={navigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start a new rehearsal" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ sessionId }));
    expect(mocks.start).toHaveBeenCalledWith(scene, side, "breakdown");
  });
  it("requires two takes and an authored reflection, preserves failed saves, and records manual observations", async () => {
    render(
      <ContextualRehearsal search={validateRehearsalSearch({ sessionId })} onNavigate={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Complete rehearsal" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Begin first take" }));
    fireEvent.change(screen.getByLabelText("Playable action for this take"), {
      target: { value: "To reassure" },
    });
    fireEvent.change(screen.getByLabelText("What did you observe?"), {
      target: { value: "I let the pause land." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Direction and retake" }));
    expect(screen.getByText("Authored direction prompts")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Direction to try next"), {
      target: { value: "Change the action, keep the objective." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add another take" }));
    expect(screen.queryByText("Authored direction prompts")).toBeNull();
    fireEvent.change(screen.getAllByLabelText("Playable action for this take")[1]!, {
      target: { value: "To challenge" },
    });
    fireEvent.change(screen.getAllByLabelText("What did you observe?")[1]!, {
      target: { value: "I heard a need in the next line." },
    });
    fireEvent.change(screen.getByLabelText(/Your reflection:/), { target: { value: "ok" } });
    expect(screen.getByRole("button", { name: "Complete rehearsal" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Your reflection:/), {
      target: { value: "The second action changed my listening." },
    });
    mocks.save.mockResolvedValueOnce({ error: "connection lost" });
    fireEvent.click(screen.getByRole("button", { name: "Save cloud draft" }));
    await waitFor(() => expect(screen.getByText(/Save was not confirmed/)).toBeInTheDocument());
    expect(screen.getByLabelText(/Your reflection:/)).toHaveValue(
      "The second action changed my listening.",
    );
    expect(mocks.markSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Complete rehearsal" }));
    await waitFor(() => expect(mocks.markSaved).toHaveBeenCalledOnce());
    expect(mocks.save).toHaveBeenLastCalledWith(
      session,
      expect.objectContaining({
        phase: "reflect",
        takes: [
          expect.objectContaining({ action: "To reassure", observation: "I let the pause land." }),
          expect.objectContaining({
            action: "To challenge",
            observation: "I heard a need in the next line.",
          }),
        ],
        reflection: "The second action changed my listening.",
      }),
      true,
    );
    expect(screen.getByRole("link", { name: "Return to originating work" })).toHaveAttribute(
      "href",
      `/work?tab=auditions&auditionId=${auditionId}`,
    );
    expect(screen.getByRole("link", { name: "Write a linked journal entry" })).toHaveAttribute(
      "href",
      `/work/journal?projectId=${projectId}&auditionId=${auditionId}&rehearsalId=${sessionId}`,
    );
  });
  it("reviews completed history without editing and keeps older source versions after a new import or changed audition link", () => {
    mocks.auditions = {
      ...mocks.auditions,
      records: [{ id: auditionId, projectId: null, title: "Film callback" }],
    };
    mocks.sides = {
      ...mocks.sides,
      sides: [
        side,
        { ...side, id: crypto.randomUUID(), sourceVersion: 2, content: "Replacement text" },
      ],
    };
    mocks.store = {
      ...mocks.store,
      sessions: [
        {
          ...session,
          status: "completed",
          takes: [
            {
              id: crypto.randomUUID(),
              action: "To reassure",
              observation: "I waited",
              direction: "",
            },
            {
              id: crypto.randomUUID(),
              action: "To invite",
              observation: "I listened",
              direction: "",
            },
          ],
          reflection: "Different listening",
        },
      ],
    };
    render(
      <ContextualRehearsal search={validateRehearsalSearch({ sessionId })} onNavigate={vi.fn()} />,
    );
    expect(screen.getByText(/Completed · read only/)).toBeInTheDocument();
    expect(
      screen.getByText(
        (_text, element) => element?.tagName === "PRE" && element.textContent === side.content,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Replacement text")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save cloud draft" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Complete rehearsal" })).toBeNull();
    expect(screen.getByLabelText(/Your reflection:/)).toHaveAttribute("readonly");
  });
  it("fails closed for unknown IDs or mismatched source scopes", () => {
    render(
      <ContextualRehearsal
        search={validateRehearsalSearch({ sessionId: projectId })}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("not available");
    expect(screen.queryByRole("button", { name: "Save cloud draft" })).toBeNull();
  });
  it("renders Arabic controls without changing Arabic or English actor text", () => {
    mocks.locale = "ar";
    render(
      <ContextualRehearsal search={validateRehearsalSearch({ sessionId })} onNavigate={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "ابدأ أول محاولة" })).toBeInTheDocument();
    expect(screen.getByText("أقنعه يفضل")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_text, element) => element?.tagName === "PRE" && element.textContent === side.content,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete rehearsal" })).toBeNull();
  });
});

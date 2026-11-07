import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActorRehearsals } from "@/lib/use-actor-rehearsals";
import type { ActorSide } from "@/lib/use-actor-sides";
import type { RehearsalContext } from "@/lib/actor-rehearsal-model";
const mocks = vi.hoisted(() => ({
  session: { user: { id: "actor-A" } as { id: string } | null, loading: false },
  load: vi.fn(),
  readBack: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  payload: vi.fn(),
  predicate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mocks.session }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const read = {
        eq: (key: string, value: unknown) => {
          mocks.predicate(table, key, value);
          return read;
        },
        order: () => mocks.load(table),
        maybeSingle: () => mocks.readBack(table),
      };
      const mutation = {
        eq: (key: string, value: unknown) => {
          mocks.predicate(table, key, value);
          return mutation;
        },
        select: () => ({ single: () => mocks.update(table) }),
      };
      return {
        select: () => read,
        insert: (body: unknown) => {
          mocks.payload(table, "insert", body);
          return { select: () => ({ single: () => mocks.insert(table) }) };
        },
        update: (body: unknown) => {
          mocks.payload(table, "update", body);
          return mutation;
        },
      };
    },
  },
}));
const projectId = "51594f9d-5da4-4c05-883e-6ed0d29542f2";
const sideId = "be82ca4f-3744-4d7c-9c02-9ced5638ee80";
const sceneId = "670d214a-b53a-47bd-903b-d6eb2d88ee7e";
const sessionId = "e0076fe4-ec44-4762-a023-ff0adcd83852";
const stamp = "2026-11-07T00:00:00Z";
const context: RehearsalContext = {
  project_id: projectId,
  audition_id: null,
  source_version: 1,
  source_title: "Original source",
  source_kind: "legacy_text",
  scene_title: "The station",
  objective: "To persuade",
  circumstances: "The train has left.",
  return_to: "character",
};
const sceneRow = (owner = "actor-A") => ({
  id: sceneId,
  user_id: owner,
  project_id: projectId,
  audition_id: null,
  side_id: sideId,
  title: context.scene_title,
  objective: context.objective,
  circumstances: context.circumstances,
  revision: 1,
  created_at: stamp,
  updated_at: stamp,
});
const sessionRow = (owner = "actor-A", revision = 1) => ({
  id: sessionId,
  user_id: owner,
  scene_id: sceneId,
  side_id: sideId,
  context: { ...context },
  phase: "prepare",
  takes: [],
  reflection: "",
  status: "draft",
  revision,
  created_at: stamp,
  updated_at: stamp,
});
const side: ActorSide = {
  id: sideId,
  userId: "actor-A",
  title: context.source_title,
  content: "ليلى: استنى\nADAM: I can't.",
  target: { kind: "project", id: projectId },
  annotations: [],
  revision: 1,
  createdAt: stamp,
  updatedAt: stamp,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session = { user: { id: "actor-A" }, loading: false };
  mocks.load.mockImplementation(async (table: string) => ({
    data: table === "actor_work_scenes" ? [sceneRow()] : [sessionRow()],
    error: null,
  }));
  mocks.insert.mockImplementation(async (table: string) => ({
    data: table === "actor_work_scenes" ? sceneRow() : sessionRow(),
    error: null,
  }));
  mocks.update.mockResolvedValue({ data: sessionRow("actor-A", 2), error: null });
});
afterEach(cleanup);
async function mount() {
  const hook = renderHook(() => useActorRehearsals());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}
describe("Private rehearsal persistence and race protection", () => {
  it("filters anomalous foreign rows and always requests the current owner", async () => {
    mocks.load.mockImplementation(async (table: string) => ({
      data:
        table === "actor_work_scenes"
          ? [sceneRow(), sceneRow("actor-B")]
          : [sessionRow(), sessionRow("actor-B")],
      error: null,
    }));
    const hook = await mount();
    expect(hook.result.current.scenes).toHaveLength(1);
    expect(hook.result.current.sessions).toHaveLength(1);
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_scenes", "user_id", "actor-A");
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_rehearsals", "user_id", "actor-A");
  });
  it("creates a session pinned to the original source and accepts reordered JSONB confirmation", async () => {
    const hook = await mount();
    mocks.insert.mockImplementation(async () => ({
      data: {
        ...sessionRow(),
        id: (mocks.payload.mock.calls.at(-1)?.[2] as { id: string }).id,
        context: Object.fromEntries(Object.entries(context).reverse()),
      },
      error: null,
    }));
    await act(async () => {
      expect(
        await hook.result.current.start(hook.result.current.scenes[0]!, side, "character"),
      ).toMatchObject({ value: { sideId, context } });
    });
    expect(mocks.payload).toHaveBeenCalledWith(
      "actor_work_rehearsals",
      "insert",
      expect.objectContaining({ scene_id: sceneId, side_id: sideId, context, status: "draft" }),
    );
    mocks.insert.mockResolvedValue({ data: { ...sessionRow(), side_id: projectId }, error: null });
    await act(async () => {
      expect(
        await hook.result.current.start(hook.result.current.scenes[0]!, side, "character"),
      ).toHaveProperty("error");
    });
  });
  it("uses compare-and-swap for draft saves and never sends source or context updates", async () => {
    const hook = await mount();
    const prior = hook.result.current.sessions[0]!;
    const draft = {
      phase: "take" as const,
      takes: [
        {
          id: crypto.randomUUID(),
          action: "To reassure",
          observation: "I waited.",
          direction: "Try the opposite action.",
        },
      ],
      reflection: "",
    };
    mocks.update.mockResolvedValue({
      data: { ...sessionRow("actor-A", 2), ...draft },
      error: null,
    });
    await act(async () => {
      expect(await hook.result.current.save(prior, draft)).toMatchObject({
        value: { revision: 2, takes: draft.takes },
      });
    });
    expect(mocks.payload).toHaveBeenCalledWith("actor_work_rehearsals", "update", {
      ...draft,
      status: "draft",
    });
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_rehearsals", "id", sessionId);
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_rehearsals", "revision", 1);
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_rehearsals", "status", "draft");
    mocks.update.mockResolvedValue({ data: null, error: { message: "stale" } });
    await act(async () => {
      expect(await hook.result.current.save(prior, draft)).toHaveProperty("error");
    });
    expect(hook.result.current.sessions[0]?.revision).toBe(2);
  });
  it("refuses foreign sources and completed-session edits before issuing a write", async () => {
    const hook = await mount();
    const prior = hook.result.current.sessions[0]!;
    await act(async () => {
      expect(
        await hook.result.current.start(
          hook.result.current.scenes[0]!,
          { ...side, userId: "actor-B" },
          "project",
        ),
      ).toHaveProperty("error");
      expect(
        await hook.result.current.save({ ...prior, status: "completed" }, prior),
      ).toHaveProperty("error");
    });
    expect(mocks.payload).not.toHaveBeenCalled();
  });
  it("retries an uncertain scene insert with the same ID and recovers the committed row", async () => {
    const hook = await mount();
    mocks.insert.mockResolvedValue({ data: null, error: { message: "response lost" } });
    mocks.readBack.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    const draft = {
      title: context.scene_title,
      objective: context.objective,
      circumstances: context.circumstances,
    };
    await act(async () => {
      expect(await hook.result.current.createScene(draft, side, projectId, null)).toHaveProperty(
        "error",
      );
    });
    const firstId = (mocks.payload.mock.calls.at(-1)?.[2] as { id: string }).id;
    mocks.readBack.mockResolvedValue({ data: { ...sceneRow(), id: firstId }, error: null });
    await act(async () => {
      expect(await hook.result.current.createScene(draft, side, projectId, null)).toMatchObject({
        value: { id: firstId },
      });
    });
    expect((mocks.payload.mock.calls.at(-1)?.[2] as { id: string }).id).toBe(firstId);
    expect(hook.result.current.scenes.filter((scene) => scene.id === firstId)).toHaveLength(1);
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_scenes", "user_id", "actor-A");
    expect(mocks.predicate).toHaveBeenCalledWith("actor_work_scenes", "id", firstId);
  });
  it("recovers an uncertain rehearsal insert without creating a second session", async () => {
    const hook = await mount();
    mocks.insert.mockResolvedValue({ data: null, error: { message: "response lost" } });
    mocks.readBack.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await act(async () => {
      expect(
        await hook.result.current.start(hook.result.current.scenes[0]!, side, "character"),
      ).toHaveProperty("error");
    });
    const firstId = (mocks.payload.mock.calls.at(-1)?.[2] as { id: string }).id;
    mocks.readBack.mockResolvedValue({ data: { ...sessionRow(), id: firstId }, error: null });
    await act(async () => {
      expect(
        await hook.result.current.start(hook.result.current.scenes[0]!, side, "character"),
      ).toMatchObject({ value: { id: firstId } });
    });
    expect((mocks.payload.mock.calls.at(-1)?.[2] as { id: string }).id).toBe(firstId);
    expect(hook.result.current.sessions.filter((session) => session.id === firstId)).toHaveLength(
      1,
    );
  });
  it("ignores a delayed draft save after switching accounts, including sign-out privacy", async () => {
    const hook = await mount();
    const prior = hook.result.current.sessions[0]!;
    let resolve!: (result: unknown) => void;
    mocks.update.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    let result!: ReturnType<typeof hook.result.current.save>;
    act(() => {
      result = hook.result.current.save(prior, prior);
    });
    mocks.session = { user: { id: "actor-B" }, loading: false };
    mocks.load.mockImplementation(async (table: string) => ({
      data: table === "actor_work_scenes" ? [sceneRow("actor-B")] : [sessionRow("actor-B")],
      error: null,
    }));
    hook.rerender();
    expect(hook.result.current.sessions).toEqual([]);
    await waitFor(() => expect(hook.result.current.sessions[0]?.userId).toBe("actor-B"));
    await act(async () => {
      resolve({ data: sessionRow("actor-A", 2), error: null });
      expect(await result).toMatchObject({ error: expect.stringContaining("account changed") });
    });
    expect(hook.result.current.sessions[0]?.userId).toBe("actor-B");
    mocks.session = { user: null, loading: false };
    hook.rerender();
    expect(hook.result.current.sessions).toEqual([]);
  });
  it("fails closed when the private migration is unavailable", async () => {
    mocks.load.mockResolvedValue({ data: null, error: { message: "missing relation" } });
    const hook = await mount();
    expect(hook.result.current.error).toMatch(/could not be loaded/);
    expect(hook.result.current.scenes).toEqual([]);
    expect(hook.result.current.sessions).toEqual([]);
  });
});

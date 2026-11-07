import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankAuditionDraft } from "@/lib/actor-audition-model";
import { useActorAuditions } from "@/lib/use-actor-auditions";

const mocks = vi.hoisted(() => ({
  session: { user: { id: "actor-A" } as { id: string } | null, loading: false },
  from: vi.fn(),
  load: vi.fn(),
  insertResult: vi.fn(),
  updateResult: vi.fn(),
  insertPayload: vi.fn(),
  updatePayload: vi.fn(),
  predicate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mocks.session }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => mocks.from(table) },
}));
const ownProject = "4e395745-dc7b-4be4-b7cb-6b5c956707d8";
const otherProject = "a85c3544-b458-4814-9fa5-2ff599bba450";
function row(id: string, userId: string, revision = 1) {
  return {
    id,
    user_id: userId,
    project_id: ownProject,
    title: "Audition " + id,
    role_name: "Maya",
    due_date: "2026-11-11",
    status: "preparing" as const,
    notes: { objective: "To convince" },
    revision,
    created_at: "2026-11-07T00:00:00Z",
    updated_at: "2026-11-07T00:00:00Z",
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mocks.session = { user: { id: "actor-A" }, loading: false };
  mocks.load.mockResolvedValue({ data: [row("a1", "actor-A")], error: null });
  mocks.insertResult.mockResolvedValue({ data: row("a2", "actor-A"), error: null });
  mocks.updateResult.mockResolvedValue({ data: row("a1", "actor-A", 2), error: null });
  mocks.from.mockImplementation((table: string) => {
    if (table !== "actor_auditions") throw new Error("Unexpected table " + table);
    const readChain = {
      eq: (key: string, value: unknown) => {
        mocks.predicate(key, value);
        return readChain;
      },
      order: () => mocks.load(),
    };
    const mutation = {
      eq: (key: string, value: unknown) => {
        mocks.predicate(key, value);
        return mutation;
      },
      select: () => ({ single: mocks.updateResult }),
    };
    return {
      select: () => readChain,
      insert: (body: unknown) => {
        mocks.insertPayload(body);
        return { select: () => ({ single: mocks.insertResult }) };
      },
      update: (body: unknown) => {
        mocks.updatePayload(body);
        return mutation;
      },
    };
  });
});
afterEach(cleanup);
async function mount() {
  const hook = renderHook(() => useActorAuditions());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe("Multi-audition user isolation", () => {
  it("filters anomalous non-owner returned rows and requests only this account", async () => {
    mocks.load.mockResolvedValue({
      data: [row("a1", "actor-A"), row("b1", "actor-B")],
      error: null,
    });
    const hook = await mount();
    expect(hook.result.current.records.map((item) => item.id)).toEqual(["a1"]);
    expect(mocks.predicate).toHaveBeenCalledWith("user_id", "actor-A");
    expect(mocks.from).not.toHaveBeenCalledWith("audition_prep");
  });
  it("creates two independent files without modifying the legacy audition record", async () => {
    localStorage.setItem("slams.audition.v1", JSON.stringify({ role: "Legacy role" }));
    const hook = await mount();
    const draft = blankAuditionDraft();
    draft.title = "A new show";
    draft.projectId = ownProject;
    draft.notes.objective = "To persuade";
    await act(async () => {
      expect(await hook.result.current.create(draft, [ownProject])).toMatchObject({
        value: { id: "a2", userId: "actor-A", revision: 1 },
      });
    });
    expect(mocks.insertPayload).toHaveBeenCalledWith({
      user_id: "actor-A",
      project_id: ownProject,
      title: "A new show",
      role_name: "",
      due_date: null,
      status: "preparing",
      notes: expect.objectContaining({ objective: "To persuade" }),
    });
    expect(hook.result.current.records.map((item) => item.id)).toEqual(["a2", "a1"]);
    expect(JSON.parse(localStorage.getItem("slams.audition.v1")!)).toEqual({
      role: "Legacy role",
    });
  });
  it("blocks project ID spoofing before writing and refuses cross-account edit", async () => {
    const hook = await mount();
    const draft = blankAuditionDraft();
    draft.title = "Another opportunity";
    draft.projectId = otherProject;
    await act(async () => {
      expect(await hook.result.current.create(draft, [ownProject])).toMatchObject({
        error: expect.stringContaining("belongs to this account"),
      });
    });
    expect(mocks.insertPayload).not.toHaveBeenCalled();
    await act(async () => {
      expect(
        await hook.result.current.update(
          { ...hook.result.current.records[0]!, userId: "actor-B" },
          { ...draft, projectId: null },
          [ownProject],
        ),
      ).toMatchObject({ error: expect.stringContaining("owner") });
    });
  });
  it("rejects stale revision rather than overwriting another edit", async () => {
    const hook = await mount();
    const prior = hook.result.current.records[0]!;
    const draft = {
      title: prior.title,
      roleName: prior.roleName,
      projectId: prior.projectId,
      dueDate: prior.dueDate,
      status: prior.status,
      notes: prior.notes,
    };
    await act(async () => {
      expect(await hook.result.current.update(prior, draft, [ownProject])).toMatchObject({
        value: { revision: 2 },
      });
    });
    expect(mocks.predicate).toHaveBeenCalledWith("id", "a1");
    expect(mocks.predicate).toHaveBeenCalledWith("user_id", "actor-A");
    expect(mocks.predicate).toHaveBeenCalledWith("revision", 1);
    mocks.updateResult.mockResolvedValue({ data: null, error: { message: "No row" } });
    await act(async () => {
      expect(
        await hook.result.current.update(hook.result.current.records[0]!, draft, [ownProject]),
      ).toMatchObject({ error: expect.stringContaining("changed elsewhere") });
    });
    expect(hook.result.current.records[0]?.revision).toBe(2);
  });
  it("cannot display delayed account A data after switching to B", async () => {
    let resolveA!: (value: unknown) => void;
    mocks.load
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveA = resolve;
        }),
      )
      .mockResolvedValueOnce({ data: [row("b1", "actor-B")], error: null });
    const hook = renderHook(() => useActorAuditions());
    mocks.session = { user: { id: "actor-B" }, loading: false };
    hook.rerender();
    await waitFor(() => expect(hook.result.current.records[0]?.id).toBe("b1"));
    await act(async () => {
      resolveA({ data: [row("a1", "actor-A")], error: null });
    });
    expect(hook.result.current.records.map((item) => item.id)).toEqual(["b1"]);
  });
  it("fails closed when the deployment has no audition table", async () => {
    mocks.load.mockResolvedValue({ data: null, error: { message: "table missing" } });
    const hook = await mount();
    expect(hook.result.current.error).toMatch(/unavailable/);
    expect(hook.result.current.records).toEqual([]);
  });
});

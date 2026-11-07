import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankProjectDraft } from "@/lib/actor-project-model";
import { useActorProjects } from "@/lib/use-actor-projects";

const mock = vi.hoisted(() => ({
  session: { user: { id: "actor-a" } as { id: string } | null, loading: false },
  from: vi.fn(),
  load: vi.fn(),
  insertResult: vi.fn(),
  updateResult: vi.fn(),
  history: vi.fn(),
  insertPayload: vi.fn(),
  updatePayload: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => mock.from(table) },
}));

const row = (id: string, owner: string, revision = 1) => ({
  id,
  user_id: owner,
  title: "Project " + id,
  role_name: "Nora",
  status: "active" as const,
  notes: { objective: "Convince Sam" },
  revision,
  created_at: "2026-11-07T00:00:00Z",
  updated_at: "2026-11-07T00:00:00Z",
});

beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { user: { id: "actor-a" }, loading: false };
  mock.load.mockResolvedValue({ data: [row("p-a", "actor-a")], error: null });
  mock.insertResult.mockResolvedValue({ data: row("new", "actor-a"), error: null });
  mock.updateResult.mockResolvedValue({ data: row("p-a", "actor-a", 2), error: null });
  mock.history.mockResolvedValue({
    data: [{
      revision: 1,
      title: "Old title",
      role_name: "Nora",
      status: "active",
      notes: { beats: "First beat" },
      created_at: "2026-11-07T00:00:00Z",
    }],
    error: null,
  });
  mock.from.mockImplementation((table: string) => {
    const query = {
      eq: (key: string, val: unknown) => {
        mock.eq(table, key, val);
        return query;
      },
      order: () => (table === "actor_projects" ? mock.load() : mock.history()),
    };
    if (table === "actor_project_revisions") return { select: () => query };
    if (table === "actor_projects")
      return {
        select: () => query,
        insert: (value: unknown) => {
          mock.insertPayload(value);
          return { select: () => ({ single: mock.insertResult }) };
        },
        update: (value: unknown) => {
          mock.updatePayload(value);
          return { ...query, select: () => ({ single: mock.updateResult }) };
        },
      };
    throw new Error("Unexpected table: " + table);
  });
});
afterEach(cleanup);

async function mount() {
  const hook = renderHook(() => useActorProjects());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe("Actor project account protection", () => {
  it("filters anomalous nonowner rows and does not touch old audition data", async () => {
    mock.load.mockResolvedValue({ data: [row("p-a", "actor-a"), row("p-b", "actor-b")], error: null });
    const hook = await mount();
    expect(hook.result.current.projects).toHaveLength(1);
    expect(hook.result.current.projects[0]?.id).toBe("p-a");
    expect(mock.eq).toHaveBeenCalledWith("actor_projects", "user_id", "actor-a");
    expect(mock.from).not.toHaveBeenCalledWith("audition_prep");
  });

  it("creates only an authenticated actor-owned project with server confirmation", async () => {
    const hook = await mount();
    const draft = blankProjectDraft();
    draft.title = "  My Show  ";
    draft.notes.beats = "Turning point";
    let result;
    await act(async () => {
      result = await hook.result.current.create(draft);
    });
    expect(result).toMatchObject({ value: { userId: "actor-a", revision: 1 } });
    expect(mock.insertPayload).toHaveBeenCalledWith({
      user_id: "actor-a",
      title: "My Show",
      role_name: "",
      notes: expect.objectContaining({ beats: "Turning point" }),
    });
    expect(hook.result.current.projects[0]?.id).toBe("new");
  });

  it("optimistic-locks edits by project id, owner and prior revision", async () => {
    const hook = await mount();
    const old = hook.result.current.projects[0]!;
    const draft = { title: old.title, roleName: old.roleName, notes: old.notes };
    await act(async () => {
      expect(await hook.result.current.update(old, draft)).toMatchObject({
        value: { revision: 2 },
      });
    });
    expect(mock.eq).toHaveBeenCalledWith("actor_projects", "id", "p-a");
    expect(mock.eq).toHaveBeenCalledWith("actor_projects", "user_id", "actor-a");
    expect(mock.eq).toHaveBeenCalledWith("actor_projects", "revision", 1);
    expect(hook.result.current.projects[0]?.revision).toBe(2);
    mock.updateResult.mockResolvedValue({ data: null, error: { message: "0 rows" } });
    await act(async () => {
      expect(await hook.result.current.update(hook.result.current.projects[0]!, draft)).toMatchObject({
        error: expect.stringContaining("changed elsewhere"),
      });
    });
    expect(hook.result.current.projects[0]?.revision).toBe(2);
  });

  it("never renders a late A load after switching to account B", async () => {
    let resolveA!: (value: unknown) => void;
    mock.load
      .mockReturnValueOnce(new Promise((resolve) => { resolveA = resolve; }))
      .mockResolvedValueOnce({ data: [row("p-b", "actor-b")], error: null });
    const hook = renderHook(() => useActorProjects());
    mock.session = { user: { id: "actor-b" }, loading: false };
    hook.rerender();
    await waitFor(() => expect(hook.result.current.projects[0]?.id).toBe("p-b"));
    await act(async () => {
      resolveA({ data: [row("p-a", "actor-a")], error: null });
    });
    expect(hook.result.current.projects.map((x) => x.id)).toEqual(["p-b"]);
  });

  it("reads revisions only through owner and project filters", async () => {
    const hook = await mount();
    let result;
    await act(async () => {
      result = await hook.result.current.loadHistory(hook.result.current.projects[0]!);
    });
    expect(result).toMatchObject({ value: [{ revision: 1 }] });
    expect(mock.eq).toHaveBeenCalledWith("actor_project_revisions", "user_id", "actor-a");
    expect(mock.eq).toHaveBeenCalledWith("actor_project_revisions", "project_id", "p-a");
  });

  it("fails closed for signed-out creation and keeps legacy audition notes unchanged", async () => {
    mock.session = { user: null, loading: false };
    localStorage.setItem("slams.audition.v1", JSON.stringify({ role: "Old audition" }));
    const hook = await mount();
    const draft = blankProjectDraft();
    draft.title = "New";
    await act(async () => {
      expect(await hook.result.current.create(draft)).toMatchObject({ error: expect.any(String) });
    });
    expect(mock.insertPayload).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("slams.audition.v1")!)).toEqual({ role: "Old audition" });
    localStorage.removeItem("slams.audition.v1");
  });
});

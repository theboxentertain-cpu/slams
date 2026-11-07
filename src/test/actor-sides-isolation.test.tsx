import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActorSides } from "@/lib/use-actor-sides";
import type { SideAnnotation } from "@/lib/actor-sides-model";

const owner = "9e18a3fd-0749-4657-945d-f60872c88faa";
const mocks = vi.hoisted(() => ({
  session: { user: { id: "actor-A" } as { id: string } | null, loading: false },
  from: vi.fn(),
  list: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  inserted: vi.fn(),
  updated: vi.fn(),
  predicate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mocks.session }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (name: string) => mocks.from(name) },
}));
const row = (id: string, userId: string, revision = 1) => ({
  id,
  user_id: userId,
  project_id: owner,
  audition_id: null,
  title: "Side " + id,
  content: "SCENE ONE\nمريم: قول الحقيقة\nI need the truth",
  annotations: [],
  revision,
  created_at: "2026-11-07T00:00:00Z",
  updated_at: "2026-11-07T00:00:00Z",
});
const annotation: SideAnnotation = {
  id: "a823216a-e0af-42b9-9028-c67b94ebf940",
  fromLine: 2,
  toLine: 3,
  beat: "The truth is withheld",
  objective: "To persuade",
  tactic: "To interrogate",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session = { user: { id: "actor-A" }, loading: false };
  mocks.list.mockResolvedValue({ data: [row("a1", "actor-A")], error: null });
  mocks.inserted.mockResolvedValue({ data: row("a2", "actor-A"), error: null });
  mocks.updated.mockResolvedValue({
    data: { ...row("a1", "actor-A", 2), annotations: [annotation] },
    error: null,
  });
  mocks.from.mockImplementation((table: string) => {
    if (table !== "actor_sides") throw new Error("Unexpected table " + table);
    const select = {
      eq: (key: string, value: unknown) => {
        mocks.predicate(key, value);
        return select;
      },
      order: () => mocks.list(),
    };
    const edit = {
      eq: (key: string, value: unknown) => {
        mocks.predicate(key, value);
        return edit;
      },
      select: () => ({ single: mocks.updated }),
    };
    return {
      select: () => select,
      insert: (payload: unknown) => {
        mocks.insert(payload);
        return { select: () => ({ single: mocks.inserted }) };
      },
      update: (payload: unknown) => {
        mocks.update(payload);
        return edit;
      },
    };
  });
});
afterEach(cleanup);
async function mount() {
  const hook = renderHook(() => useActorSides());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe("Private source-side storage", () => {
  it("never exposes anomalous nonowner rows", async () => {
    mocks.list.mockResolvedValue({
      data: [row("a1", "actor-A"), row("b1", "actor-B")],
      error: null,
    });
    const hook = await mount();
    expect(hook.result.current.sides.map((side) => side.id)).toEqual(["a1"]);
    expect(mocks.predicate).toHaveBeenCalledWith("user_id", "actor-A");
  });
  it("creates an immutable script linked to only one owned project", async () => {
    const hook = await mount();
    await act(async () => {
      const result = await hook.result.current.create(
        {
          title: "Audition scene",
          content: row("a2", "actor-A").content,
          target: { kind: "project", id: owner },
        },
        [owner],
        [],
      );
      expect(result).toMatchObject({ value: { revision: 1, id: "a2" } });
    });
    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: "actor-A",
      project_id: owner,
      audition_id: null,
      title: "Audition scene",
      content: "SCENE ONE\nمريم: قول الحقيقة\nI need the truth",
      annotations: [],
    });
    expect(mocks.from).not.toHaveBeenCalledWith("audition_prep");
    expect(hook.result.current.sides).toHaveLength(2);
  });
  it("refuses spoofed parent IDs before sending a database request", async () => {
    const hook = await mount();
    await act(async () => {
      expect(
        await hook.result.current.create(
          {
            title: "Other script",
            content: "Line",
            target: { kind: "project", id: "a823216a-e0af-42b9-9028-c67b94ebf940" },
          },
          [owner],
          [],
        ),
      ).toMatchObject({ error: expect.stringContaining("unavailable") });
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("saves anchors but never submits a rewritten source text or parent ID", async () => {
    const hook = await mount();
    await act(async () => {
      expect(
        await hook.result.current.annotate(hook.result.current.sides[0]!, [annotation]),
      ).toMatchObject({ value: { revision: 2 } });
    });
    expect(mocks.update).toHaveBeenCalledWith({ annotations: [annotation] });
    expect(mocks.predicate).toHaveBeenCalledWith("id", "a1");
    expect(mocks.predicate).toHaveBeenCalledWith("revision", 1);
    expect(mocks.predicate).toHaveBeenCalledWith("user_id", "actor-A");
  });
  it("rejects a stale annotation revision without silently overwriting", async () => {
    const hook = await mount();
    mocks.updated.mockResolvedValue({ data: null, error: { message: "stale" } });
    await act(async () => {
      expect(
        await hook.result.current.annotate(hook.result.current.sides[0]!, [annotation]),
      ).toMatchObject({ error: expect.stringContaining("changed elsewhere") });
    });
    expect(hook.result.current.sides[0]?.revision).toBe(1);
  });
  it("discards account A's delayed list response after changing to account B", async () => {
    let resolveA!: (data: unknown) => void;
    mocks.list
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveA = resolve;
        }),
      )
      .mockResolvedValueOnce({ data: [row("b1", "actor-B")], error: null });
    const hook = renderHook(() => useActorSides());
    mocks.session = { user: { id: "actor-B" }, loading: false };
    hook.rerender();
    await waitFor(() => expect(hook.result.current.sides[0]?.id).toBe("b1"));
    await act(async () => {
      resolveA({ data: [row("a1", "actor-A")], error: null });
    });
    expect(hook.result.current.sides.map((side) => side.id)).toEqual(["b1"]);
  });
  it("fails closed when deployed project doesn't yet have actor_sides", async () => {
    mocks.list.mockResolvedValue({ data: null, error: { message: "missing" } });
    const hook = await mount();
    expect(hook.result.current.error).toMatch(/could not be loaded/);
    expect(hook.result.current.sides).toEqual([]);
  });
});

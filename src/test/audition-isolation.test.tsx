import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUDITION_KEY, useAuditionPrep } from "@/lib/store";

const mock = vi.hoisted(() => ({
  session: { user: { id: "a" } as { id: string } | null, loading: false },
  from: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  filter: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));
const notes = { objective: "Test notes" };
const saved = { data: { user_id: "a", data: notes }, error: null };

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mock.session = { user: { id: "a" }, loading: false };
  mock.read.mockResolvedValue({ data: null, error: null });
  mock.write.mockResolvedValue(saved);
  const mutation = { select: () => ({ single: mock.write }), eq: mock.filter };
  mock.filter.mockReturnValue(mutation);
  mock.upsert.mockReturnValue(mutation);
  mock.update.mockReturnValue(mutation);
  mock.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: mock.read }) }),
    upsert: mock.upsert,
    update: mock.update,
  });
});
afterEach(cleanup);
async function mounted() {
  const hook = renderHook(() => useAuditionPrep());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe("Audition storage isolation", () => {
  it("retains local notes until the import receives a persisted owner-scoped row", async () => {
    localStorage.setItem(AUDITION_KEY, JSON.stringify(notes));
    mock.write.mockResolvedValue({ data: null, error: null });
    const hook = await mounted();
    let result;
    await act(async () => {
      result = await hook.result.current.importLocalToCloud();
    });
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(JSON.parse(localStorage.getItem(AUDITION_KEY)!)).toEqual(notes);
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "a", data: notes }),
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  });

  it("recognizes an identical earlier import on retry without overwriting cloud data", async () => {
    localStorage.setItem(AUDITION_KEY, JSON.stringify(notes));
    const hook = await mounted();
    mock.read.mockResolvedValue(saved);
    await act(async () => {
      expect(await hook.result.current.importLocalToCloud()).toEqual({});
    });
    expect(localStorage.getItem(AUDITION_KEY)).toBeNull();
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it("uses a conditional update to protect cloud notes edited after the import read", async () => {
    localStorage.setItem(AUDITION_KEY, JSON.stringify(notes));
    const hook = await mounted();
    mock.read.mockResolvedValue({
      data: { user_id: "a", data: {}, updated_at: "2026-10-27T00:00:00Z" },
      error: null,
    });
    mock.write.mockResolvedValue({ data: null, error: { message: "No matching row" } });
    await act(async () => {
      expect(await hook.result.current.importLocalToCloud()).toMatchObject({
        error: "No matching row",
      });
    });
    expect(mock.filter).toHaveBeenCalledWith("user_id", "a");
    expect(mock.filter).toHaveBeenCalledWith("updated_at", "2026-10-27T00:00:00Z");
    expect(localStorage.getItem(AUDITION_KEY)).not.toBeNull();
  });

  it("does not put a late save from A into B's visible notes", async () => {
    const hook = await mounted();
    let finish!: (value: typeof saved) => void;
    mock.write.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    let saving!: ReturnType<typeof hook.result.current.save>;
    act(() => {
      saving = hook.result.current.save(notes);
    });
    mock.session = { user: { id: "b" }, loading: false };
    hook.rerender();
    await waitFor(() => expect(hook.result.current.loaded).toBe(true));
    await act(async () => {
      finish(saved);
      await saving;
    });
    expect(await saving).toMatchObject({ error: expect.stringContaining("account changed") });
    expect(hook.result.current.data).toEqual({});
  });

  it("keeps notes edited in this browser while an import is saving", async () => {
    localStorage.setItem(AUDITION_KEY, JSON.stringify(notes));
    const hook = await mounted();
    let finish!: (value: typeof saved) => void;
    mock.write.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    let importing!: ReturnType<typeof hook.result.current.importLocalToCloud>;
    act(() => {
      importing = hook.result.current.importLocalToCloud();
    });
    await waitFor(() => expect(mock.write).toHaveBeenCalledOnce());
    const edited = { objective: "New notes" };
    localStorage.setItem(AUDITION_KEY, JSON.stringify(edited));
    await act(async () => {
      finish(saved);
      await importing;
    });
    expect(JSON.parse(localStorage.getItem(AUDITION_KEY)!)).toEqual(edited);
  });
});

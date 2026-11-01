import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { usePassport, type PassportEntry } from "@/lib/store";
import { toCloudRows, type CloudPassportRow } from "@/lib/migration";

type Reply = { data: CloudPassportRow[] | null; error: { message: string } | null };
const mock = vi.hoisted(() => ({
  session: { user: { id: "owner-a" } as { id: string } | null, loading: false },
  from: vi.fn(),
  writes: vi.fn(),
  reads: vi.fn(),
  list: vi.fn(),
  filters: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));

const key = "slams.passport.v1";
const entry = (n = 1): PassportEntry => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  date: "2026-10-27T00:00:00Z",
  tactic: "To plead",
  intervention: "Listening",
  exerciseNote: "Observed",
  obstacle: "Silence",
  retakeLine: "Stay",
  reflection: "Changed",
});
const cloud = (e: PassportEntry, owner = "owner-a"): CloudPassportRow => ({
  ...toCloudRows([e], owner)[0]!,
  created_at: new Date(e.date).toISOString(),
});
const ok = (data: CloudPassportRow[] | null = []): Reply => ({ data, error: null });
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const local = () => JSON.parse(localStorage.getItem(key) ?? "[]") as PassportEntry[];
const seed = (entries: PassportEntry[]) => localStorage.setItem(key, JSON.stringify(entries));
async function mounted() {
  const hook = renderHook(() => usePassport());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}
async function runImport(
  hook: ReturnType<typeof renderHook<ReturnType<typeof usePassport>, unknown>>,
) {
  let result!: Awaited<ReturnType<typeof hook.result.current.importLocalToCloud>>;
  await act(async () => {
    result = await hook.result.current.importLocalToCloud();
  });
  return result;
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mock.session = { user: { id: "owner-a" }, loading: false };
  mock.writes.mockResolvedValue(ok());
  mock.reads.mockResolvedValue(ok());
  mock.list.mockResolvedValue(ok());
  mock.from.mockImplementation(() => ({
    upsert: mock.writes,
    select: () => ({
      eq: (column: string, owner: string) => {
        mock.filters(column, owner);
        return { order: mock.list, in: mock.reads };
      },
    }),
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Passport import persistence", () => {
  it("supports React StrictMode's effect cleanup and restart", async () => {
    const e = entry();
    seed([e]);
    mock.reads.mockResolvedValue(ok([cloud(e)]));
    const hook = renderHook(() => usePassport(), { wrapper: StrictMode });
    await waitFor(() => expect(hook.result.current.loaded).toBe(true));
    expect(await runImport(hook)).toEqual({ imported: 1 });
    expect(local()).toEqual([]);
  });

  it.each([
    "date",
    "tactic",
    "intervention",
    "exerciseNote",
    "obstacle",
    "retakeLine",
    "reflection",
  ] as const)("retains a local record when its %s differs from the saved row", async (field) => {
    const e = entry();
    seed([e]);
    const changed = { ...e, [field]: field === "date" ? "2026-10-28T00:00:00Z" : "Different" };
    mock.reads.mockResolvedValue(ok([cloud(changed)]));
    const hook = await mounted();
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(local()).toEqual([e]);
  });

  it("does not overwrite storage that becomes unreadable during the request", async () => {
    const e = entry();
    seed([e]);
    const pending = deferred<Reply>();
    mock.reads.mockReturnValue(pending.promise);
    const hook = await mounted();
    let importing!: ReturnType<typeof hook.result.current.importLocalToCloud>;
    act(() => {
      importing = hook.result.current.importLocalToCloud();
    });
    await waitFor(() => expect(mock.reads).toHaveBeenCalled());
    localStorage.setItem(key, "unparseable data to recover");
    await act(async () => {
      pending.resolve(ok([cloud(e)]));
      await importing;
    });
    expect(await importing).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(localStorage.getItem(key)).toBe("unparseable data to recover");
  });

  it("leaves the local copy intact after the importer unmounts", async () => {
    const e = entry();
    seed([e]);
    const pending = deferred<Reply>();
    mock.reads.mockReturnValue(pending.promise);
    const hook = await mounted();
    let importing!: ReturnType<typeof hook.result.current.importLocalToCloud>;
    act(() => {
      importing = hook.result.current.importLocalToCloud();
    });
    await waitFor(() => expect(mock.reads).toHaveBeenCalled());
    hook.unmount();
    await act(async () => {
      pending.resolve(ok([cloud(e)]));
      await importing;
    });
    expect(await importing).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(local()).toEqual([e]);
  });
  it("cleans up only after reading back all fields for the signed-in owner", async () => {
    const e = entry();
    seed([e]);
    const pending = deferred<Reply>();
    mock.reads.mockReturnValue(pending.promise);
    const hook = await mounted();
    let importing!: ReturnType<typeof hook.result.current.importLocalToCloud>;
    act(() => {
      importing = hook.result.current.importLocalToCloud();
    });
    await waitFor(() => expect(mock.reads).toHaveBeenCalled());
    expect(local()).toEqual([e]);
    await act(async () => {
      pending.resolve(ok([cloud(e)]));
      await importing;
    });
    expect(await importing).toEqual({ imported: 1 });
    expect(local()).toEqual([]);
    expect(mock.filters).toHaveBeenCalledWith("user_id", "owner-a");
    expect(mock.writes).toHaveBeenCalledWith(toCloudRows([e], "owner-a"), {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    expect(hook.result.current.entries).toHaveLength(1);
  });

  it.each(["response error", "network rejection", "missing readback", "readback error"])(
    "keeps the local copy after %s",
    async (failure) => {
      const e = entry();
      seed([e]);
      if (failure === "response error")
        mock.writes.mockResolvedValue({ data: null, error: { message: "Write denied" } });
      if (failure === "network rejection") mock.writes.mockRejectedValue(new Error("Offline"));
      if (failure === "missing readback") mock.reads.mockResolvedValue(ok(null));
      if (failure === "readback error")
        mock.reads.mockResolvedValue({ data: null, error: { message: "Read denied" } });
      const hook = await mounted();
      expect(await runImport(hook)).toMatchObject({ imported: 0, error: expect.any(String) });
      expect(local()).toEqual([e]);
    },
  );

  it("recognizes an already persisted identical ID on retry without duplicating the list", async () => {
    const e = entry();
    seed([e]);
    mock.list.mockResolvedValue(ok([cloud(e)]));
    mock.reads.mockResolvedValue(ok([cloud(e)]));
    const hook = await mounted();
    expect(await runImport(hook)).toEqual({ imported: 1 });
    expect(local()).toEqual([]);
    expect(hook.result.current.entries).toHaveLength(1);
  });

  it("retains a conflicting cloud ID without overwriting it", async () => {
    const e = entry();
    seed([e]);
    mock.reads.mockResolvedValue(ok([cloud({ ...e, reflection: "Different cloud notes" })]));
    const hook = await mounted();
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(local()).toEqual([e]);
  });

  it("deduplicates submitted IDs but retains conflicting and incomplete local versions", async () => {
    const e = entry();
    const conflict = { ...e, reflection: "Another local rehearsal" };
    const incomplete = { ...e, tactic: " " };
    seed([e, { ...e }, conflict, incomplete]);
    mock.reads.mockResolvedValue(ok([cloud(e)]));
    const hook = await mounted();
    expect(await runImport(hook)).toMatchObject({ imported: 1, error: expect.any(String) });
    expect(mock.writes.mock.calls[0]?.[0]).toHaveLength(1);
    expect(local()).toEqual([conflict, incomplete]);
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(local()).toEqual([conflict, incomplete]);
    expect(hook.result.current.entries).toHaveLength(1);
  });

  it("keeps unverified rows after partial persistence and imports only the remainder on retry", async () => {
    const a = entry(1),
      b = entry(2);
    seed([a, b]);
    mock.reads.mockResolvedValueOnce(ok([cloud(a)])).mockResolvedValueOnce(ok([cloud(b)]));
    const hook = await mounted();
    expect(await runImport(hook)).toMatchObject({ imported: 1, error: expect.any(String) });
    expect(local()).toEqual([b]);
    expect(await runImport(hook)).toEqual({ imported: 1 });
    expect(mock.writes.mock.calls[1]?.[0]).toEqual(toCloudRows([b], "owner-a"));
    expect(local()).toEqual([]);
    expect(hook.result.current.entries).toHaveLength(2);
  });

  it("recovers when the write persisted but its response was lost", async () => {
    const e = entry();
    seed([e]);
    mock.writes.mockRejectedValueOnce(new Error("Response lost")).mockResolvedValueOnce(ok());
    mock.reads.mockResolvedValue(ok([cloud(e)]));
    const hook = await mounted();
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: "Response lost" });
    expect(local()).toEqual([e]);
    expect(await runImport(hook)).toEqual({ imported: 1 });
    expect(local()).toEqual([]);
  });

  it("preserves edits and new entries made in storage while verification is pending", async () => {
    const e = entry();
    seed([e]);
    const pending = deferred<Reply>();
    mock.reads.mockReturnValue(pending.promise);
    const hook = await mounted();
    let importing!: ReturnType<typeof hook.result.current.importLocalToCloud>;
    act(() => {
      importing = hook.result.current.importLocalToCloud();
    });
    await waitFor(() => expect(mock.reads).toHaveBeenCalled());
    const edited = { ...e, reflection: "Edited in another tab" };
    seed([edited, entry(2)]);
    await act(async () => {
      pending.resolve(ok([cloud(e)]));
      await importing;
    });
    expect(local()).toEqual([edited, entry(2)]);
  });

  it("leaves local records intact when local storage cleanup fails", async () => {
    const e = entry();
    seed([e]);
    mock.reads.mockResolvedValue(ok([cloud(e)]));
    const hook = await mounted();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: "Storage unavailable" });
    expect(local()).toEqual([e]);
  });

  it.each(["foreign owner", "unrequested ID"])("does not accept a %s as proof", async (kind) => {
    const e = entry();
    seed([e]);
    mock.reads.mockResolvedValue(
      ok([kind === "foreign owner" ? cloud(e, "owner-b") : cloud(entry(9))]),
    );
    const hook = await mounted();
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(local()).toEqual([e]);
    expect(hook.result.current.entries).toEqual([]);
  });

  it.each([null, "loading"])("does not import when the account is %s", async (state) => {
    const e = entry();
    seed([e]);
    mock.session = {
      user: state === null ? null : { id: "owner-a" },
      loading: state === "loading",
    };
    const hook = renderHook(() => usePassport());
    expect(await runImport(hook)).toMatchObject({ imported: 0, error: expect.any(String) });
    expect(mock.writes).not.toHaveBeenCalled();
    expect(local()).toEqual([e]);
  });

  it.each(["write", "verification"])(
    "retains browser entries on account switch during %s",
    async (stage) => {
      const e = entry();
      seed([e]);
      const pending = deferred<Reply>();
      if (stage === "write") mock.writes.mockReturnValue(pending.promise);
      else mock.reads.mockReturnValue(pending.promise);
      const hook = await mounted();
      let importing!: ReturnType<typeof hook.result.current.importLocalToCloud>;
      act(() => {
        importing = hook.result.current.importLocalToCloud();
      });
      await waitFor(() => expect(stage === "write" ? mock.writes : mock.reads).toHaveBeenCalled());
      mock.session = { user: { id: "owner-b" }, loading: false };
      hook.rerender();
      await waitFor(() => expect(hook.result.current.loaded).toBe(true));
      await act(async () => {
        pending.resolve(ok([cloud(e)]));
        await importing;
      });
      expect(await importing).toMatchObject({
        imported: 0,
        error: expect.stringContaining("account changed"),
      });
      expect(local()).toEqual([e]);
      expect(hook.result.current.entries).toEqual([]);
    },
  );
});

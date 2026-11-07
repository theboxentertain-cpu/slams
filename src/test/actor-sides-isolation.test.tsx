import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActorSides } from "@/lib/use-actor-sides";
import type { SideAnnotation } from "@/lib/actor-sides-model";
import { webcrypto } from "node:crypto";
import { scriptSourceSha256 } from "@/lib/actor-script-import";

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
  upload: vi.fn(),
  remove: vi.fn(),
  recovered: vi.fn(),
  download: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mocks.session }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (name: string) => mocks.from(name),
    storage: {
      from: () => ({ upload: mocks.upload, remove: mocks.remove, download: mocks.download }),
    },
  },
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
  vi.stubGlobal("crypto", { randomUUID: () => "a2", subtle: webcrypto.subtle });
  mocks.upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }));
  mocks.remove.mockResolvedValue({ data: [], error: null });
  mocks.recovered.mockResolvedValue({ data: null, error: null });
  mocks.download.mockResolvedValue({ data: null, error: { message: "not found" } });
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
      maybeSingle: mocks.recovered,
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
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
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
      id: "a2",
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
  it("creates a separate immutable source version, preserving old text and annotations", async () => {
    const hook = await mount();
    const original = { ...hook.result.current.sides[0]!, annotations: [annotation] };
    const revised = "A different source\nNew anchor locations";
    mocks.inserted.mockResolvedValue({
      data: {
        ...row("a2", "actor-A"),
        content: revised,
        source_group_id: "a1",
        source_version: 2,
        previous_side_id: "a1",
        source_kind: "paste",
      },
      error: null,
    });
    await act(async () => {
      expect(
        await hook.result.current.create(
          { title: original.title, content: revised, target: original.target },
          [owner],
          [],
          { previous: original },
        ),
      ).toMatchObject({ value: { id: "a2", sourceVersion: 2, annotations: [] } });
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ previous_side_id: "a1", annotations: [], content: revised }),
    );
    expect(original.content).toBe(row("a1", "actor-A").content);
    expect(original.annotations).toEqual([annotation]);
    expect(hook.result.current.sides.find((side) => side.id === "a1")?.content).toBe(
      original.content,
    );
  });
  it("rejects a parent change on a source version and keeps conflicting drafts", async () => {
    const hook = await mount();
    const original = hook.result.current.sides[0]!;
    await act(async () => {
      const foreign = { kind: "audition" as const, id: owner };
      expect(
        await hook.result.current.create(
          { title: "New", content: "New", target: foreign },
          [],
          [owner],
          { previous: original },
        ),
      ).toMatchObject({ error: expect.stringContaining("same owner") });
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    mocks.inserted.mockResolvedValue({
      data: null,
      error: {
        message: "duplicate key value violates unique constraint actor_sides_source_version",
      },
    });
    await act(async () => {
      expect(
        await hook.result.current.create(
          { title: "New", content: "Changed", target: original.target },
          [owner],
          [],
          { previous: original },
        ),
      ).toMatchObject({ error: expect.stringContaining("saved elsewhere") });
    });
    expect(hook.result.current.sides).toHaveLength(1);
  });
  it("retains raw originals privately after failed inserts so a delayed commit cannot lose its source", async () => {
    const hook = await mount();
    const source = {
      file: new File(["Source"], "private.txt"),
      content: "Source",
      name: "private.txt",
      kind: "txt" as const,
      sha256: "a".repeat(64),
    };
    mocks.inserted.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    await act(async () => {
      expect(
        await hook.result.current.create(
          { title: "Original", content: "Source", target: { kind: "project", id: owner } },
          [owner],
          [],
          { source },
        ),
      ).toMatchObject({ error: expect.stringContaining("original remains private") });
    });
    const path = "actor-A/a2/private.txt";
    expect(mocks.upload).toHaveBeenCalledWith(path, source.file, {
      upsert: false,
      contentType: "text/plain",
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source_file_path: path,
        source_sha256: source.sha256,
        source_kind: "txt",
      }),
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("never creates a side if its raw source upload fails", async () => {
    const hook = await mount();
    mocks.upload.mockResolvedValue({ data: null, error: { message: "denied" } });
    await act(async () => {
      expect(
        await hook.result.current.create(
          { title: "Original", content: "Source", target: { kind: "project", id: owner } },
          [owner],
          [],
          {
            source: {
              file: new File(["Source"], "private.txt"),
              content: "Source",
              name: "private.txt",
              kind: "txt",
              sha256: "a".repeat(64),
            },
          },
        ),
      ).toMatchObject({ error: expect.stringContaining("upload was not confirmed") });
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("recovers a committed insert after its response is lost without duplicating the side", async () => {
    const hook = await mount();
    const draft = {
      title: "Recovered",
      content: row("a2", "actor-A").content,
      target: { kind: "project" as const, id: owner },
    };
    mocks.inserted.mockRejectedValueOnce(new Error("network lost"));
    mocks.recovered.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await act(async () => {
      expect(await hook.result.current.create(draft, [owner], [])).toMatchObject({
        error: expect.stringContaining("Retry to recover"),
      });
    });
    mocks.inserted.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    mocks.recovered.mockResolvedValueOnce({
      data: { ...row("a2", "actor-A"), title: draft.title },
      error: null,
    });
    await act(async () => {
      expect(await hook.result.current.create(draft, [owner], [])).toMatchObject({
        value: { id: "a2" },
      });
    });
    expect(mocks.insert.mock.calls.map((call) => (call[0] as { id: string }).id)).toEqual([
      "a2",
      "a2",
    ]);
    expect(hook.result.current.sides.filter((side) => side.id === "a2")).toHaveLength(1);
  });
  it("recovers an upload whose response was lost by verifying the existing private object's hash", async () => {
    const hook = await mount();
    const file = new File(["Source"], "private.txt");
    const sha256 = await scriptSourceSha256(file);
    const path = "actor-A/a2/private.txt";
    mocks.upload.mockRejectedValueOnce(new Error("response lost"));
    mocks.download.mockResolvedValueOnce({ data: file, error: null });
    mocks.inserted.mockResolvedValueOnce({
      data: {
        ...row("a2", "actor-A"),
        content: "Source",
        source_file_path: path,
        source_name: file.name,
        source_sha256: sha256,
        source_kind: "txt",
      },
      error: null,
    });
    await act(async () => {
      expect(
        await hook.result.current.create(
          { title: "Original", content: "Source", target: { kind: "project", id: owner } },
          [owner],
          [],
          { source: { file, sha256, kind: "txt", content: "Source", name: file.name } },
        ),
      ).toMatchObject({ value: { id: "a2", sourceFilePath: path } });
    });
    expect(mocks.download).toHaveBeenCalledWith(path);
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});

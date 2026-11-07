import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActorJournal } from "@/lib/use-actor-journal";

const mock = vi.hoisted(() => ({
  session: { user: { id: "actor-a" } as { id: string } | null, loading: false },
  from: vi.fn(),
  load: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  history: vi.fn(),
  confirm: vi.fn(),
  insertPayload: vi.fn(),
  updatePayload: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => mock.from(table) },
}));
const row = (id = "entry-a", owner = "actor-a", project = "project-a", revision = 1) => ({
  id,
  user_id: owner,
  project_id: project,
  audition_id: null,
  rehearsal_id: null,
  title: "Private notes",
  body: "ملاحظة — do not translate",
  status: "active",
  revision,
  created_at: "2026-11-07T00:00:00Z",
  updated_at: "2026-11-07T00:00:00Z",
});
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { user: { id: "actor-a" }, loading: false };
  mock.load.mockResolvedValue({ data: [row()], error: null });
  mock.insert.mockResolvedValue({ data: row("new-entry"), error: null });
  mock.update.mockResolvedValue({ data: row("entry-a", "actor-a", "project-a", 2), error: null });
  mock.history.mockResolvedValue({ data: [{ ...row(), entry_id: "entry-a" }], error: null });
  mock.confirm.mockResolvedValue({ data: row("new-entry"), error: null });
  mock.from.mockImplementation((table: string) => {
    const query = {
      eq: (key: string, value: unknown) => {
        mock.eq(table, key, value);
        return query;
      },
      order: () => (table === "actor_journal_revisions" ? mock.history() : mock.load()),
      single: mock.confirm,
    };
    const mutation = {
      eq: (key: string, value: unknown) => {
        mock.eq(table, key, value);
        return mutation;
      },
      select: () => ({ single: mock.update }),
    };
    return {
      select: () => query,
      insert: (payload: unknown) => {
        mock.insertPayload(payload);
        return { select: () => ({ single: mock.insert }) };
      },
      update: (payload: unknown) => {
        mock.updatePayload(payload);
        return mutation;
      },
    };
  });
});
afterEach(cleanup);
async function mount() {
  const hook = renderHook(() => useActorJournal("project-a"));
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}
describe("Private project journals", () => {
  it("scopes reads to the owner and project and rejects anomalous returned rows", async () => {
    mock.load.mockResolvedValue({
      data: [row(), row("foreign", "actor-b"), row("other", "actor-a", "project-b")],
      error: null,
    });
    const hook = await mount();
    expect(hook.result.current.entries.map((entry) => entry.id)).toEqual(["entry-a"]);
    expect(mock.eq).toHaveBeenCalledWith("actor_journal_entries", "user_id", "actor-a");
    expect(mock.eq).toHaveBeenCalledWith("actor_journal_entries", "project_id", "project-a");
    expect(mock.from).not.toHaveBeenCalledWith("journal_entries");
  });
  it("creates with authenticated ownership and immutable context, preserving authored text", async () => {
    mock.insert.mockResolvedValue({
      data: { ...row("new-entry"), audition_id: "audition-a", rehearsal_id: "rehearsal-a" },
      error: null,
    });
    const hook = await mount();
    await act(async () => {
      expect(
        await hook.result.current.create(
          { title: " Private notes ", body: row().body },
          { auditionId: "audition-a", rehearsalId: "rehearsal-a" },
          "new-entry",
        ),
      ).toMatchObject({ value: { userId: "actor-a", projectId: "project-a" } });
    });
    expect(mock.insertPayload).toHaveBeenCalledWith({
      id: "new-entry",
      user_id: "actor-a",
      project_id: "project-a",
      audition_id: "audition-a",
      rehearsal_id: "rehearsal-a",
      title: "Private notes",
      body: row().body,
    });
  });
  it("confirms a retried create using the same ID after an acknowledgement is lost", async () => {
    mock.insert.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate" } });
    const hook = await mount();
    await act(async () => {
      expect(
        await hook.result.current.create({ title: row().title, body: row().body }, {}, "new-entry"),
      ).toMatchObject({ value: { id: "new-entry" } });
    });
    expect(mock.eq).toHaveBeenCalledWith("actor_journal_entries", "id", "new-entry");
    expect(hook.result.current.entries.filter((entry) => entry.id === "new-entry")).toHaveLength(1);
  });
  it("uses owner, project, ID and revision CAS for saves and archive, retaining prior state on conflict", async () => {
    const hook = await mount();
    const prior = hook.result.current.entries[0]!;
    mock.update.mockResolvedValue({
      data: { ...row("entry-a", "actor-a", "project-a", 2), status: "archived" },
      error: null,
    });
    await act(async () => {
      expect(
        await hook.result.current.update(
          prior,
          { title: prior.title, body: prior.body },
          "archived",
        ),
      ).toMatchObject({ value: { revision: 2 } });
    });
    for (const [key, value] of [
      ["id", prior.id],
      ["user_id", "actor-a"],
      ["project_id", "project-a"],
      ["revision", 1],
    ])
      expect(mock.eq).toHaveBeenCalledWith("actor_journal_entries", key, value);
    expect(mock.updatePayload).toHaveBeenCalledWith({
      title: prior.title,
      body: prior.body,
      status: "archived",
    });
    mock.update.mockResolvedValue({ data: null, error: { message: "No rows" } });
    await act(async () => {
      expect(
        await hook.result.current.update(prior, { title: "Unsaved", body: "Keep me" }),
      ).toMatchObject({ error: expect.stringContaining("changed elsewhere") });
    });
    expect(hook.result.current.entries[0]?.revision).toBe(2);
  });
  it("ignores a late load after an account switch and late writes after a project switch", async () => {
    let resolveLoad!: (value: unknown) => void;
    mock.load
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
      )
      .mockResolvedValueOnce({ data: [row("entry-b", "actor-b")], error: null });
    const hook = renderHook(({ project }) => useActorJournal(project), {
      initialProps: { project: "project-a" },
    });
    mock.session = { user: { id: "actor-b" }, loading: false };
    hook.rerender({ project: "project-a" });
    await waitFor(() => expect(hook.result.current.entries[0]?.id).toBe("entry-b"));
    await act(async () => {
      resolveLoad({ data: [row()], error: null });
    });
    expect(hook.result.current.entries[0]?.id).toBe("entry-b");
    let resolveSave!: (value: unknown) => void;
    mock.update.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const prior = hook.result.current.entries[0]!;
    const saving = hook.result.current.update(prior, { title: prior.title, body: prior.body });
    mock.load.mockResolvedValue({ data: [], error: null });
    hook.rerender({ project: "project-b" });
    await act(async () => {
      resolveSave({ data: row("entry-b", "actor-b", "project-a", 2), error: null });
      expect(await saving).toMatchObject({ error: expect.stringContaining("changed") });
    });
    expect(hook.result.current.entries).toEqual([]);
  });
  it("reads history through owner and entry filters without exposing unrelated snapshots or writing", async () => {
    mock.history.mockResolvedValue({
      data: [
        { ...row(), entry_id: "entry-a" },
        { ...row(), entry_id: "other" },
        { ...row("foreign", "actor-b"), entry_id: "entry-a" },
      ],
      error: null,
    });
    const hook = await mount();
    await act(async () => {
      expect(await hook.result.current.loadHistory(hook.result.current.entries[0]!)).toMatchObject({
        value: [{ revision: 1, body: row().body }],
      });
    });
    expect(mock.eq).toHaveBeenCalledWith("actor_journal_revisions", "user_id", "actor-a");
    expect(mock.eq).toHaveBeenCalledWith("actor_journal_revisions", "entry_id", "entry-a");
    expect(mock.updatePayload).not.toHaveBeenCalled();
  });
  it("fails closed without authentication and does not change the legacy local journal", async () => {
    mock.session = { user: null, loading: false };
    localStorage.setItem("slams.journal.v1", "old private journal");
    const hook = await mount();
    await act(async () => {
      expect(await hook.result.current.create({ title: "Title", body: "Notes" })).toMatchObject({
        error: expect.any(String),
      });
    });
    expect(mock.from).not.toHaveBeenCalled();
    expect(localStorage.getItem("slams.journal.v1")).toBe("old private journal");
    localStorage.removeItem("slams.journal.v1");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account-lifecycle";
import {
  createAccountDeletionBackend,
  deleteOwnedScriptSources,
  isMissingRelation,
  makeAccountDeletionBackend,
  OWNED_ACCOUNT_TABLES,
  performAccountDeletion,
  type AccountDeletionBackend,
} from "@/lib/account-lifecycle.server";

const userId = "ea76c72c-0980-44d3-aea9-eebc6b3c68ae";
const input = {
  expectedUserId: userId,
  confirmation: ACCOUNT_DELETION_CONFIRMATION,
  password: "current-secret",
};

function backend() {
  return {
    available: vi.fn(async () => true),
    activeUser: vi.fn<AccountDeletionBackend["activeUser"]>(async () => ({
      id: userId,
      email: "actor@example.test",
      passwordAccount: true,
    })),
    reauthenticate: vi.fn(async () => ({ id: userId, token: "fresh-token" })),
    begin: vi.fn(async () => {}),
    revokeSessions: vi.fn(async () => {}),
    deleteSources: vi.fn(async () => {}),
    deleteRows: vi.fn(async () => {}),
    verifyEmpty: vi.fn(async () => {}),
    deleteUser: vi.fn(async () => {}),
    complete: vi.fn(async () => {}),
  } satisfies AccountDeletionBackend;
}

describe("Confirmed account deletion", () => {
  it("fails closed when the managed server admin secret is absent", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(await createAccountDeletionBackend()).toBeNull();
    vi.unstubAllEnvs();
    expect(await performAccountDeletion(input, "old-token", null)).toEqual({
      ok: false,
      code: "unavailable",
    });
  });

  it("does not authenticate or mutate before an exact confirmation and available resources", async () => {
    const service = backend();
    expect(
      await performAccountDeletion(
        { ...input, confirmation: "delete my account" },
        "token",
        service,
      ),
    ).toEqual({ ok: false, code: "confirmation_required" });
    expect(service.available).not.toHaveBeenCalled();
    service.available.mockResolvedValue(false);
    expect(await performAccountDeletion(input, "token", service)).toEqual({
      ok: false,
      code: "unavailable",
    });
    expect(service.activeUser).not.toHaveBeenCalled();
    expect(service.begin).not.toHaveBeenCalled();
  });

  it("rejects a stale JWT using active Auth validation, without cleanup", async () => {
    const service = backend();
    service.activeUser.mockResolvedValue(null);
    expect(await performAccountDeletion(input, "stale-token", service)).toEqual({
      ok: false,
      code: "auth_required",
    });
    expect(service.reauthenticate).not.toHaveBeenCalled();
    expect(service.begin).not.toHaveBeenCalled();
  });

  it("requires a fresh password for the very same account before any deletion", async () => {
    const service = backend();
    service.reauthenticate.mockResolvedValue({ id: "different-account", token: "fresh-token" });
    expect(await performAccountDeletion(input, "old-token", service)).toEqual({
      ok: false,
      code: "reauthentication_failed",
    });
    expect(service.reauthenticate).toHaveBeenCalledWith("actor@example.test", input.password);
    expect(service.begin).not.toHaveBeenCalled();
    expect(service.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects an account switched after the form opened, even when both accounts share a password", async () => {
    const service = backend();
    service.activeUser.mockResolvedValue({
      id: "other-account",
      email: "other@example.test",
      passwordAccount: true,
    });
    expect(await performAccountDeletion(input, "replacement-token", service)).toEqual({
      ok: false,
      code: "auth_required",
    });
    expect(service.reauthenticate).not.toHaveBeenCalled();
    expect(service.begin).not.toHaveBeenCalled();
  });

  it("blocks writes, revokes sessions, removes sources and rows, then deletes Auth last", async () => {
    const service = backend();
    expect(await performAccountDeletion(input, "old-token", service)).toEqual({
      ok: true,
      code: "deleted",
      receiptPending: false,
    });
    expect(service.revokeSessions).toHaveBeenCalledWith("fresh-token");
    const calls = [
      service.reauthenticate,
      service.begin,
      service.revokeSessions,
      service.deleteSources,
      service.deleteRows,
      service.verifyEmpty,
      service.deleteUser,
      service.complete,
    ];
    for (let index = 1; index < calls.length; index++) {
      expect(calls[index - 1]!.mock.invocationCallOrder[0]).toBeLessThan(
        calls[index]!.mock.invocationCallOrder[0]!,
      );
    }
    expect(service.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("retains the pending lock and Auth account after a partial failure, permitting retry", async () => {
    const service = backend();
    service.deleteRows.mockRejectedValueOnce(new Error("network failure"));
    expect(await performAccountDeletion(input, "old-token", service)).toEqual({
      ok: false,
      code: "cleanup_incomplete",
    });
    expect(service.deleteUser).not.toHaveBeenCalled();
    expect(service.complete).not.toHaveBeenCalled();
    expect(await performAccountDeletion(input, "old-token", service)).toEqual({
      ok: true,
      code: "deleted",
      receiptPending: false,
    });
    expect(service.begin).toHaveBeenCalledTimes(2);
  });

  it("reports a receipt reconciliation need only after confirmed resource and Auth deletion", async () => {
    const service = backend();
    service.complete.mockRejectedValue(new Error("receipt update unavailable"));
    expect(await performAccountDeletion(input, "old-token", service)).toEqual({
      ok: true,
      code: "deleted",
      receiptPending: true,
    });
    expect(service.deleteUser).toHaveBeenCalledOnce();
  });

  it("retains the Auth user and pending job if final verification finds surviving resources", async () => {
    const service = backend();
    service.verifyEmpty.mockRejectedValue(new Error("Owned rows remain"));
    expect(await performAccountDeletion(input, "old-token", service)).toEqual({
      ok: false,
      code: "cleanup_incomplete",
    });
    expect(service.deleteUser).not.toHaveBeenCalled();
    expect(service.complete).not.toHaveBeenCalled();
  });
});

type Operation = { table: string; action: string; filter?: [string, string]; value?: unknown };
function fakeAdmin(
  errors: Record<string, { code: string }> = {},
  counts: Record<string, number> = {},
) {
  const operations: Operation[] = [];
  const from = vi.fn((table: string) => {
    const operation: Operation = { table, action: "" };
    const query = {
      select: () => {
        operation.action = "select";
        return query;
      },
      limit: async () => {
        operations.push(operation);
        return { error: errors[table] ?? null, count: 0 };
      },
      delete: () => {
        operation.action = "delete";
        return query;
      },
      upsert: async (value: unknown) => {
        operation.action = "upsert";
        operation.value = value;
        operations.push(operation);
        return { error: errors[table] ?? null };
      },
      update: (value: unknown) => {
        operation.action = "update";
        operation.value = value;
        return query;
      },
      eq: async (column: string, value: string) => {
        operation.filter = [column, value];
        operations.push(operation);
        return { error: errors[table] ?? null, count: counts[table] ?? 0 };
      },
    };
    return query;
  });
  const bucket = {
    list: vi.fn(async () => ({ data: [] as { id: string; name: string }[], error: null })),
    remove: vi.fn(async () => ({ error: null })),
  };
  const client = { from, storage: { from: vi.fn(() => bucket) } } as unknown as SupabaseClient;
  return { client, operations, bucket };
}

describe("Account cleanup resource boundaries", () => {
  it("deletes every owned table child-first with an explicit owner filter", async () => {
    const { client, operations } = fakeAdmin();
    await makeAccountDeletionBackend(client, client).deleteRows(userId);
    expect(operations.map((operation) => operation.table)).toEqual([
      ...OWNED_ACCOUNT_TABLES,
      "profiles",
    ]);
    for (const operation of operations) {
      expect(operation.action).toBe("delete");
      expect(operation.filter).toEqual([operation.table === "profiles" ? "id" : "user_id", userId]);
    }
  });

  it("skips only genuinely absent newer Actor tables, never permission or foundation errors", async () => {
    expect(isMissingRelation({ code: "PGRST205" })).toBe(true);
    expect(isMissingRelation({ code: "42501" })).toBe(false);
    const absent = fakeAdmin({ actor_sides: { code: "42P01" } });
    await expect(
      makeAccountDeletionBackend(absent.client, absent.client).deleteRows(userId),
    ).resolves.toBeUndefined();
    for (const [table, code] of [
      ["actor_sides", "42501"],
      ["passport_entries", "42P01"],
    ]) {
      const denied = fakeAdmin({ [table!]: { code: code! } });
      await expect(
        makeAccountDeletionBackend(denied.client, denied.client).deleteRows(userId),
      ).rejects.toThrow();
    }
  });

  it("preflights the job gate, all tables and Storage without mutating data", async () => {
    const { client, operations, bucket } = fakeAdmin();
    expect(await makeAccountDeletionBackend(client, client).available()).toBe(true);
    expect(operations.every((operation) => operation.action === "select")).toBe(true);
    expect(operations[0]!.table).toBe("account_deletion_jobs");
    expect(bucket.list).toHaveBeenCalledOnce();
    expect(bucket.remove).not.toHaveBeenCalled();
    const denied = fakeAdmin({ account_deletion_jobs: { code: "42P01" } });
    expect(await makeAccountDeletionBackend(denied.client, denied.client).available()).toBe(false);
  });

  it("treats only Auth's explicit absent-user result as idempotent deletion success", async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: { code: "user_not_found" } });
    const client = { auth: { admin: { deleteUser } } } as unknown as SupabaseClient;
    const service = makeAccountDeletionBackend(client, client);
    await expect(service.deleteUser(userId)).resolves.toBeUndefined();
    deleteUser.mockResolvedValue({ error: { code: "unexpected_failure" } });
    await expect(service.deleteUser(userId)).rejects.toThrow();
  });

  it("requires final empty owner-row counts and an empty source prefix", async () => {
    const empty = fakeAdmin();
    await expect(
      makeAccountDeletionBackend(empty.client, empty.client).verifyEmpty(userId),
    ).resolves.toBeUndefined();
    const residue = fakeAdmin({}, { actor_sides: 1 });
    await expect(
      makeAccountDeletionBackend(residue.client, residue.client).verifyEmpty(userId),
    ).rejects.toThrow("Owned rows remain");
    const sources = fakeAdmin();
    sources.bucket.list.mockResolvedValue({
      data: [{ id: "late-file", name: "late.pdf" }],
      error: null,
    });
    await expect(
      makeAccountDeletionBackend(sources.client, sources.client).verifyEmpty(userId),
    ).rejects.toThrow("Owned sources remain");
  });

  it("enumerates nested originals before deleting, and never touches another owner prefix", async () => {
    const requests: { folder: string; offset: number }[] = [];
    const first = Array.from({ length: 100 }, (_, index) => ({
      id: `file-${index}`,
      name: `${index}.pdf`,
    }));
    const list = vi.fn(async (folder: string, options: { offset: number }) => {
      requests.push({ folder, offset: options.offset });
      return {
        error: null,
        data:
          folder === userId
            ? options.offset === 0
              ? first
              : [{ id: null, name: "nested" }]
            : [{ id: "nested-file", name: "source.txt" }],
      };
    });
    const remove = vi.fn(async () => ({ error: null }));
    const client = { storage: { from: () => ({ list, remove }) } } as unknown as SupabaseClient;
    await deleteOwnedScriptSources(client, userId);
    expect(requests).toEqual([
      { folder: userId, offset: 0 },
      { folder: userId, offset: 100 },
      { folder: `${userId}/nested`, offset: 0 },
    ]);
    expect(remove).toHaveBeenCalledTimes(2);
    const deletedPaths = remove.mock.calls.flatMap((call) => (call as unknown as [string[]])[0]);
    expect(deletedPaths).toHaveLength(101);
    expect(deletedPaths.every((path) => path.startsWith(`${userId}/`))).toBe(true);
    expect(list.mock.invocationCallOrder.at(-1)).toBeLessThan(remove.mock.invocationCallOrder[0]!);
  });

  it("does not remove any source if enumeration fails or a path escapes its folder", async () => {
    const remove = vi.fn();
    const list = vi.fn(async () => ({
      error: null,
      data: [{ id: "file", name: "../other-owner.pdf" }],
    }));
    const client = { storage: { from: () => ({ list, remove }) } } as unknown as SupabaseClient;
    await expect(deleteOwnedScriptSources(client, userId)).rejects.toThrow();
    expect(remove).not.toHaveBeenCalled();
  });
});

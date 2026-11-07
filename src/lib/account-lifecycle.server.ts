import "@tanstack/react-start/server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  type AccountDeletionInput,
  type AccountDeletionResult,
} from "./account-lifecycle";

type ActiveAccount = { id: string; email: string | null; passwordAccount: boolean };

export interface AccountDeletionBackend {
  available(): Promise<boolean>;
  activeUser(token: string): Promise<ActiveAccount | null>;
  reauthenticate(email: string, password: string): Promise<{ id: string; token: string } | null>;
  begin(userId: string): Promise<void>;
  revokeSessions(token: string): Promise<void>;
  deleteSources(userId: string): Promise<void>;
  deleteRows(userId: string): Promise<void>;
  verifyEmpty(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  complete(userId: string): Promise<void>;
}

// The expected ID is only an assertion about the account displayed by the UI.
// The cleanup target always comes from independent Auth-server validation.
export async function performAccountDeletion(
  input: AccountDeletionInput,
  token: string | null,
  backend: AccountDeletionBackend | null,
): Promise<AccountDeletionResult> {
  if (
    input.confirmation !== ACCOUNT_DELETION_CONFIRMATION ||
    !input.password ||
    input.password.length > 4096
  )
    return { ok: false, code: "confirmation_required" };
  if (!backend) return { ok: false, code: "unavailable" };
  try {
    if (!(await backend.available())) return { ok: false, code: "unavailable" };
  } catch {
    return { ok: false, code: "unavailable" };
  }
  if (!token) return { ok: false, code: "auth_required" };

  let account: ActiveAccount | null;
  let fresh: { id: string; token: string } | null;
  try {
    account = await backend.activeUser(token);
    if (!account || account.id !== input.expectedUserId)
      return { ok: false, code: "auth_required" };
    if (!account.email || !account.passwordAccount)
      return { ok: false, code: "password_account_required" };
    fresh = await backend.reauthenticate(account.email, input.password);
    if (!fresh || fresh.id !== account.id) return { ok: false, code: "reauthentication_failed" };
  } catch {
    return { ok: false, code: "reauthentication_failed" };
  }

  try {
    // A durable service-only job closes RLS before cleanup. A failed attempt
    // remains pending, preventing stale JWTs and other devices writing new data.
    await backend.begin(account.id);
    await backend.revokeSessions(fresh.token);
    await backend.deleteSources(account.id);
    await backend.deleteRows(account.id);
    await backend.verifyEmpty(account.id);
    await backend.deleteUser(account.id);
  } catch {
    return { ok: false, code: "cleanup_incomplete" };
  }
  try {
    await backend.complete(account.id);
    return { ok: true, code: "deleted", receiptPending: false };
  } catch {
    // All owned resources and the Auth user are already confirmed deleted. A
    // pending receipt is safe (fail closed) and can be reconciled by an operator.
    return { ok: true, code: "deleted", receiptPending: true };
  }
}

export const OWNED_ACCOUNT_TABLES = [
  "actor_journal_revisions",
  "actor_journal_entries",
  "actor_work_rehearsals",
  "actor_work_scenes",
  "actor_sides",
  "actor_auditions",
  "actor_project_revisions",
  "actor_projects",
  "passport_entries",
  "audition_prep",
  "unit_progress",
] as const;

const OPTIONAL_ACTOR_TABLES = new Set<string>(OWNED_ACCOUNT_TABLES.slice(0, 8));
const SOURCE_BUCKET = "actor-script-sources";

export function isMissingRelation(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function requireSuccess(error: unknown): void {
  if (error) throw new Error("Account cleanup operation failed");
}

// The generated managed binding is imported only here, behind the server
// boundary. Neither service credentials nor this module enter the client bundle.
export async function createAccountDeletionBackend(): Promise<AccountDeletionBackend | null> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key || !serviceKey) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as SupabaseClient;
  const auth = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("authorization") === `Bearer ${key}`)
          headers.delete("authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  return makeAccountDeletionBackend(admin, auth);
}

export function makeAccountDeletionBackend(
  admin: SupabaseClient,
  auth: SupabaseClient,
): AccountDeletionBackend {
  return {
    async available() {
      const job = await admin.from("account_deletion_jobs").select("user_id").limit(0);
      if (job.error) return false;
      // Probe every resource before starting a durable deletion. Only an actual
      // missing newer Actor table is compatible with an older installation.
      for (const table of OWNED_ACCOUNT_TABLES) {
        const { error } = await admin.from(table).select("user_id").limit(0);
        if (error && !(OPTIONAL_ACTOR_TABLES.has(table) && isMissingRelation(error))) return false;
      }
      const profile = await admin.from("profiles").select("id").limit(0);
      if (profile.error) return false;
      const { error } = await admin.storage.from(SOURCE_BUCKET).list("", { limit: 1 });
      return !error;
    },
    async activeUser(token) {
      const { data, error } = await auth.auth.getUser(token);
      if (error || !data.user) return null;
      return {
        id: data.user.id,
        email: data.user.email ?? null,
        passwordAccount:
          data.user.identities?.some((identity) => identity.provider === "email") ?? false,
      };
    },
    async reauthenticate(email, password) {
      const { data, error } = await auth.auth.signInWithPassword({ email, password });
      return error || !data.user || !data.session
        ? null
        : { id: data.user.id, token: data.session.access_token };
    },
    async begin(userId) {
      const { error } = await admin.from("account_deletion_jobs").upsert({
        user_id: userId,
        status: "pending",
        updated_at: new Date().toISOString(),
      });
      requireSuccess(error);
    },
    async revokeSessions(token) {
      const { error } = await admin.auth.admin.signOut(token, "global");
      requireSuccess(error);
    },
    async deleteSources(userId) {
      await deleteOwnedScriptSources(admin, userId);
    },
    async deleteRows(userId) {
      for (const table of OWNED_ACCOUNT_TABLES) {
        const { error } = await admin.from(table).delete().eq("user_id", userId);
        if (!(OPTIONAL_ACTOR_TABLES.has(table) && isMissingRelation(error))) requireSuccess(error);
      }
      const { error } = await admin.from("profiles").delete().eq("id", userId);
      requireSuccess(error);
    },
    async verifyEmpty(userId) {
      for (const table of OWNED_ACCOUNT_TABLES) {
        const { count, error } = await admin
          .from(table)
          .select("user_id", { count: "exact", head: true })
          .eq("user_id", userId);
        if (OPTIONAL_ACTOR_TABLES.has(table) && isMissingRelation(error)) continue;
        requireSuccess(error);
        if (count !== 0) throw new Error("Owned rows remain after cleanup");
      }
      const profile = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("id", userId);
      requireSuccess(profile.error);
      if (profile.count !== 0) throw new Error("Owned profile remains after cleanup");
      const sources = await admin.storage.from(SOURCE_BUCKET).list(userId, { limit: 1 });
      requireSuccess(sources.error);
      if (!sources.data || sources.data.length)
        throw new Error("Owned sources remain after cleanup");
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId, false);
      // Concurrent confirmed attempts may finish Auth removal in either order.
      // Only Auth's explicit absent-user code is an idempotent success.
      if (error?.code !== "user_not_found") requireSuccess(error);
    },
    async complete(userId) {
      const { error } = await admin
        .from("account_deletion_jobs")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      requireSuccess(error);
    },
  };
}

export async function deleteOwnedScriptSources(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
    throw new Error("Invalid verified account identity");
  const bucket = admin.storage.from(SOURCE_BUCKET);
  const files: string[] = [];
  const folders = [userId];
  while (folders.length) {
    const folder = folders.pop()!;
    let offset = 0;
    while (true) {
      const { data, error } = await bucket.list(folder, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      requireSuccess(error);
      if (!data) throw new Error("Storage listing did not confirm success");
      for (const item of data) {
        if (!item.name || item.name === "." || item.name === ".." || item.name.includes("/"))
          throw new Error("Unexpected source object path");
        const path = `${folder}/${item.name}`;
        if (item.id) files.push(path);
        else folders.push(path);
      }
      if (data.length < 100) break;
      offset += data.length;
    }
  }
  // Finish enumeration before deleting, otherwise offset pagination skips files.
  for (let offset = 0; offset < files.length; offset += 100) {
    const { error } = await bucket.remove(files.slice(offset, offset + 100));
    requireSuccess(error);
  }
}

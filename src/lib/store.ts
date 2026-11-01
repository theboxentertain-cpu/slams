// Progress persistence: signed-in users read/write Lovable Cloud (RLS-scoped);
// signed-out users keep local-only demo storage in this browser. Local data is
// never silently moved — importLocalToCloud() is called only from an explicit
// opt-in prompt.
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { matchesCloudEntry, toCloudRows } from "@/lib/migration";

export interface PassportEntry {
  id: string;
  date: string;
  tactic: string;
  intervention: string;
  exerciseNote: string;
  obstacle: string;
  retakeLine: string;
  reflection: string;
}

export type DirectorMode = "on" | "quiet" | "off";

const PASSPORT_KEY = "slams.passport.v1";
const DIRECTOR_KEY = "slams.director.v1";
export const AUDITION_KEY = "slams.audition.v1";
const EVT = "slams-store";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

// Import cleanup must fail closed: the UI's tolerant read() fallback must not
// turn inaccessible or corrupt storage into an empty copy that we overwrite.
function readForImport<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const sync = () => setValue(read(key, fallback));
    sync();
    setLoaded(true);
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T) => write(key, v), [key]);
  return [value, set, loaded] as const;
}

interface CloudRow {
  id: string;
  created_at: string;
  tactic: string;
  intervention: string;
  exercise_note: string;
  obstacle: string;
  retake_line: string;
  reflection: string;
}

const fromCloud = (r: CloudRow): PassportEntry => ({
  id: r.id,
  date: r.created_at,
  tactic: r.tactic,
  intervention: r.intervention,
  exerciseNote: r.exercise_note,
  obstacle: r.obstacle,
  retakeLine: r.retake_line,
  reflection: r.reflection,
});

function useAccountScope(id: string | undefined, loading: boolean) {
  // Async completions belong to the account that started them, including when
  // an account switches away and back before a request completes.
  const account = useRef({ id, loading });
  if (account.current.id !== id || account.current.loading !== loading) {
    account.current = { id, loading };
  }
  useEffect(() => {
    account.current = { id, loading };
    return () => {
      account.current = { id: undefined, loading: true };
    };
  }, [id, loading]);
  return account;
}

export function usePassport() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  const account = useAccountScope(user?.id, sessionLoading);
  const [localEntries, setLocalEntries, localLoaded] = useStored<PassportEntry[]>(PASSPORT_KEY, []);
  const [cloudEntries, setCloudEntries] = useState<PassportEntry[]>([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCloudEntries([]);
      setCloudLoaded(false);
      return;
    }
    setCloudLoaded(false);
    setError(null);
    let active = true;
    supabase
      .from("passport_entries")
      .select(
        "id, created_at, tactic, intervention, exercise_note, obstacle, retake_line, reflection",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setError(error?.message ?? null);
        setOwner(userId);
        setCloudEntries(((data ?? []) as CloudRow[]).map(fromCloud));
        setCloudLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signedIn = !!user;
  const entries = sessionLoading
    ? []
    : signedIn
      ? owner === user.id
        ? cloudEntries
        : []
      : localEntries;
  const loaded = !sessionLoading && (signedIn ? cloudLoaded && owner === user.id : localLoaded);

  const add = useCallback(
    async (e: PassportEntry): Promise<{ error?: string }> => {
      if (sessionLoading) return { error: "Your account is still loading. Please wait." };
      const startedFor = account.current;
      setError(null);
      try {
        if (!user) {
          setLocalEntries([e, ...read<PassportEntry[]>(PASSPORT_KEY, [])]);
          return {};
        }
        const { data, error } = await supabase
          .from("passport_entries")
          .insert({
            id: e.id,
            user_id: user.id,
            created_at: e.date,
            tactic: e.tactic,
            intervention: e.intervention,
            exercise_note: e.exerciseNote,
            obstacle: e.obstacle,
            retake_line: e.retakeLine,
            reflection: e.reflection,
          })
          .select("id, created_at")
          .single();
        if (error || !data) throw new Error(error?.message ?? "No save confirmation received.");
        if (account.current !== startedFor)
          return { error: "Your account changed. Reload your Passport before continuing." };
        setCloudEntries((cur) => [{ ...e, id: data.id, date: data.created_at }, ...cur]);
        return {};
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Save failed. Try again.";
        if (account.current === startedFor) setError(message);
        return { error: message };
      }
    },
    [user, sessionLoading, setLocalEntries, account],
  );

  const remove = useCallback(
    async (id: string) => {
      if (sessionLoading) return;
      const startedFor = account.current;
      setError(null);
      try {
        if (!user) {
          setLocalEntries(read<PassportEntry[]>(PASSPORT_KEY, []).filter((x) => x.id !== id));
          return;
        }
        const { error } = await supabase
          .from("passport_entries")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
        if (error) throw error;
        if (account.current !== startedFor) return;
        setCloudEntries((cur) => cur.filter((x) => x.id !== id));
      } catch {
        if (account.current === startedFor) setError("Could not delete this entry. Try again.");
      }
    },
    [user, sessionLoading, setLocalEntries, account],
  );

  const clear = useCallback(async () => {
    if (sessionLoading) return;
    const startedFor = account.current;
    setError(null);
    try {
      if (!user) {
        setLocalEntries([]);
        return;
      }
      const { error } = await supabase.from("passport_entries").delete().eq("user_id", user.id);
      if (error) throw error;
      if (account.current !== startedFor) return;
      setCloudEntries([]);
    } catch {
      if (account.current === startedFor) setError("Could not delete your entries. Try again.");
    }
  }, [user, sessionLoading, setLocalEntries, account]);

  /** Opt-in import. Retain each local record until its full cloud copy is verified. */
  const importLocalToCloud = useCallback(async (): Promise<{
    imported: number;
    error?: string;
  }> => {
    if (sessionLoading)
      return { imported: 0, error: "Your account is still loading. Please wait." };
    if (!user) return { imported: 0, error: "Not signed in" };
    const startedFor = account.current;
    try {
      const local = readForImport<PassportEntry[]>(PASSPORT_KEY, []);
      const rows = toCloudRows(local, user.id);
      if (rows.length === 0)
        return { imported: 0, error: "No complete entries to import. Browser entries were kept." };
      const { error: saveError } = await supabase
        .from("passport_entries")
        .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
      if (saveError) throw new Error(saveError.message);
      if (account.current !== startedFor)
        throw new Error("Your account changed. Browser entries were kept; retry after signing in.");

      // DO NOTHING returns no row for existing IDs (including other owners).
      // Read back as this owner to confirm both new saves and earlier retries.
      const { data, error: verifyError } = await supabase
        .from("passport_entries")
        .select(
          "id, user_id, created_at, tactic, intervention, exercise_note, obstacle, retake_line, reflection",
        )
        .eq("user_id", user.id)
        .in(
          "id",
          rows.map((row) => row.id),
        );
      if (verifyError) throw new Error(verifyError.message);
      if (account.current !== startedFor)
        throw new Error("Your account changed. Browser entries were kept; retry after signing in.");
      const candidates = new Set(rows.map((row) => row.id));
      const verified = (data ?? []).filter(
        (row) => row.user_id === user.id && candidates.has(row.id),
      );
      const byId = new Map(verified.map((row) => [row.id, row]));
      const confirmed = new Map(
        local.flatMap((entry) => {
          const row = byId.get(entry.id.toLowerCase());
          return row && matchesCloudEntry(entry, row) ? [[row.id, row] as const] : [];
        }),
      );
      // Re-read storage: another tab or rehearsal may have added/edited entries
      // during the request. Never replace it with the original stale snapshot.
      const current = readForImport<PassportEntry[]>(PASSPORT_KEY, []);
      const remaining = current.filter((entry) => {
        const row = confirmed.get(entry.id.toLowerCase());
        return !row || !matchesCloudEntry(entry, row);
      });
      const imported = confirmed.size;
      setLocalEntries(remaining);
      setCloudEntries((cur) => {
        const merged = new Map(cur.map((entry) => [entry.id, entry]));
        for (const row of verified) merged.set(row.id, fromCloud(row));
        return [...merged.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      });
      return remaining.length
        ? {
            imported,
            error:
              "Some browser entries could not be verified in your account and were kept. Retry the import for remaining entries.",
          }
        : { imported };
    } catch (cause) {
      return {
        imported: 0,
        error:
          cause instanceof Error
            ? cause.message
            : "Import failed. Browser entries were kept; try again.",
      };
    }
  }, [user, sessionLoading, setLocalEntries, account]);

  return {
    error,
    entries,
    loaded,
    signedIn,
    sessionLoading,
    localCount: localEntries.length,
    add,
    remove,
    clear,
    importLocalToCloud,
  };
}

export function useDirectorMode() {
  const [mode, setMode] = useStored<DirectorMode>(DIRECTOR_KEY, "on");
  return [mode, setMode] as const;
}

export type AuditionPrep = Record<string, string>;

const samePrep = (a: AuditionPrep, b: AuditionPrep) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([key, value]) => b[key] === value);

/** Audition prep: cloud row per signed-in user, localStorage otherwise. */
export function useAuditionPrep() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  const account = useAccountScope(user?.id, sessionLoading);
  const [localData, setLocalData, localLoaded] = useStored<AuditionPrep>(AUDITION_KEY, {});
  const [cloudData, setCloudData] = useState<AuditionPrep>({});
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCloudData({});
      setCloudLoaded(false);
      return;
    }
    setCloudLoaded(false);
    setError(null);
    let active = true;
    supabase
      .from("audition_prep")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setError(error?.message ?? null);
        setOwner(userId);
        setCloudData((data?.data as AuditionPrep) ?? {});
        setCloudLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signedIn = !!user;
  const data = sessionLoading ? {} : signedIn ? (owner === user.id ? cloudData : {}) : localData;
  const loaded = !sessionLoading && (signedIn ? cloudLoaded && owner === user.id : localLoaded);
  const localHasData = Object.keys(localData).some((k) => (localData[k] ?? "").trim() !== "");

  const save = useCallback(
    async (next: AuditionPrep): Promise<{ error?: string }> => {
      if (sessionLoading) return { error: "Your account is still loading. Please wait." };
      const startedFor = account.current;
      try {
        if (!user) {
          setLocalData(next);
          return {};
        }
        const { data: saved, error } = await supabase
          .from("audition_prep")
          .upsert({ user_id: user.id, data: next, updated_at: new Date().toISOString() })
          .select("user_id, data")
          .single();
        if (error) throw new Error(error.message);
        if (
          !saved ||
          saved.user_id !== user.id ||
          !saved.data ||
          !samePrep(next, saved.data as AuditionPrep)
        )
          throw new Error("No save confirmation received. Try again.");
        if (account.current !== startedFor)
          throw new Error("Your account changed. Reload your audition notes.");
        setCloudData(next);
        return {};
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Save failed. Try again.";
        if (account.current === startedFor) setError(message);
        return { error: message };
      }
    },
    [user, sessionLoading, setLocalData, account],
  );

  /** Opt-in import of this browser's local prep into the signed-in account. Clears local copy on success. */
  const importLocalToCloud = useCallback(async (): Promise<{ error?: string }> => {
    if (sessionLoading) return { error: "Your account is still loading. Please wait." };
    if (!user) return { error: "Not signed in" };
    const startedFor = account.current;
    try {
      const local = readForImport<AuditionPrep>(AUDITION_KEY, {});
      if (!Object.keys(local).some((k) => (local[k] ?? "").trim() !== "")) return {};
      const { data: current, error: loadError } = await supabase
        .from("audition_prep")
        .select("user_id, data, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (loadError) throw new Error(loadError.message);
      if (account.current !== startedFor)
        throw new Error("Your account changed. Browser notes were kept.");
      if (current && current.user_id !== user.id)
        throw new Error("Could not verify your account. Browser notes were kept.");
      const existing = (current?.data as AuditionPrep) ?? {};
      if (
        !samePrep(local, existing) &&
        Object.values(existing).some((value) => typeof value === "string" && value.trim())
      ) {
        return {
          error:
            "Your account already has audition notes. Browser notes were kept; save or export both before replacing either copy.",
        };
      }
      if (!samePrep(local, existing)) {
        const row = { user_id: user.id, data: local, updated_at: new Date().toISOString() };
        // Never overwrite notes created or edited after the read above.
        const mutation = current
          ? supabase
              .from("audition_prep")
              .update(row)
              .eq("user_id", user.id)
              .eq("updated_at", current.updated_at)
          : supabase
              .from("audition_prep")
              .upsert(row, { onConflict: "user_id", ignoreDuplicates: true });
        const { data: saved, error: saveError } = await mutation.select("user_id, data").single();
        if (saveError) throw new Error(saveError.message);
        if (
          !saved ||
          saved.user_id !== user.id ||
          !saved.data ||
          !samePrep(local, saved.data as AuditionPrep)
        )
          throw new Error("No save confirmation received. Browser notes were kept.");
      }
      if (account.current !== startedFor)
        throw new Error("Your account changed. Browser notes were kept.");
      setCloudData(local);
      if (samePrep(local, readForImport<AuditionPrep>(AUDITION_KEY, {}))) {
        localStorage.removeItem(AUDITION_KEY);
        window.dispatchEvent(new Event(EVT));
      }
      return {};
    } catch (cause) {
      return {
        error:
          cause instanceof Error
            ? cause.message
            : "Import failed. Browser notes were kept; try again.",
      };
    }
  }, [user, sessionLoading, account]);

  return { error, data, loaded, signedIn, sessionLoading, localHasData, save, importLocalToCloud };
}

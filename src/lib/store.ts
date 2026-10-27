// Progress persistence: signed-in users read/write Lovable Cloud (RLS-scoped);
// signed-out users keep local-only demo storage in this browser. Local data is
// never silently moved — importLocalToCloud() is called only from an explicit
// opt-in prompt.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { toCloudRows } from "@/lib/migration";

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

export function usePassport() {
  const { user, loading: sessionLoading } = useSession();
  const [localEntries, setLocalEntries, localLoaded] = useStored<PassportEntry[]>(PASSPORT_KEY, []);
  const [cloudEntries, setCloudEntries] = useState<PassportEntry[]>([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCloudEntries([]);
      setCloudLoaded(false);
      return;
    }
    setCloudLoaded(false);
    setError(null);
    let active = true;
    supabase
      .from("passport_entries")
      .select("id, created_at, tactic, intervention, exercise_note, obstacle, retake_line, reflection")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setError(error?.message ?? null);
        setOwner(user.id);
        setCloudEntries(((data ?? []) as CloudRow[]).map(fromCloud));
        setCloudLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const signedIn = !!user;
  const entries = signedIn ? (owner === user.id ? cloudEntries : []) : localEntries;
  const loaded = !sessionLoading && (signedIn ? cloudLoaded && owner === user.id : localLoaded);

  const add = useCallback(async (e: PassportEntry): Promise<{ error?: string }> => {
    if (sessionLoading) return { error: "Your account is still loading. Please wait." };
    setError(null);
    try {
      if (!user) {
        setLocalEntries([e, ...read<PassportEntry[]>(PASSPORT_KEY, [])]);
        return {};
      }
      const { data, error } = await supabase.from("passport_entries").insert({
        id: e.id, user_id: user.id, created_at: e.date, tactic: e.tactic,
        intervention: e.intervention, exercise_note: e.exerciseNote,
        obstacle: e.obstacle, retake_line: e.retakeLine, reflection: e.reflection,
      }).select("id, created_at").single();
      if (error || !data) throw new Error(error?.message ?? "No save confirmation received.");
      setCloudEntries((cur) => [{ ...e, id: data.id, date: data.created_at }, ...cur]);
      return {};
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Save failed. Try again.";
      setError(message);
      return { error: message };
    }
  }, [user, sessionLoading, setLocalEntries]);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      if (!user) { setLocalEntries(read<PassportEntry[]>(PASSPORT_KEY, []).filter((x) => x.id !== id)); return; }
      const { error } = await supabase.from("passport_entries").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      setCloudEntries((cur) => cur.filter((x) => x.id !== id));
    } catch { setError("Could not delete this entry. Try again."); }
  }, [user, setLocalEntries]);

  const clear = useCallback(async () => {
    setError(null);
    try {
      if (!user) { setLocalEntries([]); return; }
      const { error } = await supabase.from("passport_entries").delete().eq("user_id", user.id);
      if (error) throw error;
      setCloudEntries([]);
    } catch { setError("Could not delete your entries. Try again."); }
  }, [user, setLocalEntries]);

  /** Opt-in import of this browser's local entries into the signed-in account. Clears local copy on success. */
  const importLocalToCloud = useCallback(async (): Promise<{ imported: number; error?: string }> => {
    if (!user) return { imported: 0, error: "Not signed in" };
    const local = read<PassportEntry[]>(PASSPORT_KEY, []);
    const rows = toCloudRows(local, user.id);
    if (rows.length === 0) return { imported: 0 };
    const { data, error } = await supabase
      .from("passport_entries")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      .select("id, created_at, tactic, intervention, exercise_note, obstacle, retake_line, reflection");
    if (error) return { imported: 0, error: error.message };
    const accepted = new Set(rows.map((row) => row.id));
    setLocalEntries(local.filter((entry) => !accepted.has(entry.id)));
    setCloudEntries((cur) => [...((data ?? []) as CloudRow[]).map(fromCloud), ...cur]);
    return { imported: data?.length ?? 0 };
  }, [user, setLocalEntries]);

  return { error, entries, loaded, signedIn, sessionLoading, localCount: localEntries.length, add, remove, clear, importLocalToCloud };
}

export function useDirectorMode() {
  const [mode, setMode] = useStored<DirectorMode>(DIRECTOR_KEY, "on");
  return [mode, setMode] as const;
}

export type AuditionPrep = Record<string, string>;

/** Audition prep: cloud row per signed-in user, localStorage otherwise. */
export function useAuditionPrep() {
  const { user, loading: sessionLoading } = useSession();
  const [localData, setLocalData, localLoaded] = useStored<AuditionPrep>(AUDITION_KEY, {});
  const [cloudData, setCloudData] = useState<AuditionPrep>({});
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
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
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setError(error?.message ?? null);
        setOwner(user.id);
        setCloudData((data?.data as AuditionPrep) ?? {});
        setCloudLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const signedIn = !!user;
  const data = signedIn ? (owner === user.id ? cloudData : {}) : localData;
  const loaded = !sessionLoading && (signedIn ? cloudLoaded && owner === user.id : localLoaded);
  const localHasData = Object.keys(localData).some((k) => (localData[k] ?? "").trim() !== "");

  const save = useCallback(
    async (next: AuditionPrep): Promise<{ error?: string }> => {
      if (sessionLoading) return { error: "Your account is still loading. Please wait." };
      if (!user) {
        setLocalData(next);
        return {};
      }
      const { error } = await supabase
        .from("audition_prep")
        .upsert({ user_id: user.id, data: next, updated_at: new Date().toISOString() });
      if (error) return { error: error.message };
      setCloudData(next);
      return {};
    },
    [user, sessionLoading, setLocalData],
  );

  /** Opt-in import of this browser's local prep into the signed-in account. Clears local copy on success. */
  const importLocalToCloud = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: "Not signed in" };
    const local = read<AuditionPrep>(AUDITION_KEY, {});
    if (!Object.keys(local).some((k) => (local[k] ?? "").trim() !== "")) return {};
    const { data: current, error: loadError } = await supabase.from("audition_prep").select("data").eq("user_id", user.id).maybeSingle();
    if (loadError) return { error: loadError.message };
    const existing = (current?.data as AuditionPrep) ?? {};
    if (Object.values(existing).some((value) => typeof value === "string" && value.trim())) {
      return { error: "Your account already has audition notes. Browser notes were kept; save or export both before replacing either copy." };
    }
    const res = await save(local);
    if (res.error) return res;
    localStorage.removeItem(AUDITION_KEY);
    window.dispatchEvent(new Event(EVT));
    return {};
  }, [user, save]);

  return { error, data, loaded, signedIn, sessionLoading, localHasData, save, importLocalToCloud };
}

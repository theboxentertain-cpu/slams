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

  useEffect(() => {
    if (!user) {
      setCloudEntries([]);
      setCloudLoaded(false);
      return;
    }
    let active = true;
    supabase
      .from("passport_entries")
      .select("id, created_at, tactic, intervention, exercise_note, obstacle, retake_line, reflection")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("passport load failed", error);
        setCloudEntries(((data ?? []) as CloudRow[]).map(fromCloud));
        setCloudLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const signedIn = !!user;
  const entries = signedIn ? cloudEntries : localEntries;
  const loaded = signedIn ? cloudLoaded : localLoaded;

  const add = useCallback(
    (e: PassportEntry) => {
      if (!user) {
        setLocalEntries([e, ...read<PassportEntry[]>(PASSPORT_KEY, [])]);
        return;
      }
      supabase
        .from("passport_entries")
        .insert({
          user_id: user.id,
          tactic: e.tactic,
          intervention: e.intervention,
          exercise_note: e.exerciseNote,
          obstacle: e.obstacle,
          retake_line: e.retakeLine,
          reflection: e.reflection,
        })
        .select("id, created_at")
        .single()
        .then(({ data, error }) => {
          if (error) return console.error("passport save failed", error);
          setCloudEntries((cur) => [{ ...e, id: data.id, date: data.created_at }, ...cur]);
        });
    },
    [user, setLocalEntries],
  );

  const remove = useCallback(
    (id: string) => {
      if (!user) {
        setLocalEntries(read<PassportEntry[]>(PASSPORT_KEY, []).filter((x) => x.id !== id));
        return;
      }
      supabase
        .from("passport_entries")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) return console.error("passport delete failed", error);
          setCloudEntries((cur) => cur.filter((x) => x.id !== id));
        });
    },
    [user, setLocalEntries],
  );

  const clear = useCallback(() => {
    if (!user) {
      setLocalEntries([]);
      return;
    }
    supabase
      .from("passport_entries")
      .delete()
      .eq("user_id", user.id)
      .then(({ error }) => {
        if (error) return console.error("passport clear failed", error);
        setCloudEntries([]);
      });
  }, [user, setLocalEntries]);

  /** Opt-in import of this browser's local entries into the signed-in account. Clears local copy on success. */
  const importLocalToCloud = useCallback(async (): Promise<{ imported: number; error?: string }> => {
    if (!user) return { imported: 0, error: "Not signed in" };
    const local = read<PassportEntry[]>(PASSPORT_KEY, []);
    const rows = toCloudRows(local, user.id);
    if (rows.length === 0) return { imported: 0 };
    const { data, error } = await supabase
      .from("passport_entries")
      .insert(rows)
      .select("id, created_at, tactic, intervention, exercise_note, obstacle, retake_line, reflection");
    if (error) return { imported: 0, error: error.message };
    localStorage.removeItem(PASSPORT_KEY);
    window.dispatchEvent(new Event(EVT));
    setCloudEntries((cur) => [...((data ?? []) as CloudRow[]).map(fromCloud), ...cur]);
    return { imported: data?.length ?? 0 };
  }, [user]);

  return { entries, loaded, signedIn, sessionLoading, localCount: localEntries.length, add, remove, clear, importLocalToCloud };
}

export function useDirectorMode() {
  const [mode, setMode] = useStored<DirectorMode>(DIRECTOR_KEY, "on");
  return [mode, setMode] as const;
}

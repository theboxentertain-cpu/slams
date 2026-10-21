// DEMO MODE: local-only persistence in this browser's localStorage. Not cloud, not secure, not synced.
import { useEffect, useState, useCallback } from "react";

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

export function usePassport() {
  const [entries, setEntries, loaded] = useStored<PassportEntry[]>(PASSPORT_KEY, []);
  return {
    entries,
    loaded,
    add: (e: PassportEntry) => setEntries([e, ...read<PassportEntry[]>(PASSPORT_KEY, [])]),
    remove: (id: string) => setEntries(read<PassportEntry[]>(PASSPORT_KEY, []).filter((x) => x.id !== id)),
    clear: () => setEntries([]),
  };
}

export function useDirectorMode() {
  const [mode, setMode] = useStored<DirectorMode>(DIRECTOR_KEY, "on");
  return [mode, setMode] as const;
}

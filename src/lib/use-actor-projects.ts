import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import {
  ACTOR_PROJECTS_KEY, isActorProject, isValidProjectId, localProjectFile,
  projectDraft, serializeProjectDraft, sortProjects, validateProject,
  type ActorProject, type ProjectDraft,
} from "./actor-project-model";

const PROJECTS_EVENT = "slams-actor-projects-changed";
type WriteResult = { project?: ActorProject; error?: string };
type Scope = { owner: string; loading: boolean };

function readGuestProjects(): ActorProject[] {
  const raw = localStorage.getItem(ACTOR_PROJECTS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isActorProject) ||
      new Set(parsed.map((project) => project.id)).size !== parsed.length)
    throw new Error("Browser project files are invalid. Copy your backup before editing them.");
  return sortProjects(parsed);
}
function storeGuestProjects(projects: ActorProject[]) {
  localStorage.setItem(ACTOR_PROJECTS_KEY, JSON.stringify(sortProjects(projects)));
  window.dispatchEvent(new Event(PROJECTS_EVENT));
}
function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Project operation failed. Try again.";
}
function changedAccount(scope: { current: Scope }, captured: Scope) {
  return scope.current !== captured;
}

export function useActorProjects() {
  const { user, loading: sessionLoading } = useSession();
  const scopeId = user?.id ?? "guest";
  const ref = useRef<Scope>({ owner: scopeId, loading: sessionLoading });
  if (ref.current.owner !== scopeId || ref.current.loading !== sessionLoading)
    ref.current = { owner: scopeId, loading: sessionLoading };
  const [snapshot, setSnapshot] = useState<{ owner: string; items: ActorProject[]; loaded: boolean; error: string | null }>({
    owner: "", items: [], loaded: false, error: null,
  });
  const loaded = !sessionLoading && snapshot.owner === scopeId && snapshot.loaded;
  const items = !sessionLoading && snapshot.owner === scopeId ? snapshot.items : [];
  const error = snapshot.owner === scopeId ? snapshot.error : null;

  useEffect(() => {
    if (sessionLoading) return;
    let active = true;
    if (!user) {
      const sync = () => {
        if (!active) return;
        try {
          setSnapshot({ owner: "guest", items: readGuestProjects(), loaded: true, error: null });
        } catch (cause) {
          setSnapshot({ owner: "guest", items: [], loaded: true, error: message(cause) });
        }
      };
      sync();
      window.addEventListener("storage", sync);
      window.addEventListener(PROJECTS_EVENT, sync);
      return () => {
        active = false;
        window.removeEventListener("storage", sync);
        window.removeEventListener(PROJECTS_EVENT, sync);
      };
    }
    const owner = user.id;
    setSnapshot({ owner, items: [], loaded: false, error: null });
    void supabase
      .from("actor_projects")
      .select("*")
      .eq("user_id", owner)
      .order("updated_at", { ascending: false })
      .then(({ data, error: failure }) => {
        if (!active) return;
        if (failure) {
          setSnapshot({ owner, items: [], loaded: true,
            error: "Account project files are unavailable. The database migration or permissions may not be active." });
        } else {
          setSnapshot({ owner, items: sortProjects(data ?? []), loaded: true, error: null });
        }
      });
    return () => { active = false; };
  }, [scopeId, sessionLoading, user?.id]);

  const create = useCallback(async (draft: ProjectDraft): Promise<WriteResult> => {
    const captured = ref.current;
    if (sessionLoading || !loaded || error) return { error: "Project files are unavailable. Try again after they load." };
    const validation = validateProject(draft);
    if (validation) return { error: validation };
    const cleaned = serializeProjectDraft(draft);
    try {
      const id = globalThis.crypto?.randomUUID?.();
      if (!id || !isValidProjectId(id)) return { error: "Secure project ID generation is unavailable." };
      const now = new Date().toISOString();
      if (!user) {
        const projects = readGuestProjects();
        if (projects.some((item) => item.id === id)) return { error: "Project identifier conflict. Try again." };
        const item = localProjectFile(id, cleaned, now);
        storeGuestProjects([item, ...projects]);
        return { project: item };
      }
      const { data, error: failure } = await supabase
        .from("actor_projects")
        .insert({ id, user_id: user.id, ...cleaned })
        .select("*")
        .single();
      if (failure) throw new Error(failure.message);
      if (changedAccount(ref, captured)) return { error: "Account changed before save confirmation." };
      if (!data || data.user_id !== user.id || data.id !== id ||
          data.title !== cleaned.title)
        return { error: "Project save was not confirmed. Reload before retrying." };
      setSnapshot((state) => state.owner === user.id
        ? { ...state, items: sortProjects([data, ...state.items]) } : state);
      return { project: data };
    } catch (cause) {
      return { error: message(cause) };
    }
  }, [user, sessionLoading, loaded, error]);

  const update = useCallback(async (id: string, expectedVersion: number, draft: ProjectDraft): Promise<WriteResult> => {
    const captured = ref.current;
    if (sessionLoading || !loaded || error) return { error: "Project files are unavailable. Reload first." };
    if (!isValidProjectId(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1)
      return { error: "Invalid project version. Reload your files." };
    const validation = validateProject(draft);
    if (validation) return { error: validation };
    const cleaned = serializeProjectDraft(draft);
    try {
      if (!user) {
        const projects = readGuestProjects();
        const original = projects.find((item) => item.id === id);
        if (!original || original.version !== expectedVersion)
          return { error: "Project changed in another tab. Reload before overwriting." };
        const updated: ActorProject = {
          ...original, ...cleaned, version: original.version + 1, updated_at: new Date().toISOString(),
        };
        storeGuestProjects(projects.map((item) => item.id === id ? updated : item));
        return { project: updated };
      }
      const { data, error: failure } = await supabase
        .from("actor_projects")
        .update({ ...cleaned, version: expectedVersion + 1, updated_at: new Date().toISOString() })
        .eq("id", id).eq("user_id", user.id).eq("version", expectedVersion)
        .select("*").maybeSingle();
      if (failure) throw new Error(failure.message);
      if (changedAccount(ref, captured)) return { error: "Account changed before save confirmation." };
      if (!data || data.id !== id || data.user_id !== user.id ||
          data.version !== expectedVersion + 1 || data.title !== cleaned.title)
        return { error: "File was changed or could not be verified. Reload before overwriting." };
      setSnapshot((state) => state.owner === user.id
        ? { ...state, items: sortProjects(state.items.map((item) => item.id === id ? data : item)) } : state);
      return { project: data };
    } catch (cause) {
      return { error: message(cause) };
    }
  }, [user, sessionLoading, loaded, error]);

  const remove = useCallback(async (id: string): Promise<{ error?: string }> => {
    const captured = ref.current;
    if (sessionLoading || !loaded || error) return { error: "Project files are unavailable. Reload first." };
    if (!isValidProjectId(id)) return { error: "Invalid project identifier." };
    try {
      if (!user) {
        const projects = readGuestProjects();
        if (!projects.some((item) => item.id === id)) return { error: "Project not found. Reload first." };
        storeGuestProjects(projects.filter((item) => item.id !== id));
        return {};
      }
      const { data, error: failure } = await supabase.from("actor_projects")
        .delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
      if (failure) throw new Error(failure.message);
      if (changedAccount(ref, captured)) return { error: "Account changed. Reload before continuing." };
      if (!data || data.id !== id) return { error: "Deletion was not verified. Reload before retrying." };
      setSnapshot((state) => state.owner === user.id
        ? { ...state, items: state.items.filter((item) => item.id !== id) } : state);
      return {};
    } catch (cause) {
      return { error: message(cause) };
    }
  }, [user, sessionLoading, loaded, error]);

  const reload = useCallback(() => {
    if (sessionLoading) return;
    if (!user) {
      window.dispatchEvent(new Event(PROJECTS_EVENT));
      return;
    }
    // An account refresh re-runs the existing owner-scoped read without altering guest data.
    setSnapshot({ owner: "", items: [], loaded: false, error: null });
    void supabase.from("actor_projects").select("*").eq("user_id", user.id)
      .order("updated_at", { ascending: false }).then(({ data, error: failure }) => {
        if (ref.current.owner !== user.id) return;
        setSnapshot({ owner: user.id, items: failure ? [] : sortProjects(data ?? []),
          loaded: true, error: failure ? "Could not reload account projects." : null });
      });
  }, [user, sessionLoading]);

  return { items, loaded, error, signedIn: !!user, create, update, remove, reload };
}

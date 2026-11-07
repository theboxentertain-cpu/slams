import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import {
  parseProjectNotes,
  validateProjectDraft,
  type ProjectDraft,
  type ProjectNotes,
  type ProjectStatus,
} from "@/lib/actor-project-model";
import type { Tables } from "@/integrations/supabase/types";

type ProjectRow = Tables<"actor_projects">;
type RevisionRow = Tables<"actor_project_revisions">;

export interface ActorProject {
  id: string;
  userId: string;
  title: string;
  roleName: string;
  status: ProjectStatus;
  notes: ProjectNotes;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export interface ActorProjectRevision {
  revision: number;
  title: string;
  roleName: string;
  status: string;
  notes: ProjectNotes;
  createdAt: string;
}
type Result<T> = { value: T; error?: never } | { value?: never; error: string };
const columns = "id, user_id, title, role_name, status, notes, revision, created_at, updated_at";
const revisionColumns = "revision, title, role_name, status, notes, created_at";

export function fromProjectRow(row: ProjectRow): ActorProject {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    roleName: row.role_name,
    status: row.status,
    notes: parseProjectNotes(row.notes),
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function fromRevisionRow(row: RevisionRow): ActorProjectRevision {
  return {
    revision: row.revision,
    title: row.title,
    roleName: row.role_name,
    status: row.status,
    notes: parseProjectNotes(row.notes),
    createdAt: row.created_at,
  };
}
const changedAccount = "Your account changed. Reload Actor at Work before continuing.";
const unavailable = "Project files could not be loaded. The secure project database may not be installed in this deployment.";

export function useActorProjects() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  const scope = useRef({ id: userId, loading: sessionLoading });
  if (scope.current.id !== userId || scope.current.loading !== sessionLoading)
    scope.current = { id: userId, loading: sessionLoading };
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      scope.current = { id: undefined, loading: true };
    };
  }, []);

  const [state, setState] = useState<{
    owner: string | null;
    loaded: boolean;
    projects: ActorProject[];
    error: string | null;
  }>({ owner: null, loaded: false, projects: [], error: null });

  const reload = useCallback(async () => {
    const startedFor = scope.current;
    if (sessionLoading) return;
    if (!userId) {
      setState({ owner: null, loaded: true, projects: [], error: null });
      return;
    }
    setState({ owner: userId, loaded: false, projects: [], error: null });
    try {
      const { data, error } = await supabase
        .from("actor_projects")
        .select(columns)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      if (!active.current || scope.current !== startedFor) return;
      setState({
        owner: userId,
        loaded: true,
        projects: ((data ?? []) as ProjectRow[]).filter((row) => row.user_id === userId).map(fromProjectRow),
        error: null,
      });
    } catch {
      if (!active.current || scope.current !== startedFor) return;
      setState({ owner: userId, loaded: true, projects: [], error: unavailable });
    }
  }, [userId, sessionLoading]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(draft: ProjectDraft): Promise<Result<ActorProject>> {
    const invalid = validateProjectDraft(draft);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId) return { error: "Sign in before creating a project." };
    const startedFor = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_projects")
        .insert({
          user_id: userId,
          title: draft.title.trim(),
          role_name: draft.roleName,
          notes: { ...draft.notes },
        })
        .select(columns)
        .single();
      if (error || !data) throw new Error(error?.message ?? "Project creation was not confirmed.");
      if (!active.current || scope.current !== startedFor) return { error: changedAccount };
      if (data.user_id !== userId) return { error: "Owner verification failed. Reload this page." };
      const project = fromProjectRow(data as ProjectRow);
      setState((s) =>
        s.owner === userId
          ? { ...s, projects: [project, ...s.projects.filter((p) => p.id !== project.id)] }
          : s,
      );
      return { value: project };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Project creation failed." };
    }
  }

  async function update(
    prior: ActorProject,
    draft: ProjectDraft,
    status: ProjectStatus = prior.status,
  ): Promise<Result<ActorProject>> {
    const invalid = validateProjectDraft(draft);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || prior.userId !== userId)
      return { error: "Sign in with the project owner account before editing." };
    const startedFor = scope.current;
    try {
      // Exact revision filter prevents a stale device from silently overwriting
      // a more recent cloud snapshot. DB trigger owns revision increments.
      const { data, error } = await supabase
        .from("actor_projects")
        .update({
          title: draft.title.trim(),
          role_name: draft.roleName,
          notes: { ...draft.notes },
          status,
        })
        .eq("id", prior.id)
        .eq("user_id", userId)
        .eq("revision", prior.revision)
        .select(columns)
        .single();
      if (error || !data)
        throw new Error(
          "Save was not confirmed. This project may have changed elsewhere; reload before retrying.",
        );
      if (!active.current || scope.current !== startedFor) return { error: changedAccount };
      if (data.user_id !== userId || data.id !== prior.id || data.revision <= prior.revision)
        return { error: "Project version or ownership was not verified. Reload before editing." };
      const project = fromProjectRow(data as ProjectRow);
      setState((s) =>
        s.owner === userId
          ? {
              ...s,
              projects: s.projects
                .map((p) => (p.id === project.id ? project : p))
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
            }
          : s,
      );
      return { value: project };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Project save failed." };
    }
  }

  async function loadHistory(prior: ActorProject): Promise<Result<ActorProjectRevision[]>> {
    if (sessionLoading || !userId || prior.userId !== userId)
      return { error: "Sign in with the project owner account to view its history." };
    const startedFor = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_project_revisions")
        .select(revisionColumns)
        .eq("user_id", userId)
        .eq("project_id", prior.id)
        .order("revision", { ascending: false });
      if (error) throw new Error(error.message);
      if (!active.current || scope.current !== startedFor) return { error: changedAccount };
      return { value: ((data ?? []) as RevisionRow[]).map(fromRevisionRow) };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Version history is unavailable." };
    }
  }

  const signedIn = !!userId;
  const ownerMatches = state.owner === (userId ?? null);
  return {
    signedIn,
    userId,
    loaded: !sessionLoading && (!signedIn || (ownerMatches && state.loaded)),
    projects: !sessionLoading && signedIn && ownerMatches ? state.projects : [],
    error: signedIn && ownerMatches ? state.error : null,
    reload,
    create,
    update,
    loadHistory,
  };
}

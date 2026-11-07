import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import type { Tables } from "@/integrations/supabase/types";
import {
  parseAuditionNotes,
  validateAuditionDraft,
  type AuditionDraft,
  type AuditionNotes,
  type AuditionStatus,
} from "@/lib/actor-audition-model";

type Row = Tables<"actor_auditions">;
type Result<T> = { value: T; error?: never } | { value?: never; error: string };
const columns =
  "id, user_id, project_id, title, role_name, due_date, status, notes, revision, created_at, updated_at";
const scopeError = "Account changed; reload Actor at Work before continuing.";
const schemaError = "Separate audition files are unavailable. The secured audition database may not be installed.";
export interface ActorAudition {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  roleName: string;
  dueDate: string | null;
  status: AuditionStatus;
  notes: AuditionNotes;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export function fromAuditionRow(row: Row): ActorAudition {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    roleName: row.role_name,
    dueDate: row.due_date,
    status: row.status,
    notes: parseAuditionNotes(row.notes),
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useActorAuditions() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  const scope = useRef({ id: userId, loading: sessionLoading });
  if (scope.current.id !== userId || scope.current.loading !== sessionLoading)
    scope.current = { id: userId, loading: sessionLoading };
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      scope.current = { id: undefined, loading: true };
    };
  }, []);

  const [state, setState] = useState<{
    owner: string | null;
    loaded: boolean;
    records: ActorAudition[];
    error: string | null;
  }>({ owner: null, loaded: false, records: [], error: null });

  const reload = useCallback(async () => {
    const startedFor = scope.current;
    if (sessionLoading) return;
    if (!userId) {
      setState({ owner: null, loaded: true, records: [], error: null });
      return;
    }
    setState({ owner: userId, loaded: false, records: [], error: null });
    try {
      const { data, error } = await supabase
        .from("actor_auditions")
        .select(columns)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      if (!mounted.current || scope.current !== startedFor) return;
      setState({
        owner: userId,
        loaded: true,
        records: ((data ?? []) as Row[])
          .filter((record) => record.user_id === userId)
          .map(fromAuditionRow),
        error: null,
      });
    } catch {
      if (!mounted.current || scope.current !== startedFor) return;
      setState({ owner: userId, loaded: true, records: [], error: schemaError });
    }
  }, [userId, sessionLoading]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(
    draft: AuditionDraft,
    ownedProjects: readonly string[],
  ): Promise<Result<ActorAudition>> {
    const invalid = validateAuditionDraft(draft, ownedProjects);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId) return { error: "Sign in to create a separate audition." };
    const startedFor = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_auditions")
        .insert({
          user_id: userId,
          project_id: draft.projectId,
          title: draft.title.trim(),
          role_name: draft.roleName,
          due_date: draft.dueDate,
          status: draft.status,
          notes: { ...draft.notes },
        })
        .select(columns)
        .single();
      if (error || !data) throw new Error(error?.message ?? "No audition save confirmation received.");
      if (!mounted.current || scope.current !== startedFor) return { error: scopeError };
      if (data.user_id !== userId || data.revision !== 1)
        return { error: "New audition ownership or revision was not verified." };
      const result = fromAuditionRow(data as Row);
      setState((current) =>
        current.owner === userId
          ? { ...current, records: [result, ...current.records.filter((r) => r.id !== result.id)] }
          : current,
      );
      return { value: result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Audition creation failed." };
    }
  }

  async function update(
    prior: ActorAudition,
    draft: AuditionDraft,
    ownedProjects: readonly string[],
  ): Promise<Result<ActorAudition>> {
    const invalid = validateAuditionDraft(draft, ownedProjects);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || prior.userId !== userId)
      return { error: "Only the audition owner can edit this record." };
    const startedFor = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_auditions")
        .update({
          title: draft.title.trim(),
          role_name: draft.roleName,
          project_id: draft.projectId,
          due_date: draft.dueDate,
          status: draft.status,
          notes: { ...draft.notes },
        })
        .eq("id", prior.id)
        .eq("user_id", userId)
        .eq("revision", prior.revision)
        .select(columns)
        .single();
      if (error || !data)
        throw new Error(
          "Save was not confirmed. This audition may have changed elsewhere; reload before retrying.",
        );
      if (!mounted.current || scope.current !== startedFor) return { error: scopeError };
      if (data.user_id !== userId || data.id !== prior.id || data.revision <= prior.revision)
        return { error: "Audition identity or version was not verified; reload." };
      const result = fromAuditionRow(data as Row);
      setState((current) =>
        current.owner === userId
          ? {
              ...current,
              records: current.records
                .map((record) => (record.id === result.id ? result : record))
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
            }
          : current,
      );
      return { value: result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Audition save failed." };
    }
  }

  const signedIn = !!userId;
  const correctOwner = state.owner === (userId ?? null);
  return {
    userId,
    signedIn,
    loaded: !sessionLoading && (!signedIn || (correctOwner && state.loaded)),
    error: signedIn && correctOwner ? state.error : null,
    records: !sessionLoading && signedIn && correctOwner ? state.records : [],
    reload,
    create,
    update,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { actorSupabase, type ActorWorkDatabase } from "@/lib/actor-work-supabase-types";
import { useSession } from "@/lib/session";
import {
  validateJournalDraft,
  type JournalContext,
  type JournalDraft,
  type JournalStatus,
} from "@/lib/actor-journal-model";

type JournalRow = {
  id: string;
  user_id: string;
  project_id: string;
  audition_id: string | null;
  rehearsal_id: string | null;
  title: string;
  body: string;
  status: string;
  revision: number;
  created_at: string;
  updated_at: string;
};
type RevisionRow = {
  entry_id: string;
  user_id: string;
  revision: number;
  title: string;
  body: string;
  status: string;
  created_at: string;
};
type JournalDatabase = Omit<ActorWorkDatabase, "public"> & {
  public: Omit<ActorWorkDatabase["public"], "Tables"> & {
    Tables: ActorWorkDatabase["public"]["Tables"] & {
      actor_journal_entries: {
        Row: JournalRow;
        Insert: Pick<JournalRow, "id" | "user_id" | "project_id" | "title" | "body"> & {
          audition_id?: string | null;
          rehearsal_id?: string | null;
        };
        Update: Pick<JournalRow, "title" | "body" | "status">;
        Relationships: [];
      };
      actor_journal_revisions: {
        Row: RevisionRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
  };
};
// A type-only view of the existing authenticated client; never a second identity or backend.
const supabase = actorSupabase as unknown as SupabaseClient<JournalDatabase>;
export interface ActorJournalEntry extends JournalDraft {
  id: string;
  userId: string;
  projectId: string;
  auditionId: string | null;
  rehearsalId: string | null;
  status: JournalStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export interface ActorJournalRevision extends JournalDraft {
  revision: number;
  status: JournalStatus;
  createdAt: string;
}
type Result<T> = { value: T; error?: never } | { value?: never; error: string };
const columns =
  "id,user_id,project_id,audition_id,rehearsal_id,title,body,status,revision,created_at,updated_at";
const changedAccount = "Your account or project changed. Reopen the journal before continuing.";
const mapRow = (row: JournalRow): ActorJournalEntry => ({
  id: row.id,
  userId: row.user_id,
  projectId: row.project_id,
  auditionId: row.audition_id,
  rehearsalId: row.rehearsal_id,
  title: row.title,
  body: row.body,
  status: row.status === "archived" ? "archived" : "active",
  revision: row.revision,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useActorJournal(projectId?: string) {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  const scope = useRef({ userId, projectId, sessionLoading });
  if (
    scope.current.userId !== userId ||
    scope.current.projectId !== projectId ||
    scope.current.sessionLoading !== sessionLoading
  )
    scope.current = { userId, projectId, sessionLoading };
  const active = useRef(true);
  const request = useRef(0);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [state, setState] = useState<{
    scope: typeof scope.current | null;
    loaded: boolean;
    entries: ActorJournalEntry[];
    error: string | null;
  }>({ scope: null, loaded: false, entries: [], error: null });

  const reload = useCallback(async () => {
    const startedFor = scope.current;
    const sequence = ++request.current;
    if (sessionLoading) return;
    setState({ scope: startedFor, loaded: !userId || !projectId, entries: [], error: null });
    if (!userId || !projectId) return;
    try {
      const { data, error } = await supabase
        .from("actor_journal_entries")
        .select(columns)
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      if (!active.current || scope.current !== startedFor || sequence !== request.current) return;
      setState({
        scope: startedFor,
        loaded: true,
        entries: (data ?? [])
          .filter((row) => row.user_id === userId && row.project_id === projectId)
          .map(mapRow),
        error: null,
      });
    } catch {
      if (!active.current || scope.current !== startedFor || sequence !== request.current) return;
      setState({
        scope: startedFor,
        loaded: true,
        entries: [],
        error: "Private journal storage is unavailable. Check the database deployment and retry.",
      });
    }
  }, [userId, projectId, sessionLoading]);
  useEffect(() => {
    void reload();
  }, [reload]);

  function remember(entry: ActorJournalEntry, startedFor: typeof scope.current) {
    setState((s) =>
      s.scope === startedFor
        ? {
            ...s,
            entries: [entry, ...s.entries.filter((prior) => prior.id !== entry.id)].sort((a, b) =>
              b.updatedAt.localeCompare(a.updatedAt),
            ),
          }
        : s,
    );
  }
  async function create(
    draft: JournalDraft,
    context: JournalContext = {},
    entryId: string = crypto.randomUUID(),
  ): Promise<Result<ActorJournalEntry>> {
    const invalid = validateJournalDraft(draft);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || !projectId)
      return { error: "Sign in and select a project before creating a journal entry." };
    const startedFor = scope.current;
    try {
      const payload = {
        id: entryId,
        user_id: userId,
        project_id: projectId,
        audition_id: context.auditionId ?? null,
        rehearsal_id: context.rehearsalId ?? null,
        title: draft.title.trim(),
        body: draft.body,
      };
      const response = await supabase
        .from("actor_journal_entries")
        .insert(payload)
        .select(columns)
        .single();
      let data = response.data;
      // A stable client-generated ID makes a retry after a lost acknowledgement safe.
      if (response.error?.code === "23505") {
        const confirmed = await supabase
          .from("actor_journal_entries")
          .select(columns)
          .eq("id", entryId)
          .eq("user_id", userId)
          .eq("project_id", projectId)
          .single();
        if (confirmed.error) throw new Error(confirmed.error.message);
        data = confirmed.data;
      } else if (response.error) throw new Error(response.error.message);
      if (!active.current || scope.current !== startedFor) return { error: changedAccount };
      if (
        !data ||
        data.id !== entryId ||
        data.user_id !== userId ||
        data.project_id !== projectId ||
        data.title !== payload.title ||
        data.body !== payload.body ||
        data.audition_id !== payload.audition_id ||
        data.rehearsal_id !== payload.rehearsal_id ||
        data.status !== "active" ||
        !Number.isInteger(data.revision) ||
        data.revision < 1
      )
        return { error: "Journal creation could not be verified. Keep your draft and reload." };
      const entry = mapRow(data);
      remember(entry, startedFor);
      return { value: entry };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Journal creation failed." };
    }
  }

  async function update(
    prior: ActorJournalEntry,
    draft: JournalDraft,
    status: JournalStatus = prior.status,
  ): Promise<Result<ActorJournalEntry>> {
    const invalid = validateJournalDraft(draft);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || prior.userId !== userId || prior.projectId !== projectId)
      return { error: "Reopen this journal with its owner account and project." };
    const startedFor = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_journal_entries")
        .update({ title: draft.title.trim(), body: draft.body, status })
        .eq("id", prior.id)
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("revision", prior.revision)
        .select(columns)
        .single();
      if (!active.current || scope.current !== startedFor) return { error: changedAccount };
      if (error || !data)
        return {
          error:
            "Save was not confirmed. The entry may have changed elsewhere. Keep your draft and reload before retrying.",
        };
      if (
        data.id !== prior.id ||
        data.user_id !== userId ||
        data.project_id !== projectId ||
        data.revision <= prior.revision ||
        data.title !== draft.title.trim() ||
        data.body !== draft.body ||
        data.status !== status ||
        data.audition_id !== prior.auditionId ||
        data.rehearsal_id !== prior.rehearsalId
      )
        return { error: "Journal version or ownership could not be verified." };
      const entry = mapRow(data);
      remember(entry, startedFor);
      return { value: entry };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Journal save failed." };
    }
  }

  async function loadHistory(prior: ActorJournalEntry): Promise<Result<ActorJournalRevision[]>> {
    if (sessionLoading || !userId || prior.userId !== userId || prior.projectId !== projectId)
      return { error: "Reopen this journal with its owner account and project." };
    const startedFor = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_journal_revisions")
        .select("entry_id,user_id,revision,title,body,status,created_at")
        .eq("user_id", userId)
        .eq("entry_id", prior.id)
        .order("revision", { ascending: false });
      if (!active.current || scope.current !== startedFor) return { error: changedAccount };
      if (error) throw new Error(error.message);
      return {
        value: (data ?? [])
          .filter((row) => row.user_id === userId && row.entry_id === prior.id)
          .map((row) => ({
            revision: row.revision,
            title: row.title,
            body: row.body,
            status: row.status === "archived" ? "archived" : "active",
            createdAt: row.created_at,
          })),
      };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Journal history is unavailable." };
    }
  }
  const matches = state.scope === scope.current && !sessionLoading;
  return {
    userId,
    signedIn: !!userId,
    loaded: !sessionLoading && (!userId || !projectId || (matches && state.loaded)),
    entries: matches ? state.entries : [],
    error: matches ? state.error : null,
    reload,
    create,
    update,
    loadHistory,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  actorSupabase,
  type ActorRow,
  type ActorWorkDatabase,
} from "@/lib/actor-work-supabase-types";
import { useSession } from "@/lib/session";
import {
  MAX_SOURCE_FILE_BYTES,
  scriptSourceSha256,
  type PreparedScriptSource,
  type ScriptSourceKind,
} from "@/lib/actor-script-import";
import {
  parseSideAnnotations,
  validateSideAnnotations,
  validateSideDraft,
  type SideAnnotation,
  type SideDraft,
  type SideTarget,
} from "@/lib/actor-sides-model";

type SourceRow = {
  source_group_id?: string;
  source_version?: number;
  previous_side_id?: string | null;
  source_kind?: ScriptSourceKind;
  source_name?: string | null;
  source_sha256?: string | null;
  source_file_path?: string | null;
};
type Row = ActorRow<"actor_sides"> & SourceRow;
// Keep the reviewed migration extension local until generated production types catch up.
type SideTable = ActorWorkDatabase["public"]["Tables"]["actor_sides"];
type SourceDatabase = Omit<ActorWorkDatabase, "public"> & {
  public: Omit<ActorWorkDatabase["public"], "Tables"> & {
    Tables: Omit<ActorWorkDatabase["public"]["Tables"], "actor_sides"> & {
      actor_sides: Omit<SideTable, "Row" | "Insert"> & {
        Row: Row;
        Insert: SideTable["Insert"] & SourceRow;
      };
    };
  };
};
const supabase = actorSupabase as unknown as SupabaseClient<SourceDatabase>;
type Result<T> = { value: T; error?: never } | { value?: never; error: string };
const columns =
  "id, user_id, project_id, audition_id, title, content, annotations, revision, created_at, updated_at, source_group_id, source_version, previous_side_id, source_kind, source_name, source_sha256, source_file_path";
const accountChanged = "Your account changed; reload before continuing.";
const unavailable =
  "Private script sides could not be loaded. The reviewed side database may not be installed.";
export interface ActorSide {
  id: string;
  userId: string;
  title: string;
  content: string;
  target: SideTarget;
  annotations: SideAnnotation[];
  revision: number;
  createdAt: string;
  updatedAt: string;
  sourceGroupId?: string;
  sourceVersion?: number;
  previousSideId?: string | null;
  sourceKind?: ScriptSourceKind;
  sourceName?: string | null;
  sourceSha256?: string | null;
  sourceFilePath?: string | null;
}
export interface CreateSideOptions {
  source?: PreparedScriptSource;
  previous?: ActorSide;
}
function parseSide(row: Row): ActorSide | null {
  const target: SideTarget | null =
    row.project_id && !row.audition_id
      ? { kind: "project", id: row.project_id }
      : row.audition_id && !row.project_id
        ? { kind: "audition", id: row.audition_id }
        : null;
  if (!target) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    target,
    annotations: parseSideAnnotations(row.annotations, row.content),
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceGroupId: row.source_group_id ?? row.id,
    sourceVersion: row.source_version ?? 1,
    previousSideId: row.previous_side_id ?? null,
    sourceKind: row.source_kind ?? "legacy_text",
    sourceName: row.source_name ?? null,
    sourceSha256: row.source_sha256 ?? null,
    sourceFilePath: row.source_file_path ?? null,
  };
}

export function useActorSides() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  const createAttempts = useRef(new Map<string, { id: string; uploadedPath: string | null }>());
  useEffect(() => {
    createAttempts.current.clear();
  }, [userId]);
  const scope = useRef({ id: userId, loading: sessionLoading });
  if (scope.current.id !== userId || scope.current.loading !== sessionLoading)
    scope.current = { id: userId, loading: sessionLoading };
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      scope.current = { id: undefined, loading: true };
    };
  }, []);
  const [state, setState] = useState<{
    owner: string | null;
    loaded: boolean;
    sides: ActorSide[];
    error: string | null;
  }>({ owner: null, loaded: false, sides: [], error: null });

  const reload = useCallback(async () => {
    const token = scope.current;
    if (sessionLoading) return;
    if (!userId) {
      setState({ owner: null, loaded: true, sides: [], error: null });
      return;
    }
    setState({ owner: userId, loaded: false, sides: [], error: null });
    try {
      const { data, error } = await supabase
        .from("actor_sides")
        .select(columns)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      if (!alive.current || scope.current !== token) return;
      const sides = ((data ?? []) as Row[])
        .filter((row) => row.user_id === userId)
        .map(parseSide)
        .filter((side): side is ActorSide => !!side);
      setState({ owner: userId, loaded: true, sides, error: null });
    } catch {
      if (!alive.current || scope.current !== token) return;
      setState({ owner: userId, loaded: true, sides: [], error: unavailable });
    }
  }, [userId, sessionLoading]);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(
    draft: SideDraft,
    ownedProjects: readonly string[],
    ownedAuditions: readonly string[],
    options?: CreateSideOptions,
  ): Promise<Result<ActorSide>> {
    const invalid = validateSideDraft(draft, ownedProjects, ownedAuditions);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || !draft.target)
      return { error: "Sign in to save original sides to your private account." };
    const previous = options?.previous;
    if (
      previous &&
      (previous.userId !== userId ||
        previous.target.kind !== draft.target.kind ||
        previous.target.id !== draft.target.id)
    )
      return { error: "A source version must keep the same owner and project or audition." };
    const source = options?.source;
    if (
      source &&
      (!source.file.size ||
        source.file.size > MAX_SOURCE_FILE_BYTES ||
        !/^[a-f0-9]{64}$/.test(source.sha256))
    )
      return { error: "The original source file could not be verified. Import it again." };
    const token = scope.current;
    const attemptKey = JSON.stringify([
      userId,
      draft.title.trim(),
      draft.content,
      draft.target,
      previous?.id,
      source?.sha256,
      source?.kind,
      source?.name,
    ]);
    let attempt = createAttempts.current.get(attemptKey);
    if (!attempt) {
      attempt = { id: crypto.randomUUID(), uploadedPath: null };
      createAttempts.current.set(attemptKey, attempt);
    }
    let uploadedPath: string | null = attempt.uploadedPath;
    let insertConfirmed = false;
    try {
      if (source && !uploadedPath) {
        const safeName =
          source.name
            .normalize("NFKC")
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .slice(-120) || `source.${source.kind}`;
        const path = `${userId}/${attempt.id}/${safeName}`;
        let uploaded = false;
        try {
          const response = await supabase.storage
            .from("actor-script-sources")
            .upload(path, source.file, {
              upsert: false,
              contentType:
                source.kind === "pdf"
                  ? "application/pdf"
                  : source.kind === "docx"
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "text/plain",
            });
          uploaded = !response.error && response.data?.path === path;
        } catch {
          /* Reconcile an upload whose response was lost. */
        }
        if (!uploaded) {
          const existing = await supabase.storage.from("actor-script-sources").download(path);
          uploaded =
            !existing.error &&
            !!existing.data &&
            existing.data.size === source.file.size &&
            (await scriptSourceSha256(existing.data)) === source.sha256;
        }
        if (!uploaded)
          throw new Error(
            "Private source upload was not confirmed. Your preview is retained; retry saving.",
          );
        uploadedPath = path;
        attempt.uploadedPath = path;
        if (!alive.current || scope.current !== token) throw new Error(accountChanged);
      }
      const sourceFields = {
        ...(previous ? { previous_side_id: previous.id, source_kind: "paste" as const } : {}),
        ...(source
          ? {
              source_kind: source.kind,
              source_name: source.name,
              source_sha256: source.sha256,
              source_file_path: uploadedPath,
            }
          : {}),
      };
      const payload = {
        id: attempt.id,
        user_id: userId,
        project_id: draft.target.kind === "project" ? draft.target.id : null,
        audition_id: draft.target.kind === "audition" ? draft.target.id : null,
        title: draft.title.trim(),
        content: draft.content,
        annotations: [],
        ...sourceFields,
      };
      let saved: Row | null = null;
      let writeError = "Side creation was not confirmed.";
      try {
        const response = await supabase
          .from("actor_sides")
          .insert(payload)
          .select(columns)
          .single();
        saved = response.data as unknown as Row | null;
        if (response.error) {
          writeError = response.error.message;
        }
      } catch (cause) {
        if (cause instanceof Error) writeError = cause.message;
      }
      if (!saved) {
        // A lost response can hide a successful commit. Recover by the stable request ID
        // before retrying. The browser never removes private original files.
        const recovery = await supabase
          .from("actor_sides")
          .select(columns)
          .eq("user_id", userId)
          .eq("id", attempt.id)
          .maybeSingle();
        if (recovery.error)
          throw new Error(
            "Save confirmation is unavailable. Your preview and private original are retained. Retry to recover this same side.",
          );
        saved = recovery.data as unknown as Row | null;
        if (!saved) {
          throw new Error(writeError);
        }
      }
      insertConfirmed = true;
      if (!alive.current || scope.current !== token) return { error: accountChanged };
      if (
        saved.id !== attempt.id ||
        saved.user_id !== userId ||
        saved.revision < 1 ||
        saved.content !== draft.content
      )
        return { error: "The saved side owner or first revision was not verified." };
      const side = parseSide(saved);
      if (!side || side.target.id !== draft.target.id || side.target.kind !== draft.target.kind)
        return { error: "The side's target was not confirmed by the server." };
      if (
        !previous &&
        (side.sourceGroupId !== side.id || side.sourceVersion !== 1 || side.previousSideId !== null)
      )
        return { error: "The first immutable source version was not confirmed by the server." };
      if (
        previous &&
        (side.previousSideId !== previous.id ||
          side.sourceGroupId !== (previous.sourceGroupId ?? previous.id) ||
          side.sourceVersion !== (previous.sourceVersion ?? 1) + 1)
      )
        return { error: "The server did not confirm this source version. Reload before retrying." };
      if (
        source &&
        (side.sourceFilePath !== uploadedPath ||
          side.sourceSha256 !== source.sha256 ||
          side.sourceName !== source.name ||
          side.sourceKind !== source.kind)
      )
        return { error: "The private source reference was not confirmed. Reload before retrying." };
      setState((s) =>
        s.owner === userId
          ? {
              ...s,
              sides: [side, ...s.sides.filter((old) => old.id !== side.id)],
            }
          : s,
      );
      return { value: side };
    } catch (cause) {
      let message = cause instanceof Error ? cause.message : "Side creation failed.";
      if (message.includes("duplicate key") || message.includes("source version"))
        message =
          "A new source version was saved elsewhere. Reload, review that version and try again; your draft is retained.";
      // A timed-out INSERT may still commit after readback. Originals are never
      // deleted from the browser; retain the stable private path for safe retry.
      if (uploadedPath && !insertConfirmed)
        message +=
          " The original remains private in your account for retry; account deletion removes retained originals.";
      return { error: message };
    }
  }

  async function annotate(
    prior: ActorSide,
    annotations: SideAnnotation[],
  ): Promise<Result<ActorSide>> {
    const invalid = validateSideAnnotations(annotations, prior.content);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || prior.userId !== userId)
      return { error: "Only the side owner can edit their beat annotations." };
    const token = scope.current;
    try {
      // Neither client nor SQL update changes source text or parent link.
      // Revision predicate prevents silent multi-device overwrite.
      const { data, error } = await supabase
        .from("actor_sides")
        .update({ annotations: annotations.map((annotation) => ({ ...annotation })) })
        .eq("id", prior.id)
        .eq("user_id", userId)
        .eq("revision", prior.revision)
        .select(columns)
        .single();
      if (error || !data)
        throw new Error(
          "Annotation save was not confirmed. The side may have changed elsewhere; reload.",
        );
      if (!alive.current || scope.current !== token) return { error: accountChanged };
      const saved = data as unknown as Row;
      if (
        saved.user_id !== userId ||
        saved.id !== prior.id ||
        saved.content !== prior.content ||
        saved.revision <= prior.revision ||
        saved.project_id !== (prior.target.kind === "project" ? prior.target.id : null) ||
        saved.audition_id !== (prior.target.kind === "audition" ? prior.target.id : null)
      )
        return { error: "The server did not verify the original side and its new revision." };
      const side = parseSide(saved);
      if (!side) return { error: "Saved annotation target could not be confirmed." };
      if (
        side.sourceGroupId !== (prior.sourceGroupId ?? prior.id) ||
        side.sourceVersion !== (prior.sourceVersion ?? 1) ||
        side.previousSideId !== (prior.previousSideId ?? null) ||
        side.sourceKind !== (prior.sourceKind ?? "legacy_text") ||
        side.sourceName !== (prior.sourceName ?? null) ||
        side.sourceFilePath !== (prior.sourceFilePath ?? null) ||
        side.sourceSha256 !== (prior.sourceSha256 ?? null)
      )
        return { error: "The server changed immutable source metadata. Reload before continuing." };
      setState((s) =>
        s.owner === userId
          ? { ...s, sides: s.sides.map((item) => (item.id === side.id ? side : item)) }
          : s,
      );
      return { value: side };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Annotation save failed." };
    }
  }
  const signedIn = !!userId;
  const currentOwner = state.owner === (userId ?? null);
  return {
    userId,
    signedIn,
    loaded: !sessionLoading && (!signedIn || (currentOwner && state.loaded)),
    error: signedIn && currentOwner ? state.error : null,
    sides: !sessionLoading && signedIn && currentOwner ? state.sides : [],
    reload,
    create,
    annotate,
  };
}

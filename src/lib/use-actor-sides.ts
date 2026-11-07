import { useCallback, useEffect, useRef, useState } from "react";
import { actorSupabase as supabase, type ActorRow } from "@/lib/actor-work-supabase-types";
import { useSession } from "@/lib/session";
import {
  parseSideAnnotations,
  validateSideAnnotations,
  validateSideDraft,
  type SideAnnotation,
  type SideDraft,
  type SideTarget,
} from "@/lib/actor-sides-model";

type Row = ActorRow<"actor_sides">;
type Result<T> = { value: T; error?: never } | { value?: never; error: string };
const columns =
  "id, user_id, project_id, audition_id, title, content, annotations, revision, created_at, updated_at";
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
  };
}

export function useActorSides() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
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
  ): Promise<Result<ActorSide>> {
    const invalid = validateSideDraft(draft, ownedProjects, ownedAuditions);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || !draft.target)
      return { error: "Sign in to save original sides to your private account." };
    const token = scope.current;
    try {
      const { data, error } = await supabase
        .from("actor_sides")
        .insert({
          user_id: userId,
          project_id: draft.target.kind === "project" ? draft.target.id : null,
          audition_id: draft.target.kind === "audition" ? draft.target.id : null,
          title: draft.title.trim(),
          content: draft.content,
          annotations: [],
        })
        .select(columns)
        .single();
      if (error || !data) throw new Error(error?.message ?? "Side creation was not confirmed.");
      if (!alive.current || scope.current !== token) return { error: accountChanged };
      if (data.user_id !== userId || data.revision !== 1)
        return { error: "The saved side owner or first revision was not verified." };
      const side = parseSide(data as Row);
      if (!side || side.target.id !== draft.target.id || side.target.kind !== draft.target.kind)
        return { error: "The side's target was not confirmed by the server." };
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
      return { error: cause instanceof Error ? cause.message : "Side creation failed." };
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
      if (
        data.user_id !== userId ||
        data.id !== prior.id ||
        data.content !== prior.content ||
        data.revision <= prior.revision ||
        data.project_id !== (prior.target.kind === "project" ? prior.target.id : null) ||
        data.audition_id !== (prior.target.kind === "audition" ? prior.target.id : null)
      )
        return { error: "The server did not verify the original side and its new revision." };
      const side = parseSide(data as Row);
      if (!side) return { error: "Saved annotation target could not be confirmed." };
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

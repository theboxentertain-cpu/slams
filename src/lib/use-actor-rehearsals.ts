import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import {
  rehearsalSupabase as supabase,
  type SceneRow,
  type RehearsalRow,
} from "@/lib/actor-rehearsal-supabase-types";
import type { ActorSide } from "@/lib/use-actor-sides";
import {
  isWorkId,
  parseRehearsalContext,
  parseRehearsalTakes,
  REHEARSAL_PHASES,
  validateRehearsalDraft,
  validateSceneDraft,
  type ActorWorkScene,
  type ActorWorkRehearsal,
  type RehearsalDraft,
  type SceneDraft,
  type WorkReturn,
  type RehearsalPhase,
  type RehearsalContext,
} from "@/lib/actor-rehearsal-model";
type Result<T> = { value: T; error?: never } | { value?: never; error: string };
const sceneColumns =
  "id,user_id,project_id,audition_id,side_id,title,objective,circumstances,revision,created_at,updated_at";
const sessionColumns =
  "id,user_id,scene_id,side_id,context,phase,takes,reflection,status,revision,created_at,updated_at";
const changedAccount = "Your account changed. Reload before continuing.";
export function fromSceneRow(row: SceneRow): ActorWorkScene | null {
  if (
    !isWorkId(row.id) ||
    !isWorkId(row.side_id) ||
    !(row.project_id || row.audition_id) ||
    validateSceneDraft(row)
  )
    return null;
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    auditionId: row.audition_id,
    sideId: row.side_id,
    title: row.title,
    objective: row.objective,
    circumstances: row.circumstances,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function fromRehearsalRow(row: RehearsalRow): ActorWorkRehearsal | null {
  const context = parseRehearsalContext(row.context);
  const takes = parseRehearsalTakes(row.takes);
  if (
    !context ||
    !takes ||
    !isWorkId(row.id) ||
    !isWorkId(row.scene_id) ||
    !isWorkId(row.side_id) ||
    !REHEARSAL_PHASES.includes(row.phase as RehearsalPhase) ||
    (row.status !== "draft" && row.status !== "completed")
  )
    return null;
  const draft = { phase: row.phase as RehearsalPhase, takes, reflection: row.reflection };
  if (validateRehearsalDraft(draft, row.status === "completed")) return null;
  return {
    ...draft,
    context,
    id: row.id,
    userId: row.user_id,
    sceneId: row.scene_id,
    sideId: row.side_id,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function sideMatchesScene(
  side: ActorSide,
  scene: Pick<ActorWorkScene, "sideId" | "projectId" | "auditionId">,
): boolean {
  return (
    side.id === scene.sideId &&
    (side.target.kind === "project"
      ? side.target.id === scene.projectId
      : side.target.id === scene.auditionId)
  );
}

export function useActorRehearsals() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;
  // Keep an uncertain insert's identity until confirmed. Retrying the same
  // immutable payload then recovers its row instead of creating a duplicate.
  const pendingScenes = useRef(new Map<string, string>());
  const pendingSessions = useRef(new Map<string, string>());
  const pendingOwner = useRef(userId);
  if (pendingOwner.current !== userId) {
    pendingScenes.current.clear();
    pendingSessions.current.clear();
    pendingOwner.current = userId;
  }
  const scope = useRef({ id: userId, loading: sessionLoading });
  if (scope.current.id !== userId || scope.current.loading !== sessionLoading)
    scope.current = { id: userId, loading: sessionLoading };
  const alive = useRef(true);
  const generation = useRef(0);
  useEffect(() => {
    alive.current = true;
    const sceneAttempts = pendingScenes.current;
    const sessionAttempts = pendingSessions.current;
    return () => {
      alive.current = false;
      scope.current = { id: undefined, loading: true };
      sceneAttempts.clear();
      sessionAttempts.clear();
    };
  }, []);
  const [state, setState] = useState<{
    owner: string | null;
    loaded: boolean;
    scenes: ActorWorkScene[];
    sessions: ActorWorkRehearsal[];
    error: string | null;
  }>({ owner: null, loaded: false, scenes: [], sessions: [], error: null });
  const reload = useCallback(async () => {
    const token = scope.current;
    const request = ++generation.current;
    if (sessionLoading) return;
    if (!userId) {
      setState({ owner: null, loaded: true, scenes: [], sessions: [], error: null });
      return;
    }
    setState({ owner: userId, loaded: false, scenes: [], sessions: [], error: null });
    try {
      const [scenes, sessions] = await Promise.all([
        supabase
          .from("actor_work_scenes")
          .select(sceneColumns)
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("actor_work_rehearsals")
          .select(sessionColumns)
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
      ]);
      if (scenes.error || sessions.error) throw new Error("Load failed");
      if (!alive.current || scope.current !== token || generation.current !== request) return;
      setState({
        owner: userId,
        loaded: true,
        error: null,
        scenes: (scenes.data ?? [])
          .filter((row) => row.user_id === userId)
          .map(fromSceneRow)
          .filter((scene): scene is ActorWorkScene => !!scene),
        sessions: (sessions.data ?? [])
          .filter((row) => row.user_id === userId)
          .map(fromRehearsalRow)
          .filter((session): session is ActorWorkRehearsal => !!session),
      });
    } catch {
      if (alive.current && scope.current === token && generation.current === request)
        setState({
          owner: userId,
          loaded: true,
          scenes: [],
          sessions: [],
          error:
            "Private scenes and rehearsals could not be loaded. Check the secure database installation and retry.",
        });
    }
  }, [sessionLoading, userId]);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function createScene(
    draft: SceneDraft,
    side: ActorSide,
    projectId: string | null,
    auditionId: string | null,
  ): Promise<Result<ActorWorkScene>> {
    const invalid = validateSceneDraft(draft);
    if (invalid) return { error: invalid };
    if (
      sessionLoading ||
      !userId ||
      side.userId !== userId ||
      !sideMatchesScene(side, { sideId: side.id, projectId, auditionId })
    )
      return { error: "Choose an owned script side in this project or audition." };
    const token = scope.current;
    const payload = {
      user_id: userId,
      side_id: side.id,
      project_id: projectId,
      audition_id: auditionId,
      title: draft.title.trim(),
      objective: draft.objective,
      circumstances: draft.circumstances,
    };
    const key = JSON.stringify(payload);
    const id = pendingScenes.current.get(key) ?? crypto.randomUUID();
    pendingScenes.current.set(key, id);
    try {
      let data: SceneRow | null = null;
      try {
        const inserted = await supabase
          .from("actor_work_scenes")
          .insert({ id, ...payload })
          .select(sceneColumns)
          .single();
        if (!inserted.error) data = inserted.data;
      } catch {
        /* A dropped response can follow a committed insert. Read back its ID. */
      }
      if (!alive.current || scope.current !== token) return { error: changedAccount };
      if (!data) {
        const recovered = await supabase
          .from("actor_work_scenes")
          .select(sceneColumns)
          .eq("user_id", userId)
          .eq("id", id)
          .maybeSingle();
        if (!recovered.error) data = recovered.data;
      }
      if (!alive.current || scope.current !== token) return { error: changedAccount };
      if (!data)
        throw new Error(
          "Scene save was not confirmed. Your preparation remains here. Retry to recover the same scene.",
        );
      const scene = fromSceneRow(data);
      if (
        !scene ||
        scene.id !== id ||
        scene.userId !== userId ||
        scene.revision !== 1 ||
        scene.sideId !== side.id ||
        scene.projectId !== projectId ||
        scene.auditionId !== auditionId ||
        scene.title !== payload.title ||
        scene.objective !== draft.objective ||
        scene.circumstances !== draft.circumstances
      )
        throw new Error("The saved scene and its source were not verified.");
      pendingScenes.current.delete(key);
      setState((s) =>
        s.owner === userId
          ? { ...s, scenes: [scene, ...s.scenes.filter((old) => old.id !== scene.id)] }
          : s,
      );
      return { value: scene };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Scene save failed." };
    }
  }
  async function start(
    scene: ActorWorkScene,
    side: ActorSide,
    returnTo: WorkReturn,
  ): Promise<Result<ActorWorkRehearsal>> {
    if (
      sessionLoading ||
      !userId ||
      scene.userId !== userId ||
      side.userId !== userId ||
      !sideMatchesScene(side, scene)
    )
      return { error: "The scene and its private source must belong to the current account." };
    const token = scope.current;
    const version =
      "sourceVersion" in side && typeof side.sourceVersion === "number" ? side.sourceVersion : 1;
    const sourceKind =
      "sourceKind" in side && typeof side.sourceKind === "string" ? side.sourceKind : "legacy_text";
    const context: RehearsalContext = {
      project_id: scene.projectId,
      audition_id: scene.auditionId,
      source_version: version,
      source_title: side.title,
      source_kind: sourceKind,
      scene_title: scene.title,
      objective: scene.objective,
      circumstances: scene.circumstances,
      return_to: returnTo,
    };
    const key = JSON.stringify({ userId, sceneId: scene.id, sideId: side.id, context });
    const id = pendingSessions.current.get(key) ?? crypto.randomUUID();
    pendingSessions.current.set(key, id);
    try {
      let data: RehearsalRow | null = null;
      try {
        const inserted = await supabase
          .from("actor_work_rehearsals")
          .insert({
            id,
            user_id: userId,
            scene_id: scene.id,
            side_id: side.id,
            context: { ...context },
            phase: "prepare",
            takes: [],
            reflection: "",
            status: "draft",
          })
          .select(sessionColumns)
          .single();
        if (!inserted.error) data = inserted.data;
      } catch {
        /* Recover a possibly committed draft by the same identity. */
      }
      if (!alive.current || scope.current !== token) return { error: changedAccount };
      if (!data) {
        const recovered = await supabase
          .from("actor_work_rehearsals")
          .select(sessionColumns)
          .eq("user_id", userId)
          .eq("id", id)
          .maybeSingle();
        if (!recovered.error) data = recovered.data;
      }
      if (!alive.current || scope.current !== token) return { error: changedAccount };
      if (!data)
        throw new Error(
          "Draft creation was not confirmed. Retry to recover the same draft before rehearsing.",
        );
      const saved = fromRehearsalRow(data);
      if (
        !saved ||
        saved.id !== id ||
        saved.userId !== userId ||
        saved.sceneId !== scene.id ||
        saved.sideId !== side.id ||
        saved.revision !== 1 ||
        saved.status !== "draft" ||
        JSON.stringify(saved.context) !== JSON.stringify(context)
      )
        throw new Error("The server did not confirm the pinned rehearsal context.");
      pendingSessions.current.delete(key);
      setState((s) =>
        s.owner === userId
          ? { ...s, sessions: [saved, ...s.sessions.filter((old) => old.id !== saved.id)] }
          : s,
      );
      return { value: saved };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Draft creation failed." };
    }
  }
  async function save(
    prior: ActorWorkRehearsal,
    draft: RehearsalDraft,
    complete = false,
  ): Promise<Result<ActorWorkRehearsal>> {
    const invalid = validateRehearsalDraft(draft, complete);
    if (invalid) return { error: invalid };
    if (sessionLoading || !userId || prior.userId !== userId || prior.status !== "draft")
      return { error: "Only your own draft rehearsal can be changed." };
    const token = scope.current;
    try {
      const result = await supabase
        .from("actor_work_rehearsals")
        .update({
          phase: draft.phase,
          takes: draft.takes.map((take) => ({ ...take })),
          reflection: draft.reflection,
          status: complete ? "completed" : "draft",
        })
        .eq("user_id", userId)
        .eq("id", prior.id)
        .eq("revision", prior.revision)
        .eq("status", "draft")
        .select(sessionColumns)
        .single();
      if (result.error || !result.data)
        throw new Error(
          "Save was not confirmed. Keep your notes here; reload in another tab to check for a newer version.",
        );
      if (!alive.current || scope.current !== token) return { error: changedAccount };
      const saved = fromRehearsalRow(result.data);
      if (
        !saved ||
        saved.id !== prior.id ||
        saved.userId !== userId ||
        saved.sceneId !== prior.sceneId ||
        saved.sideId !== prior.sideId ||
        saved.revision <= prior.revision ||
        JSON.stringify(saved.context) !== JSON.stringify(prior.context) ||
        saved.phase !== draft.phase ||
        saved.reflection !== draft.reflection ||
        JSON.stringify(saved.takes) !== JSON.stringify(draft.takes) ||
        saved.status !== (complete ? "completed" : "draft")
      )
        throw new Error("The saved revision and original context were not verified.");
      setState((s) =>
        s.owner === userId
          ? { ...s, sessions: s.sessions.map((old) => (old.id === saved.id ? saved : old)) }
          : s,
      );
      return { value: saved };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : "Rehearsal save failed." };
    }
  }
  const current = state.owner === (userId ?? null);
  return {
    userId,
    signedIn: !!userId,
    loaded: !sessionLoading && (!userId || (current && state.loaded)),
    error: current && userId ? state.error : null,
    scenes: !sessionLoading && current && userId ? state.scenes : [],
    sessions: !sessionLoading && current && userId ? state.sessions : [],
    reload,
    createScene,
    start,
    save,
  };
}

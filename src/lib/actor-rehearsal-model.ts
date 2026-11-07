import { validateTab } from "@/lib/foundation";

export const isWorkId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const RETURN_TARGETS = ["project", "character", "breakdown", "audition"] as const;
export type WorkReturn = (typeof RETURN_TARGETS)[number];
export const REHEARSAL_PHASES = ["prepare", "take", "direction", "reflect"] as const;
export type RehearsalPhase = (typeof REHEARSAL_PHASES)[number];
export type RehearsalSearch = ReturnType<typeof validateRehearsalSearch>;
export function validateRehearsalSearch(input: Record<string, unknown>) {
  return {
    ...validateTab("rehearsal", input),
    projectId: isWorkId(input["projectId"]) ? input["projectId"] : undefined,
    auditionId: isWorkId(input["auditionId"]) ? input["auditionId"] : undefined,
    sideId: isWorkId(input["sideId"]) ? input["sideId"] : undefined,
    sceneId: isWorkId(input["sceneId"]) ? input["sceneId"] : undefined,
    sessionId: isWorkId(input["sessionId"]) ? input["sessionId"] : undefined,
    returnTo: RETURN_TARGETS.includes(input["returnTo"] as WorkReturn)
      ? (input["returnTo"] as WorkReturn)
      : undefined,
  };
}
export interface SceneDraft {
  title: string;
  objective: string;
  circumstances: string;
}
export interface ActorWorkScene extends SceneDraft {
  id: string;
  userId: string;
  projectId: string | null;
  auditionId: string | null;
  sideId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export interface RehearsalContext {
  project_id: string | null;
  audition_id: string | null;
  source_version: number;
  source_title: string;
  source_kind: string;
  scene_title: string;
  objective: string;
  circumstances: string;
  return_to: WorkReturn;
}
export interface RehearsalTake {
  id: string;
  action: string;
  observation: string;
  direction: string;
}
export interface RehearsalDraft {
  phase: RehearsalPhase;
  takes: RehearsalTake[];
  reflection: string;
}
export interface ActorWorkRehearsal extends RehearsalDraft {
  id: string;
  userId: string;
  sceneId: string;
  sideId: string;
  context: RehearsalContext;
  status: "draft" | "completed";
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export function validateSceneDraft(draft: SceneDraft): string | null {
  if (!draft.title.trim() || draft.title.length > 120)
    return "A scene title of up to 120 characters is required.";
  if (draft.objective.length > 1500 || draft.circumstances.length > 1500)
    return "Keep each preparation note within 1,500 characters.";
  return null;
}
export function validateRehearsalDraft(draft: RehearsalDraft, complete = false): string | null {
  if (!REHEARSAL_PHASES.includes(draft.phase)) return "Choose a rehearsal phase.";
  if (
    draft.takes.length > 12 ||
    new Set(draft.takes.map((take) => take.id)).size !== draft.takes.length
  )
    return "Use up to 12 distinct takes.";
  if (
    draft.takes.some(
      (take) =>
        !isWorkId(take.id) ||
        [take.action, take.observation, take.direction].some(
          (text) => typeof text !== "string" || text.length > 1500,
        ),
    )
  )
    return "Each take needs a valid identity and notes within 1,500 characters.";
  if (typeof draft.reflection !== "string" || draft.reflection.length > 3000)
    return "Keep the reflection within 3,000 characters.";
  if (
    complete &&
    (draft.takes.length < 2 ||
      draft.takes.some((take) => !take.action.trim() || !take.observation.trim()) ||
      draft.reflection.trim().length < 3)
  )
    return "Complete at least two takes with a chosen action and your observed notes, then add a reflection of at least three characters.";
  return null;
}
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export function parseRehearsalContext(value: unknown): RehearsalContext | null {
  const input = object(value);
  if (
    !input ||
    !(input["project_id"] === null || isWorkId(input["project_id"])) ||
    !(input["audition_id"] === null || isWorkId(input["audition_id"])) ||
    (!input["project_id"] && !input["audition_id"]) ||
    !Number.isInteger(input["source_version"]) ||
    Number(input["source_version"]) < 1 ||
    !RETURN_TARGETS.includes(input["return_to"] as WorkReturn)
  )
    return null;
  for (const key of ["source_title", "scene_title", "objective", "circumstances"]) {
    if (typeof input[key] !== "string" || input[key].length > (key.endsWith("title") ? 120 : 1500))
      return null;
  }
  if (
    typeof input["source_kind"] !== "string" ||
    !["legacy_text", "paste", "txt", "pdf", "docx"].includes(input["source_kind"])
  )
    return null;
  return {
    project_id: input["project_id"] as string | null,
    audition_id: input["audition_id"] as string | null,
    source_version: input["source_version"] as number,
    source_title: input["source_title"] as string,
    source_kind: input["source_kind"],
    scene_title: input["scene_title"] as string,
    objective: input["objective"] as string,
    circumstances: input["circumstances"] as string,
    return_to: input["return_to"] as WorkReturn,
  };
}
export function parseRehearsalTakes(value: unknown): RehearsalTake[] | null {
  if (!Array.isArray(value)) return null;
  const takes: RehearsalTake[] = [];
  for (const entry of value) {
    const take = object(entry);
    if (
      !take ||
      !isWorkId(take["id"]) ||
      typeof take["action"] !== "string" ||
      typeof take["observation"] !== "string" ||
      typeof take["direction"] !== "string"
    )
      return null;
    takes.push({
      id: take["id"],
      action: take["action"],
      observation: take["observation"],
      direction: take["direction"],
    });
  }
  return validateRehearsalDraft({ phase: "take", takes, reflection: "" }) ? null : takes;
}

import type { Database } from "@/integrations/supabase/types";

export type ActorProject = Database["public"]["Tables"]["actor_projects"]["Row"];
export type ProjectKind = ActorProject["kind"];
export type ProjectStatus = ActorProject["status"];
export type ProjectDraft = Pick<ActorProject,
  | "title" | "kind" | "role_name" | "due_date" | "given_circumstances"
  | "objective" | "obstacle" | "playable_action" | "rehearsal_notes" | "status"
>;

export const ACTOR_PROJECTS_KEY = "slams.actor-projects.guest.v1";
export const PROJECT_FIELD_LIMITS = {
  title: 120,
  role_name: 160,
  given_circumstances: 4000,
  objective: 2000,
  obstacle: 2000,
  playable_action: 2000,
  rehearsal_notes: 6000,
} as const;

export function emptyProjectDraft(): ProjectDraft {
  return {
    title: "",
    kind: "audition",
    role_name: "",
    due_date: null,
    given_circumstances: "",
    objective: "",
    obstacle: "",
    playable_action: "",
    rehearsal_notes: "",
    status: "active",
  };
}
export function projectDraft(project: ActorProject): ProjectDraft {
  return {
    title: project.title, kind: project.kind, role_name: project.role_name,
    due_date: project.due_date, given_circumstances: project.given_circumstances,
    objective: project.objective, obstacle: project.obstacle,
    playable_action: project.playable_action, rehearsal_notes: project.rehearsal_notes,
    status: project.status,
  };
}
export function validateProject(draft: ProjectDraft): string | null {
  if (!draft.title.trim()) return "Project title is required.";
  if (!["audition", "role", "production", "personal"].includes(draft.kind))
    return "Select a valid project type.";
  if (!["active", "archived"].includes(draft.status)) return "Invalid project status.";
  for (const [field, max] of Object.entries(PROJECT_FIELD_LIMITS)) {
    const value = draft[field as keyof typeof PROJECT_FIELD_LIMITS];
    if (typeof value !== "string" || value.length > max)
      return `Project field ${field} exceeds its limit.`;
  }
  if (draft.due_date !== null &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(draft.due_date) ||
      Number.isNaN(Date.parse(draft.due_date)) ||
      new Date(draft.due_date).toISOString().slice(0, 10) !== draft.due_date))
    return "Use a valid project deadline.";
  return null;
}
export function sortProjects(items: ActorProject[]) {
  return [...items].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at) || a.title.localeCompare(b.title),
  );
}
export function isActorProject(value: unknown): value is ActorProject {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "string" || !/^[0-9a-f-]{36}$/i.test(obj.id) ||
      typeof obj.user_id !== "string" || typeof obj.version !== "number" ||
      !Number.isInteger(obj.version) || obj.version < 1 ||
      typeof obj.created_at !== "string" || typeof obj.updated_at !== "string")
    return false;
  const draft = projectDraft(obj as unknown as ActorProject);
  return validateProject(draft) === null;
}
export function serializeProjectDraft(draft: ProjectDraft): ProjectDraft {
  return { ...draft, title: draft.title.trim(), role_name: draft.role_name.trim() };
}
export function draftEquals(a: ProjectDraft, b: ProjectDraft): boolean {
  return (Object.keys(a) as Array<keyof ProjectDraft>).every((key) => a[key] === b[key]);
}
export function localProjectFile(id: string, draft: ProjectDraft, now: string): ActorProject {
  return {
    id, user_id: "", ...serializeProjectDraft(draft), version: 1,
    created_at: now, updated_at: now,
  };
}
export function isValidProjectId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/** Explicit project fields, separate from the legacy single audition-prep record. */
export const PROJECT_NOTE_FIELDS = [
  { key: "circumstances", group: "Character", label: "Given circumstances", ar: "ظروف الشخصية" },
  { key: "objective", group: "Character", label: "Objective", ar: "هدف الشخصية" },
  { key: "obstacle", group: "Character", label: "Obstacle", ar: "العائق" },
  { key: "action", group: "Character", label: "Playable action", ar: "الفعل القابل للتمثيل" },
  { key: "moment", group: "Character", label: "Moment before", ar: "اللحظة السابقة" },
  { key: "relationships", group: "Character", label: "Relationships", ar: "العلاقات" },
  {
    key: "beats",
    group: "Breakdown",
    label: "Scene beats / changes",
    ar: "وحدات المشهد والتحولات",
  },
  {
    key: "tactics",
    group: "Breakdown",
    label: "Tactics and transitions",
    ar: "التكتيكات والتحولات",
  },
] as const;

export type ProjectNoteKey = (typeof PROJECT_NOTE_FIELDS)[number]["key"];
export type ProjectNotes = Record<ProjectNoteKey, string>;
export type ProjectStatus = "active" | "archived";
export interface ProjectDraft {
  title: string;
  roleName: string;
  notes: ProjectNotes;
}
export const blankProjectNotes = (): ProjectNotes =>
  Object.fromEntries(PROJECT_NOTE_FIELDS.map(({ key }) => [key, ""])) as ProjectNotes;
export const blankProjectDraft = (): ProjectDraft => ({
  title: "",
  roleName: "",
  notes: blankProjectNotes(),
});

/** A PostgREST/JSON payload is untrusted even when served from our own database. */
export function parseProjectNotes(value: unknown): ProjectNotes {
  const record: Record<string, unknown> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const notes = blankProjectNotes();
  for (const { key } of PROJECT_NOTE_FIELDS) {
    notes[key] = typeof record[key] === "string" ? record[key] : "";
  }
  return notes;
}
export function validateProjectDraft(value: ProjectDraft): string | null {
  if (!value.title.trim()) return "Give this project a title.";
  if (value.title.trim().length > 120) return "Project title must be 120 characters or less.";
  if (value.roleName.length > 120) return "Role name must be 120 characters or less.";
  for (const { key, label } of PROJECT_NOTE_FIELDS) {
    if (typeof value.notes[key] !== "string" || value.notes[key].length > 900)
      return label + " must be 900 characters or less.";
  }
  // The database independently enforces its own size limit. This prevents
  // a large Unicode/Arabic JSON payload from reaching that limit unexpectedly.
  if (new Blob([JSON.stringify(value.notes)]).size > 14000)
    return "Project notes are too long. Shorten a field before saving.";
  return null;
}

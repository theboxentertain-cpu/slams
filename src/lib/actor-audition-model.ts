/** User-written audition work. Every new record is distinct from legacy audition_prep. */
export const AUDITION_FIELDS = [
  { key: "circumstances", en: "Given circumstances", ar: "ظروف الدور" },
  { key: "objective", en: "What do I want?", ar: "أنا عايز إيه؟" },
  { key: "obstacle", en: "What blocks me?", ar: "إيه اللي واقف في طريقي؟" },
  { key: "action", en: "Playable action", ar: "الفعل اللي أقدر أمثّله" },
  { key: "moment", en: "Moment before", ar: "اللحظة اللي قبل المشهد" },
] as const;
export type AuditionNoteKey = (typeof AUDITION_FIELDS)[number]["key"];
export type AuditionNotes = Record<AuditionNoteKey, string>;
export type AuditionStatus = "preparing" | "ready" | "submitted" | "closed";
export const AUDITION_STATUSES: readonly AuditionStatus[] = [
  "preparing",
  "ready",
  "submitted",
  "closed",
];
export interface AuditionDraft {
  title: string;
  roleName: string;
  projectId: string | null;
  dueDate: string | null;
  status: AuditionStatus;
  notes: AuditionNotes;
}
export const blankAuditionNotes = (): AuditionNotes =>
  Object.fromEntries(AUDITION_FIELDS.map(({ key }) => [key, ""])) as AuditionNotes;
export const blankAuditionDraft = (): AuditionDraft => ({
  title: "",
  roleName: "",
  projectId: null,
  dueDate: null,
  status: "preparing",
  notes: blankAuditionNotes(),
});

export function parseAuditionNotes(value: unknown): AuditionNotes {
  const source: Record<string, unknown> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const notes = blankAuditionNotes();
  for (const { key } of AUDITION_FIELDS) notes[key] = typeof source[key] === "string" ? source[key] : "";
  return notes;
}
export function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined || y < 1900 || y > 9999) return false;
  const parsed = new Date(0);
  parsed.setUTCFullYear(y, m - 1, d);
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateAuditionDraft(draft: AuditionDraft, ownedProjectIds: readonly string[]): string | null {
  if (!draft.title.trim() || draft.title.trim().length > 120)
    return "Audition title must be 1–120 characters.";
  if (draft.roleName.length > 120) return "Role must be 120 characters or less.";
  if (!AUDITION_STATUSES.includes(draft.status)) return "Choose a valid audition status.";
  if (draft.dueDate !== null && !validCalendarDate(draft.dueDate))
    return "Enter a valid due date.";
  if (draft.projectId !== null && (!uuid.test(draft.projectId) || !ownedProjectIds.includes(draft.projectId)))
    return "Select a project that belongs to this account.";
  for (const { key, en } of AUDITION_FIELDS) {
    if (typeof draft.notes[key] !== "string" || draft.notes[key].length > 1500)
      return en + " must be 1,500 characters or less.";
  }
  if (new Blob([JSON.stringify(draft.notes)]).size > 14000)
    return "Audition notes are too long; shorten them before saving.";
  return null;
}

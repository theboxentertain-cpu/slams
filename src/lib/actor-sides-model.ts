/** Actor-owned, plain-text audition sides. Script content is immutable after upload. */
export const MAX_SIDE_CHARS = 25000;
export const MAX_SIDE_LINES = 400;
export const MAX_SIDE_BYTES = 60000;
export const MAX_ANNOTATIONS = 40;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SideTarget {
  kind: "project" | "audition";
  id: string;
}
export interface SideAnnotation {
  id: string;
  fromLine: number;
  toLine: number;
  beat: string;
  objective: string;
  tactic: string;
}
export interface SideDraft {
  title: string;
  content: string;
  target: SideTarget | null;
}
export const blankSideDraft = (): SideDraft => ({ title: "", content: "", target: null });
export const sideLines = (content: string) => content.split(/\r\n|\r|\n/);
export function anchoredExcerpt(content: string, fromLine: number, toLine: number): string {
  return sideLines(content).slice(fromLine - 1, toLine).join("\n");
}
const byteLength = (content: string) => new Blob([content]).size;

export function validateSideDraft(
  draft: SideDraft,
  ownedProjects: readonly string[],
  ownedAuditions: readonly string[],
): string | null {
  if (draft.title.trim().length < 1 || draft.title.trim().length > 120)
    return "Give this side a title (1–120 characters).";
  if (
    !draft.target ||
    !UUID.test(draft.target.id) ||
    !["project", "audition"].includes(draft.target.kind)
  )
    return "Choose one of your own projects or auditions.";
  const owned = draft.target.kind === "project" ? ownedProjects : ownedAuditions;
  if (!owned.includes(draft.target.id)) return "The selected owner-linked record is unavailable.";
  if (!draft.content.trim()) return "Add the original text of your sides.";
  if (draft.content.length > MAX_SIDE_CHARS || byteLength(draft.content) > MAX_SIDE_BYTES)
    return "Text is too long. Use one side of at most 25,000 characters / 60 KB.";
  if (sideLines(draft.content).length > MAX_SIDE_LINES)
    return "This side has too many lines. Import at most 400 lines at a time.";
  return null;
}
export function validateSideAnnotations(value: SideAnnotation[], content: string): string | null {
  if (value.length > MAX_ANNOTATIONS) return "A side can hold up to 40 beat annotations.";
  const lines = sideLines(content).length;
  const unique = new Set<string>();
  for (const note of value) {
    if (!UUID.test(note.id) || unique.has(note.id))
      return "Every beat must have a unique valid identifier.";
    unique.add(note.id);
    if (!Number.isInteger(note.fromLine) || !Number.isInteger(note.toLine) ||
        note.fromLine < 1 || note.toLine < note.fromLine || note.toLine > lines)
      return "Line range must exist in the original script.";
    if (!note.beat.trim() || note.beat.length > 300 ||
        note.objective.length > 500 || note.tactic.length > 500)
      return "Write a beat label (max 300 characters); notes are limited to 500 characters.";
  }
  if (byteLength(JSON.stringify(value)) > 16000)
    return "Annotations are too long. Shorten a note before saving.";
  return null;
}
/** Treat rows read from a database as untrusted; never render invalid anchors. */
export function parseSideAnnotations(value: unknown, content: string): SideAnnotation[] {
  if (!Array.isArray(value)) return [];
  const notes: SideAnnotation[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const item = candidate as Record<string, unknown>;
    if (typeof item["id"] !== "string" ||
      typeof item["fromLine"] !== "number" ||
      typeof item["toLine"] !== "number" ||
      typeof item["beat"] !== "string" ||
      typeof item["objective"] !== "string" ||
      typeof item["tactic"] !== "string")
      continue;
    const note: SideAnnotation = {
      id: item["id"],
      fromLine: item["fromLine"],
      toLine: item["toLine"],
      beat: item["beat"],
      objective: item["objective"],
      tactic: item["tactic"],
    };
    if (!validateSideAnnotations([note], content)) notes.push(note);
    if (notes.length === MAX_ANNOTATIONS) break;
  }
  return notes;
}

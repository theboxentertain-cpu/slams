import { type ProjectDraft, type ProjectNoteKey } from "@/lib/actor-project-model";

/**
 * Legacy audition prep belongs to a single separate record. A copy into an
 * actor project is never a migration, deletion, or live two-way link.
 */
export const LEGACY_AUDITION_COPY_KEYS = [
  "circumstances",
  "objective",
  "obstacle",
  "action",
  "moment",
] as const satisfies readonly ProjectNoteKey[];

export type LegacyAuditionCopyKey = (typeof LEGACY_AUDITION_COPY_KEYS)[number];
export type LegacyAuditionPrep = Record<string, string>;

export function auditionCopyCandidates(source: LegacyAuditionPrep, target: ProjectDraft) {
  return LEGACY_AUDITION_COPY_KEYS.map((key) => {
    const value = typeof source[key] === "string" ? source[key] : "";
    const occupied = target.notes[key].trim().length > 0;
    const tooLong = value.length > 900;
    return { key, value, occupied, tooLong, eligible: !!value.trim() && !occupied && !tooLong };
  });
}

/** Pure, fail-closed preparation. Never mutates source or target. */
export function copyAuditionFields(
  source: LegacyAuditionPrep,
  target: ProjectDraft,
  chosen: readonly LegacyAuditionCopyKey[],
):
  | { draft: ProjectDraft; copied: number; error?: never }
  | { draft?: never; copied?: never; error: string } {
  const unique = [...new Set(chosen)];
  if (!unique.length) return { error: "Select at least one available field to copy." };
  const candidates = auditionCopyCandidates(source, target);
  if (
    unique.some(
      (key) =>
        !LEGACY_AUDITION_COPY_KEYS.includes(key) ||
        !candidates.find((candidate) => candidate.key === key)?.eligible,
    )
  ) {
    return { error: "A source is missing or a destination is already filled. Nothing was copied." };
  }
  const next: ProjectDraft = { ...target, notes: { ...target.notes } };
  for (const key of unique) next.notes[key] = source[key]!;
  return { draft: next, copied: unique.length };
}

/** IDs in links are selectors, not proof of ownership. The cloud query/RLS
 * and account-bound response must still verify the selected project.
 */
export function projectSelectionSearch(input: Record<string, unknown>, tab: string) {
  const id = input["projectId"];
  return {
    tab,
    projectId:
      typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        ? id.toLowerCase()
        : undefined,
  };
}

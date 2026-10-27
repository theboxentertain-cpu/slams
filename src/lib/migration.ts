// Pure helpers for moving browser-local progress into a signed-in account.
// Unit-tested; the Supabase calls live in src/lib/store.ts.
import type { PassportEntry } from "@/lib/store";

export interface CloudPassportRow {
  id: string;
  user_id: string;
  tactic: string;
  intervention: string;
  exercise_note: string;
  obstacle: string;
  retake_line: string;
  reflection: string;
  created_at: string;
}

/** Map local passport entries to cloud rows. Entries missing a tactic or reflection are skipped, never silently half-saved. */
export function toCloudRows(entries: PassportEntry[], userId: string): CloudPassportRow[] {
  return entries
    .filter((e) => e.tactic.trim().length > 0 && e.reflection.trim().length > 0)
    .map((e) => ({
      id: e.id,
      user_id: userId,
      tactic: e.tactic,
      intervention: e.intervention,
      exercise_note: e.exerciseNote,
      obstacle: e.obstacle,
      retake_line: e.retakeLine,
      reflection: e.reflection,
      created_at: e.date,
    }));
}

/** Offer the import prompt only when there is something local to move and the user is signed in. */
export function shouldOfferImport(localCount: number, signedIn: boolean, dismissed: boolean): boolean {
  return signedIn && !dismissed && localCount > 0;
}

/** True when an audition-prep payload has any content worth importing. */
export function auditionPrepHasContent(data: Record<string, string>): boolean {
  return Object.values(data).some((v) => typeof v === "string" && v.trim().length > 0);
}

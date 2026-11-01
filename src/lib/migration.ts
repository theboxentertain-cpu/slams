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
  const rows = entries
    .filter((e) => e.tactic.trim().length > 0 && e.reflection.trim().length > 0)
    .map((e) => ({
      id: e.id.toLowerCase(),
      user_id: userId,
      tactic: e.tactic,
      intervention: e.intervention,
      exercise_note: e.exerciseNote,
      obstacle: e.obstacle,
      retake_line: e.retakeLine,
      reflection: e.reflection,
      created_at: e.date,
    }));
  // ON CONFLICT ignores duplicate IDs. Submit one candidate per ID, but leave
  // conflicting local versions available for reconciliation after readback.
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/** IDs alone are not evidence that a local record was persisted unchanged. */
export function matchesCloudEntry(entry: PassportEntry, row: CloudPassportRow): boolean {
  return (
    entry.id.toLowerCase() === row.id &&
    Number.isFinite(Date.parse(entry.date)) &&
    Date.parse(entry.date) === Date.parse(row.created_at) &&
    entry.tactic === row.tactic &&
    entry.intervention === row.intervention &&
    entry.exerciseNote === row.exercise_note &&
    entry.obstacle === row.obstacle &&
    entry.retakeLine === row.retake_line &&
    entry.reflection === row.reflection
  );
}

/** Offer the import prompt only when there is something local to move and the user is signed in. */
export function shouldOfferImport(
  localCount: number,
  signedIn: boolean,
  dismissed: boolean,
): boolean {
  return signedIn && !dismissed && localCount > 0;
}

/** True when an audition-prep payload has any content worth importing. */
export function auditionPrepHasContent(data: Record<string, string>): boolean {
  return Object.values(data).some((v) => typeof v === "string" && v.trim().length > 0);
}

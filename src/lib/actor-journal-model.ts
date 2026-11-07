/** Project journals are private authored notes, separate from legacy local journals. */
export type JournalStatus = "active" | "archived";
export interface JournalDraft {
  title: string;
  body: string;
}
export interface JournalContext {
  auditionId?: string | undefined;
  rehearsalId?: string | undefined;
}
export const blankJournalDraft = (): JournalDraft => ({ title: "", body: "" });
export function validateJournalDraft(draft: JournalDraft): string | null {
  if (!draft.title.trim()) return "Give this journal entry a title.";
  if (draft.title.trim().length > 120) return "Journal title must be 120 characters or less.";
  if (draft.body.length > 20000) return "Journal entry must be 20,000 characters or less.";
  return null;
}

export function journalSelectionSearch(input: Record<string, unknown>, tab: string) {
  const uuid = (value: unknown) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      ? value.toLowerCase()
      : undefined;
  return {
    tab,
    projectId: uuid(input["projectId"]),
    auditionId: uuid(input["auditionId"]),
    rehearsalId: uuid(input["rehearsalId"]),
  };
}

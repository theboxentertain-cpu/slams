import { describe, expect, it } from "vitest";
import {
  blankAuditionDraft,
  parseAuditionNotes,
  validateAuditionDraft,
  validCalendarDate,
} from "@/lib/actor-audition-model";

const own = "4e395745-dc7b-4be4-b7cb-6b5c956707d8";
const another = "a85c3544-b458-4814-9fa5-2ff599bba450";

describe("Professional audition record validation", () => {
  it("starts an independent, unlinked file without migrating legacy notes", () => {
    const draft = blankAuditionDraft();
    expect(draft.projectId).toBeNull();
    expect(draft.dueDate).toBeNull();
    expect(Object.values(draft.notes)).toEqual(["", "", "", "", ""]);
    expect(validateAuditionDraft(draft, [])).toMatch(/title/);
    draft.title = "New production";
    expect(validateAuditionDraft(draft, [])).toBeNull();
  });
  it("rejects cross-account project links before any network write", () => {
    const draft = blankAuditionDraft();
    draft.title = "Screen Test";
    draft.projectId = another;
    expect(validateAuditionDraft(draft, [own])).toMatch(/belongs to this account/);
    draft.projectId = own;
    expect(validateAuditionDraft(draft, [own])).toBeNull();
  });
  it("validates calendar dates, including leap years and impossible dates", () => {
    expect(validCalendarDate("2028-02-29")).toBe(true);
    expect(validCalendarDate("2026-02-29")).toBe(false);
    expect(validCalendarDate("2026-13-01")).toBe(false);
    expect(validCalendarDate("2026-11-07")).toBe(true);
    const draft = blankAuditionDraft();
    draft.title = "Role";
    draft.dueDate = "2026-02-30";
    expect(validateAuditionDraft(draft, [])).toMatch(/due date/);
  });
  it("rejects invalid status, oversize fields and leaves source unchanged", () => {
    const draft = blankAuditionDraft();
    draft.title = "Role";
    draft.status = "won" as never;
    expect(validateAuditionDraft(draft, [])).toMatch(/status/);
    draft.status = "preparing";
    draft.notes.action = "Z".repeat(1501);
    expect(validateAuditionDraft(draft, [])).toMatch(/1,500/);
    expect(draft.notes.action).toHaveLength(1501);
  });
  it("keeps Arabic preparation exactly and discards unexpected database keys", () => {
    const parsed = parseAuditionNotes({
      objective: "أقنعها أن ترجع",
      action: "To persuade",
      unexpected: "not a valid audition field",
      obstacle: 42,
    });
    expect(parsed.objective).toBe("أقنعها أن ترجع");
    expect(parsed.action).toBe("To persuade");
    expect(parsed.obstacle).toBe("");
    expect(Object.keys(parsed)).toHaveLength(5);
  });
});

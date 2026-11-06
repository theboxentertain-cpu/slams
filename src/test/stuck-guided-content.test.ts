import { describe, expect, it } from "vitest";
import {
  RESCUE_PROBLEMS,
  canCompareRescue,
  rescueNote,
  rescueOutcomeLabel,
  rescueProblemById,
  type RescueInput,
} from "@/data/stuck-guided";

const completed: RescueInput = {
  problemId: "flat",
  firstAttempt: "I repeated the line with the same request.",
  secondAttempt: "I tried to reassure rather than push.",
  difference: "I changed the action verb and waited for a response.",
  outcome: "no-change",
};

describe("Guided Stuck Desk protects actor evidence from invented analysis", () => {
  it("offers four distinct bilingual technique-informed choices and never a claim of faculty review", () => {
    expect(RESCUE_PROBLEMS.map((item) => item.id)).toEqual(["planning", "flat", "stakes", "stiff"]);
    for (const item of RESCUE_PROBLEMS) {
      for (const key of ["title", "lens", "why", "intervention", "solo", "partner", "avoid", "cue"] as const) {
        expect(item[key].en.trim().length, `${item.id} English ${key}`).toBeGreaterThan(10);
        expect(item[key].ar.trim().length, `${item.id} Arabic ${key}`).toBeGreaterThan(10);
      }
    }
    expect(rescueProblemById("missing")).toBeNull();
  });
  it("requires actual first and second written observations, not a clickable completion shortcut", () => {
    expect(canCompareRescue(completed)).toBe(true);
    expect(canCompareRescue({ ...completed, problemId: "other" })).toBe(false);
    expect(canCompareRescue({ ...completed, firstAttempt: " " })).toBe(false);
    expect(canCompareRescue({ ...completed, secondAttempt: "short" })).toBe(false);
    expect(canCompareRescue({ ...completed, difference: "   " })).toBe(false);
    expect(canCompareRescue({ ...completed, difference: "x".repeat(1201) })).toBe(false);
  });
  it("permits an honest report of no change without inventing a performance score", () => {
    const note = rescueNote(completed, "en");
    expect(note).toContain("I could not identify a difference");
    expect(note).toContain("I changed the action verb");
    expect(note).toContain("No automatic performance analysis, diagnosis, grade or credit");
    expect(note).not.toMatch(/mastered|certified|passed|10\/10/i);
    expect(rescueNote({ ...completed, firstAttempt: "" }, "en")).toBe("");
    expect(rescueOutcomeLabel("unsure").en).toBe("I am not sure yet");
  });
  it("keeps learner-authored English and Arabic note content unchanged", () => {
    const privateText = "أغيّر الفعل لما الطرف الثاني يرد — exact user text";
    const note = rescueNote({ ...completed, secondAttempt: privateText }, "ar");
    expect(note).toContain(privateText);
    expect(note).toContain("لا يوجد تحليل أداء آلي");
  });
});

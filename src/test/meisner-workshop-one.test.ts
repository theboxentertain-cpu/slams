import { describe, expect, it } from "vitest";
import { MEISNER_EDITORIAL_TERM_ONE as pilot } from "@/data/meisner-editorial-term-one";
import { WORKSHOP_ONE, KNOWLEDGE_CHECK, emptyNotes,
  isCorrectAnswer, canStart, canContinue, canSummarize, practiceNote
} from "@/data/meisner-workshop-one";

describe("Meisner first workshop source-grounded training preview", () => {
  it("uses original Content 03 identifiers and protects publication rules", () => {
    expect(WORKSHOP_ONE.id).toBe("meisner-t01-w01");
    expect(WORKSHOP_ONE.lessons.map((lesson) => lesson.id))
      .toEqual(pilot.lessons.slice(0, 3).map((lesson) => lesson.id));
    expect(WORKSHOP_ONE.exercises.map((exercise) => exercise.id))
      .toEqual(pilot.exercises.slice(0, 2).map((exercise) => exercise.id));
    expect(WORKSHOP_ONE.publicationAuthorized).toBe(false);
    expect(WORKSHOP_ONE.masteryAwardAllowed).toBe(false);
    expect(WORKSHOP_ONE.partnerReviewRequired).toBe(true);
    expect(pilot.assessment.passThreshold).toBeNull();
  });
  it("checks only explicit objective text classifications", () => {
    expect(KNOWLEDGE_CHECK).toHaveLength(4);
    for (const q of KNOWLEDGE_CHECK) {
      expect(isCorrectAnswer(q.id, q.answer)).toBe(true);
      for (const choice of ["observation", "interpretation", "experience"] as const) {
        if (choice !== q.answer) expect(isCorrectAnswer(q.id, choice)).toBe(false);
      }
    }
    expect(isCorrectAnswer("nonexistent", "observation")).toBe(false);
  });
  it("requires consent for partner mode; solo never advances into exercise 2", () => {
    expect(canStart("solo", false, false)).toBe(true);
    expect(canStart("partner", true, false)).toBe(false);
    expect(canStart("partner", true, true)).toBe(true);
    const n = emptyNotes();
    expect(canContinue("solo", 0, n)).toBe(false);
    n.observation = "The object moved";
    n.assumption = "It was intentional";
    n.correction = "It moved to the left";
    expect(canContinue("solo", 0, n)).toBe(true);
    expect(canContinue("partner", 0, n)).toBe(false);
    expect(canContinue("solo", 1, n)).toBe(false);
    n.partnerReply = "The partner corrected the statement";
    expect(canContinue("partner", 0, n)).toBe(true);
    n.expected = "Yes"; n.actual = "No"; n.adjusted = "I reconsidered";
    expect(canContinue("partner", 1, n)).toBe(true);
  });
  it("keeps self-reflection separate from competence and server progression", () => {
    const n = emptyNotes();
    expect(canSummarize(n)).toBe(false);
    n.reflection = "I expected a prepared reply";
    n.next = "Wait for the next response";
    expect(canSummarize(n)).toBe(true);
    expect(practiceNote("solo", n)).toContain("NO MASTERY OR TERM CREDIT");
    expect(practiceNote("solo", n)).not.toContain("Partner reply/correction");
    expect(practiceNote("partner", n)).toContain("self-reported only");
    expect(practiceNote("partner", n)).toContain("no Passport/cloud save");
  });
});

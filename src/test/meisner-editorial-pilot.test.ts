import { describe, expect, it } from "vitest";
import { MEISNER_EDITORIAL_TERM_ONE as pilot } from "@/data/meisner-editorial-term-one";

describe("Meisner original Content 03 academic preview", () => {
  it("preserves 3 courses, 3 workshops, 9 lessons and 6 exercises", () => {
    expect(pilot.courses).toHaveLength(3);
    expect(pilot.workshops).toHaveLength(3);
    expect(pilot.lessons).toHaveLength(9);
    expect(pilot.exercises).toHaveLength(6);
    expect(new Set(pilot.lessons.map(l => l.id)).size).toBe(9);
    expect(new Set(pilot.exercises.map(e => e.id)).size).toBe(6);
    expect(pilot.lessons[0]?.id).toBe("meisner-t01-w01-l01");
    expect(pilot.lessons[8]?.id).toBe("meisner-t01-w03-l03");
  });
  it("never awards review, completion or a false institutional credential", () => {
    expect(pilot.publicationAuthorized).toBe(false);
    expect(pilot.graduationAllowed).toBe(false);
    expect(pilot.partnerCompetenceRequiresHumanReview).toBe(true);
    expect(pilot.assessment.reviewRequired).toBe(true);
    expect(pilot.assessment.passThreshold).toBeNull();
    expect(pilot.requiredOfficialReps).toBeNull();
    expect(pilot.lessons.every(l => !l.publicationAuthorized)).toBe(true);
    expect(pilot.exercises.every(e => !e.publicationAuthorized)).toBe(true);
  });
  it("keeps source-backed lesson-to-exercise relationships intact", () => {
    const ids = new Set(pilot.exercises.map(e => e.id));
    for (const lesson of pilot.lessons) {
      for (const id of lesson.exerciseIds) expect(ids.has(id)).toBe(true);
    }
    for (const exercise of pilot.exercises) {
      for (const id of exercise.linkedLessonIds) {
        expect(pilot.lessons.some(lesson => lesson.id === id)).toBe(true);
      }
    }
    expect(pilot.exercises.every(e => e.requiredMode === "partner_required" || e.requiredMode === "partner_or_group")).toBe(true);
  });
});

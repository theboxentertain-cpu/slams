import { describe, expect, it } from "vitest";
import { STAN_LESSONS } from "@/data/stanislavski-editorial-workshop-one";
import { STAN_WORKSHOP_ONE_ASSESSMENT as rubric } from "@/data/stanislavski-assessment-draft";

describe("Stanislavski faculty-review rubric is not academic grading", () => {
  it("keeps authorization and assessment gates closed until verified faculty review", () => {
    expect(rubric.status).toBe("unreviewed");
    expect(rubric.requiresQualifiedHumanReviewer).toBe(true);
    expect(rubric.requiresDemonstratedPerformance).toBe(true);
    expect(rubric.partnerCompetenciesNeedLivePartner).toBe(true);
    expect(rubric.learnerSelfReportCannotPass).toBe(true);
    expect(rubric.serverAuthorizationRequired).toBe(true);
    expect(rubric.publicationAuthorized).toBe(false);
    expect(rubric.academicUnlockAllowed).toBe(false);
    expect(rubric.passThreshold).toBeNull();
    expect(rubric.repetitionMinimumFromInstitution).toBeNull();
  });
  it("provides bilingual, observable evidence for all curricular learning outcomes", () => {
    const lessons = new Set<string>(STAN_LESSONS.map((item) => item.id));
    expect(rubric.criteria).toHaveLength(5);
    expect(new Set(rubric.criteria.map((item) => item.id)).size).toBe(5);
    for (const criterion of rubric.criteria) {
      for (const field of ["focus", "evidence", "commonFailure"] as const) {
        expect(criterion[field].en.trim().length).toBeGreaterThan(10);
        expect(criterion[field].ar.trim().length).toBeGreaterThan(10);
      }
      expect(criterion.lessonIds.length).toBeGreaterThan(0);
      for (const id of criterion.lessonIds) expect(lessons.has(id)).toBe(true);
    }
  });
});

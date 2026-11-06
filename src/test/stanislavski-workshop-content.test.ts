import { describe, expect, it } from "vitest";
import {
  STAN_CHECKS,
  STAN_EDITORIAL_ROUNDS,
  STAN_EXERCISES,
  STAN_LESSONS,
  STAN_SOURCE_LINKS,
  STAN_TERM_ONE,
  blankStanRound,
  canAdvanceStanExercise,
  canLogStanRound,
  canStartStanPartner,
  countStanRounds,
  recordStanRound,
  stanPracticeSummary,
  type StanRound,
  type StanRoundInput,
} from "@/data/stanislavski-editorial-workshop-one";

function sampleRound(n: number): StanRoundInput {
  return {
    circumstances: "A room closes in " + n + " minutes.",
    objective: "Borrow the notebook for reference.",
    action: "Ask politely using example " + n,
    obstacle: "Partner needs it for their work.",
    observation: "They checked the clock in attempt " + n,
    adjustment: "I explained the deadline with detail " + n,
  };
}

describe("SLAMS Stanislavski editorial academic fidelity", () => {
  it("sources public competency areas without asserting university affiliation or exact chronology", () => {
    expect(STAN_TERM_ONE.school).toBe("stanislavski");
    expect(STAN_TERM_ONE.year).toBe(1);
    expect(STAN_TERM_ONE.term).toBe(1);
    expect(STAN_TERM_ONE.declaredSchoolYears).toBe(4);
    expect(STAN_TERM_ONE.declaredSchoolTerms).toBe(8);
    expect(STAN_TERM_ONE.programMapIsProvisional).toBe(true);
    expect(STAN_TERM_ONE.institutionallyApproved).toBe(false);
    expect(STAN_TERM_ONE.publicationAuthorized).toBe(false);
    expect(STAN_TERM_ONE.academicCreditAllowed).toBe(false);
    expect(STAN_TERM_ONE.advancedPlacementEnabled).toBe(false);
    expect(STAN_TERM_ONE.facultyAssessmentRequired).toBe(true);
    expect(STAN_TERM_ONE.institutionalRepRequirement).toBeNull();
    expect(STAN_TERM_ONE.passThreshold).toBeNull();
    expect(STAN_TERM_ONE.workshops.map((w) => w.status)).toEqual([
      "interactive-editorial-preview", "outline-only", "outline-only",
    ]);
    expect(STAN_SOURCE_LINKS).toHaveLength(3);
    expect(STAN_SOURCE_LINKS.every((source) => source.url.startsWith("https://"))).toBe(true);
  });

  it("covers every agreed lesson element in English and Arabic", () => {
    expect(STAN_LESSONS).toHaveLength(3);
    expect(new Set(STAN_LESSONS.map((lesson) => lesson.id)).size).toBe(3);
    const fields = ["title", "outcome", "why", "how", "when", "notToDo", "example", "solo", "partner", "realWorld", "evidence"] as const;
    for (const lesson of STAN_LESSONS) {
      for (const field of fields) {
        expect(lesson[field].en.trim(), `${lesson.id} ${field} English`).not.toBe("");
        expect(lesson[field].ar.trim(), `${lesson.id} ${field} Arabic`).not.toBe("");
      }
      expect(lesson.pitfalls.length).toBeGreaterThanOrEqual(2);
      expect(lesson.pitfalls.every((p) => p.en.length > 5 && p.ar.length > 5)).toBe(true);
    }
    expect(STAN_EXERCISES).toHaveLength(3);
    for (const exercise of STAN_EXERCISES) {
      expect(exercise.id).toMatch(/^stanislavski-y1-t1-w01-e0[1-3]$/);
      expect(exercise.soloSteps.length).toBeGreaterThanOrEqual(3);
      expect(exercise.partnerSteps.length).toBeGreaterThanOrEqual(3);
      for (const item of [...exercise.soloSteps, ...exercise.partnerSteps]) {
        expect(item.en.trim()).not.toBe("");
        expect(item.ar.trim()).not.toBe("");
      }
    }
  });

  it("gates each objective knowledge check on the correct option", () => {
    expect(STAN_CHECKS).toHaveLength(3);
    for (const item of STAN_CHECKS) {
      expect(item.answer).toBeGreaterThanOrEqual(0);
      expect(item.answer).toBeLessThan(item.options.length);
      expect(item.options).toHaveLength(3);
      expect(item.explanation.en.length).toBeGreaterThan(15);
      expect(item.explanation.ar.length).toBeGreaterThan(15);
    }
  });

  it("logs only complete, distinct, bounded self-reports with no academic unlock", () => {
    let history: StanRound[] = [];
    const exerciseId = STAN_EXERCISES[0].id;
    expect(canLogStanRound(exerciseId, "solo", blankStanRound(), history)).toBe(false);
    expect(canLogStanRound("not-a-real-exercise", "solo", sampleRound(1), history)).toBe(false);
    const first = sampleRound(1);
    history = recordStanRound(exerciseId, "solo", first, history);
    expect(countStanRounds(exerciseId, "solo", history)).toBe(1);
    first.circumstances = "CHANGED LATER";
    expect(history[0]!.fields.circumstances).not.toBe("CHANGED LATER");
    expect(recordStanRound(exerciseId, "solo", sampleRound(1), history)).toBe(history);
    expect(recordStanRound(exerciseId, "solo", { ...sampleRound(2), objective: " " }, history)).toBe(history);
    expect(recordStanRound(exerciseId, "solo", { ...sampleRound(2), objective: "a".repeat(901) }, history)).toBe(history);
    for (let n = 2; n <= STAN_EDITORIAL_ROUNDS; n++)
      history = recordStanRound(exerciseId, "solo", sampleRound(n), history);
    expect(canAdvanceStanExercise(exerciseId, "solo", history)).toBe(true);
    expect(canAdvanceStanExercise(exerciseId, "partner", history)).toBe(false);
    expect(canAdvanceStanExercise(STAN_EXERCISES[1].id, "solo", history)).toBe(false);
    expect(recordStanRound(exerciseId, "solo", sampleRound(4), history)).toBe(history);
    const note = stanPracticeSummary("solo", history, "I noticed adjustment", "Try a new action");
    expect(note).toContain("NO ASSESSED MASTERY / CERTIFICATION / TERM CREDIT");
    expect(note).toContain("not saved to Passport, cloud or academic records");
    expect(note).not.toContain("user_id");
  });

  it("requires separate consent and boundary confirmations for partner mode", () => {
    expect(canStartStanPartner("solo", false, false)).toBe(true);
    expect(canStartStanPartner("partner", true, false)).toBe(false);
    expect(canStartStanPartner("partner", false, true)).toBe(false);
    expect(canStartStanPartner("partner", true, true)).toBe(true);
  });
});

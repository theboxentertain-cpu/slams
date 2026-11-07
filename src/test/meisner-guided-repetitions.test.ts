import { describe, expect, it } from "vitest";
import {
  EDITORIAL_PRACTICE_ROUNDS,
  addPracticeRep,
  canLogPracticeRep,
  emptyNotes,
  hasEnoughPracticeRounds,
  practiceNote,
  roundCount,
  type PracticeRep,
} from "@/data/meisner-workshop-one";

function soloRound(n: number) {
  return {
    ...emptyNotes(),
    observation: `A visible movement ${n}`,
    assumption: `A possible inference ${n}`,
    correction: `A checkable description ${n}`,
  };
}

describe("Meisner non-accredited editorial practice tracker", () => {
  it("does not count empty, identical or extra rounds", () => {
    let reps: PracticeRep[] = [];
    expect(canLogPracticeRep("solo", 0, emptyNotes(), reps)).toBe(false);
    expect(canLogPracticeRep("solo", 1, soloRound(1), reps)).toBe(false);
    reps = addPracticeRep("solo", 0, soloRound(1), reps);
    expect(roundCount("solo", 0, reps)).toBe(1);
    expect(addPracticeRep("solo", 0, soloRound(1), reps)).toBe(reps);
    expect(addPracticeRep("solo", 0, { ...soloRound(1), observation: "   " }, reps)).toBe(reps);
    for (let n = 2; n <= EDITORIAL_PRACTICE_ROUNDS; n++)
      reps = addPracticeRep("solo", 0, soloRound(n), reps);
    expect(roundCount("solo", 0, reps)).toBe(EDITORIAL_PRACTICE_ROUNDS);
    expect(hasEnoughPracticeRounds("solo", 0, reps)).toBe(true);
    expect(hasEnoughPracticeRounds("partner", 0, reps)).toBe(false);
    expect(addPracticeRep("solo", 0, soloRound(4), reps)).toBe(reps);
  });

  it("requires a real-partner mode self-report for each paired exercise", () => {
    let reps: PracticeRep[] = [];
    for (let n = 1; n <= EDITORIAL_PRACTICE_ROUNDS; n++) {
      const first = { ...soloRound(n), partnerReply: `Partner answered ${n}` };
      reps = addPracticeRep("partner", 0, first, reps);
    }
    expect(hasEnoughPracticeRounds("partner", 0, reps)).toBe(true);
    expect(hasEnoughPracticeRounds("partner", 1, reps)).toBe(false);
    const response = { ...emptyNotes(), expected: "Yes", actual: "No", adjusted: "Listen again" };
    expect(canLogPracticeRep("partner", 1, response, reps)).toBe(true);
    reps = addPracticeRep("partner", 1, response, reps);
    expect(roundCount("partner", 1, reps)).toBe(1);
    expect(hasEnoughPracticeRounds("partner", 1, reps)).toBe(false);
  });

  it("copies only voluntarily logged notes and never labels them as accredited evidence", () => {
    const notes = soloRound(1);
    const reps = addPracticeRep("solo", 0, notes, []);
    const output = practiceNote("solo", notes, reps);
    expect(output).toContain("Self-logged round 1");
    expect(output).toContain("A visible movement 1");
    expect(output).toContain("NO MASTERY OR TERM CREDIT");
    expect(output).toContain("no Passport/cloud save");
    expect(JSON.stringify(reps)).not.toContain("user_id");
  });
});

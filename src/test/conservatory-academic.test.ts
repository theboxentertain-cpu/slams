import { describe, it, expect } from "vitest";
import { progressInput } from "@/lib/unit-progress";
import {
  inspectExerciseForReview, summarizePracticeEvents, placementDisplayStatus,
  type ExerciseAcademicRecord, type PracticeEvent
} from "@/lib/conservatory-academic";

const exercise: ExerciseAcademicRecord = {
  id: "meisner-e01",
  schoolId: "meisner",
  version: "draft-v1",
  content: {},
  howSteps: [],
  solo: { use: "preparation_only", explanation: "Not a partner exercise.", steps: ["Observe your own notes."] },
  partner: { use: "qualifying", explanation: "A real partner is required.", steps: ["Seek voluntary agreement."] },
  group: { use: "not_suitable", explanation: "Not a group exercise.", steps: [] },
  sourceRefs: ["Original SLAMS editorial draft"],
  prerequisites: [],
  practiceRequirement: { kind: "unapproved" },
  reviewStatus: "draft",
  facultyReleaseId: null,
};

describe("SLAMS academic integrity controls", () => {
  it("cannot mistake an empty, unapproved instruction outline for publishable teaching", () => {
    const audit = inspectExerciseForReview(exercise);
    expect(audit.metadataComplete).toBe(false);
    expect(audit.blockers.some((error) => error.includes("Missing required section"))).toBe(true);
    expect(audit.blockers.some((error) => error.includes("Practice quota"))).toBe(true);
    expect(audit.blockers.some((error) => error.includes("faculty content approval"))).toBe(true);
  });
  it("requires provenance and approval when a numeric practice target is proposed", () => {
    const record: ExerciseAcademicRecord = {
      ...exercise, practiceRequirement: {
        kind: "repetition_floor", count: 5,
        provenance: "slams_calibrated", sourceOrRationale: "", signedPolicyId: null
      }
    };
    const blockers = inspectExerciseForReview(record).blockers;
    expect(blockers.some((error) => error.includes("verifiable provenance"))).toBe(true);
    expect(blockers.some((error) => error.includes("authenticated faculty release"))).toBe(true);
  });
  it("tracks honest activity without granting competence from solo work or submissions", () => {
    const events: PracticeEvent[] = [
      { id: "1", schoolId: "meisner", exerciseId: "e1",
        mode: "solo", state: "attempted", facultyReviewId: null },
      { id: "2", schoolId: "meisner", exerciseId: "e1",
        mode: "human_partner", state: "evidence_submitted", facultyReviewId: null },
      { id: "3", schoolId: "meisner", exerciseId: "e1",
        mode: "human_partner", state: "faculty_accepted", facultyReviewId: "review-123" }
    ];
    const result = summarizePracticeEvents(events, "meisner", "e1");
    expect(result).toEqual({
      recordedAttempts: 3, soloPreparation: 1, partnerOrGroupAttempts: 2,
      pendingReview: 1, reportedAccepted: 1
    });
    expect("unlocked" in result).toBe(false);
    expect("mastered" in result).toBe(false);
  });
  it("never unlocks advanced placement from a client-side decision", () => {
    const approved = { schoolId: "meisner", targetId: "term-2", policyVersion: "p1",
      state: "approved" as const, facultyReviewId: "review-99" };
    expect(placementDisplayStatus(approved, "meisner", "term-2", "p1")).toEqual({
      label: "Review recorded", next: "Request server-side eligibility verification", serverUnlock: false
    });
    expect(placementDisplayStatus(approved, "adler", "term-2", "p1").serverUnlock).toBe(false);
    expect(placementDisplayStatus(approved, "meisner", "term-2", "p2").serverUnlock).toBe(false);
    expect(placementDisplayStatus(approved, "meisner", "term-2", null).serverUnlock).toBe(false);
    expect(placementDisplayStatus({ ...approved, facultyReviewId: null }, "meisner", "term-2", "p1").label).toBe("Invalid approval");
  });
  it("refuses direct actor 'completed' writes in the client helper", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(progressInput.safeParse({ unit_kind: "lesson", unit_id: id, status: "started" }).success).toBe(true);
    expect(progressInput.safeParse({ unit_kind: "lesson", unit_id: id, status: "completed" }).success).toBe(false);
  });
});

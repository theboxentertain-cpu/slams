/** SLAMS academic quality metadata and non-authoritative UI diagnostics.
 *
 * These helpers are NOT permission checks. Only an authenticated, transactional,
 * server-side academic gate may award credit or unlock a term.
 */
export const REQUIRED_EXERCISE_TEXT = [
  "why",
  "methodAndProvenance",
  "what",
  "demonstration",
  "when",
  "whatNotToDo",
  "commonPitfalls",
  "corrections",
  "professionalApplication",
  "evidenceRequirements",
  "safetyAndAccess",
  "nextStep",
] as const;

export type RequiredExerciseText = (typeof REQUIRED_EXERCISE_TEXT)[number];
export type TrainingMode = "solo" | "human_partner" | "facilitated_group";
export type ModalityUse = "qualifying" | "preparation_only" | "not_suitable";
export type ModePlan = { use: ModalityUse; explanation: string; steps: string[] };

export type PracticeRequirement =
  | { kind: "unapproved" }
  | {
      kind: "faculty_competence_protocol";
      observableCriteria: string[];
      signedPolicyId: string | null;
    }
  | {
      kind: "repetition_floor";
      count: number;
      provenance: "official_verified" | "slams_calibrated";
      sourceOrRationale: string;
      signedPolicyId: string | null;
    };

export type ExerciseAcademicRecord = {
  id: string;
  schoolId: string;
  version: string;
  requiredMode: "solo" | "human_partner" | "partner_or_group" | "facilitated_group";
  content: Partial<Record<RequiredExerciseText, string>>;
  howSteps: string[];
  solo: ModePlan;
  partner: ModePlan;
  group: ModePlan;
  sourceRefs: string[];
  prerequisites: string[];
  practiceRequirement: PracticeRequirement;
  reviewStatus: "draft" | "faculty_review" | "approved";
  facultyReleaseId: string | null;
};

/** Checks metadata completeness; NOT proof of a valid faculty signature or a publishing permission. */
export function inspectExerciseForReview(record: ExerciseAcademicRecord) {
  const blockers: string[] = [];
  if (!record.id.trim() || !record.schoolId.trim() || !record.version.trim())
    blockers.push("Exercise identity, school and content version are required.");
  for (const field of REQUIRED_EXERCISE_TEXT)
    if (!record.content[field]?.trim()) blockers.push("Missing required section: " + field);
  if (!record.howSteps.length || record.howSteps.some((step) => !step.trim()))
    blockers.push("HOW must contain numbered, actionable steps.");
  for (const [name, mode] of [
    ["solo", record.solo],
    ["partner", record.partner],
    ["group", record.group],
  ] as const) {
    if (!mode.explanation.trim()) blockers.push(name + " requires honest suitability explanation.");
    if (
      mode.use !== "not_suitable" &&
      (!mode.steps.length || mode.steps.some((step) => !step.trim()))
    )
      blockers.push(name + " requires real steps or a non-suitable designation.");
  }
  if (record.requiredMode === "human_partner" && record.solo.use === "qualifying")
    blockers.push("Solo practice cannot qualify a partner-required exercise.");
  if (record.requiredMode === "human_partner" && record.partner.use !== "qualifying")
    blockers.push("Partner-required exercise needs a qualifying real-partner protocol.");
  if (record.requiredMode === "facilitated_group" && record.group.use !== "qualifying")
    blockers.push("Group-required exercise needs a qualifying ensemble protocol.");
  if (
    record.requiredMode === "partner_or_group" &&
    record.partner.use !== "qualifying" &&
    record.group.use !== "qualifying"
  )
    blockers.push("Partner-or-group exercise needs a genuine qualifying human activity.");
  if (record.requiredMode === "solo" && record.solo.use !== "qualifying")
    blockers.push("Solo-required exercise needs a qualifying independent protocol.");
  if (!record.sourceRefs.length || record.sourceRefs.some((source) => !source.trim()))
    blockers.push("Sources or original SLAMS authorship provenance are required.");
  if (record.practiceRequirement.kind === "unapproved")
    blockers.push("Practice quota or competency protocol has not been approved.");
  else if (record.practiceRequirement.kind === "faculty_competence_protocol") {
    if (
      !record.practiceRequirement.observableCriteria.length ||
      record.practiceRequirement.observableCriteria.some((c) => !c.trim())
    )
      blockers.push("Competence policy needs observable, reviewable criteria.");
    if (!record.practiceRequirement.signedPolicyId)
      blockers.push("Competence policy needs an authenticated faculty release.");
  } else {
    if (
      !Number.isInteger(record.practiceRequirement.count) ||
      record.practiceRequirement.count <= 0 ||
      !record.practiceRequirement.sourceOrRationale.trim()
    )
      blockers.push("Repetition floor must have a positive count and verifiable provenance.");
    if (!record.practiceRequirement.signedPolicyId)
      blockers.push("Repetition floor needs an authenticated faculty release.");
  }
  if (record.reviewStatus !== "approved" || !record.facultyReleaseId)
    blockers.push("Exercise needs authenticated, versioned faculty content approval.");
  return { metadataComplete: blockers.length === 0, blockers };
}

/** Reporting only. User-submitted activity is NOT a competency or unlock record. */
export type PracticeEvent = {
  id: string;
  attemptId: string;
  schoolId: string;
  exerciseId: string;
  mode: TrainingMode;
  state:
    | "attempted"
    | "evidence_submitted"
    | "review_pending"
    | "revision_requested"
    | "faculty_accepted";
  facultyReviewId: string | null;
};
export function summarizePracticeEvents(
  events: PracticeEvent[],
  schoolId: string,
  exerciseId: string,
) {
  const matching = events.filter((e) => e.schoolId === schoolId && e.exerciseId === exerciseId);
  // Latest event for each practice attempt wins. Events arrive in chronological order.
  // This is a display helper; authoritative ordering and integrity are enforced server-side.
  const distinct = [...new Map(matching.map((e) => [e.attemptId, e])).values()];
  return {
    recordedAttempts: distinct.length,
    soloPreparation: distinct.filter((e) => e.mode === "solo").length,
    partnerOrGroupAttempts: distinct.filter((e) => e.mode !== "solo").length,
    pendingReview: distinct.filter(
      (e) => e.state === "evidence_submitted" || e.state === "review_pending",
    ).length,
    reportedAccepted: distinct.filter(
      (e) => e.state === "faculty_accepted" && !!e.facultyReviewId && e.mode !== "solo",
    ).length,
    // No client-derived "mastered", "passed" or "unlocked" field by design.
  };
}

export type PlacementReview = {
  schoolId: string;
  targetId: string;
  policyVersion: string;
  state:
    | "draft"
    | "evidence_submitted"
    | "faculty_review"
    | "revision_requested"
    | "not_assessable"
    | "approved";
  facultyReviewId: string | null;
};
/**
 * A display-only state; even an "approved" record cannot authorize navigation
 * until the server verifies faculty identity, policy, evidence, prerequisites,
 * enrollment, and actor ownership in a transaction.
 */
export function placementDisplayStatus(
  caseRecord: PlacementReview | null,
  schoolId: string,
  targetId: string,
  currentPublishedPolicyVersion: string | null,
) {
  if (!currentPublishedPolicyVersion)
    return {
      label: "Assessment unavailable",
      next: "Await faculty-reviewed policy",
      serverUnlock: false,
    };
  if (!caseRecord || caseRecord.schoolId !== schoolId || caseRecord.targetId !== targetId)
    return {
      label: "Not assessed",
      next: "Request a scoped placement assessment",
      serverUnlock: false,
    };
  if (caseRecord.policyVersion !== currentPublishedPolicyVersion)
    return {
      label: "Policy changed",
      next: "Request review under the current policy",
      serverUnlock: false,
    };
  if (caseRecord.state === "approved" && caseRecord.facultyReviewId)
    return {
      label: "Review recorded",
      next: "Request server-side eligibility verification",
      serverUnlock: false,
    };
  if (caseRecord.state === "approved")
    return {
      label: "Invalid approval",
      next: "Qualified faculty review is missing",
      serverUnlock: false,
    };
  if (caseRecord.state === "revision_requested")
    return {
      label: "Revision required",
      next: "Complete targeted practice and resubmit",
      serverUnlock: false,
    };
  if (caseRecord.state === "not_assessable")
    return {
      label: "Evidence inconclusive",
      next: "Use an accessible alternative or request human review",
      serverUnlock: false,
    };
  return {
    label: "Not yet approved",
    next: "Complete the assessment and faculty review",
    serverUnlock: false,
  };
}

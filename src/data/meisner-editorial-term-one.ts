/** Source-derived, non-credit-bearing editorial index.
 * Original SLAMS Content 03 Meisner Y1/T1 import v0.9 (private manuscript).
 * Distinct from the later 12-unit/36-term external research compendium.
 * Do not treat this as an approved course, import it as published content,
 * or use it to award unit/term credit.
 */
export const MEISNER_EDITORIAL_TERM_ONE = {
  schoolId: "meisner",
  termId: "meisner-t01",
  title: "Observation, repetition & responsiveness",
  editorialVersion: "SLAMS_CONTENT03_MEISNER_T01_v0.9",
  publicationAuthorized: false,
  graduationAllowed: false,
  courseCount: 3,
  workshopCount: 3,
  partnerCompetenceRequiresHumanReview: true,
  requiredOfficialReps: null,
  assessment: {
    id: "meisner-t01-jury",
    reviewRequired: true,
    passThreshold: null,
    graduationAllowed: false,
  },
  courses: [
    {
      id: "meisner-t01-c01",
      title: "Method Lab: Attention on the other person",
      workshopId: "meisner-t01-w01",
    },
    {
      id: "meisner-t01-c02",
      title: "Actor Instrument: Repetition foundations",
      workshopId: "meisner-t01-w02",
    },
    {
      id: "meisner-t01-c03",
      title: "Performance Studio: Instrument and listening",
      workshopId: "meisner-t01-w03",
    },
  ],
  workshops: [
    {
      id: "meisner-t01-w01",
      courseId: "meisner-t01-c01",
      title: "Attention on the other person",
    },
    {
      id: "meisner-t01-w02",
      courseId: "meisner-t01-c02",
      title: "Repetition foundations",
    },
    {
      id: "meisner-t01-w03",
      courseId: "meisner-t01-c03",
      title: "Instrument and listening",
    },
  ],
  lessons: [
    {
      id: "meisner-t01-w01-l01",
      title: "Describe directly observable partner behavior",
      objective:
        "Given a live partner, name a present, checkable action or physical change without guessing the partner’s internal state.",
      exerciseIds: ["meisner-t01-w01-e01"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w01-l02",
      title: "Avoid inferring private emotions from appearance",
      objective:
        "Revise an interpretive statement into an observation and a tentatively framed question or response.",
      exerciseIds: ["meisner-t01-w01-e01"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w01-l03",
      title: "Say what you notice and receive the response",
      objective:
        "Make a concrete observation aloud and allow the partner’s real response to determine the next beat.",
      exerciseIds: ["meisner-t01-w01-e02"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w02-l01",
      title: "The purpose and limits of repetition",
      objective:
        "Explain and begin a simple partnered repetition exchange without inventing new dialogue to impress the observer.",
      exerciseIds: ["meisner-t01-w02-e01"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w02-l02",
      title: "Allow a phrase to change with actual behavior",
      objective:
        "Recognize the difference between an organically prompted shift and an invented change for theatrical effect.",
      exerciseIds: ["meisner-t01-w02-e02"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w02-l03",
      title: "Stop planning the next line while responding",
      objective:
        "Identify one planning habit, interrupt it, and demonstrate a more partner-led response in a second attempt.",
      exerciseIds: ["meisner-t01-w02-e02"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w03-l01",
      title: "Speech availability and effortless volume",
      objective:
        "Use comfortable, audible speech without unnecessary pushing, then retain attention to the partner.",
      exerciseIds: ["meisner-t01-w03-e01"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w03-l02",
      title: "Recognize automatic self-monitoring during a task",
      objective:
        "Describe a self-monitoring habit from a real attempt and test a simple attentional reset.",
      exerciseIds: ["meisner-t01-w03-e02"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w03-l03",
      title: "Partner reflection on attentional shifts",
      objective:
        "After two partner exchanges, give evidence-based reflections and name one usable adjustment.",
      exerciseIds: ["meisner-t01-w03-e02"],
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
  ],
  exercises: [
    {
      id: "meisner-t01-w01-e01",
      title: "Evidence, Not Mind-Reading",
      linkedLessonIds: ["meisner-t01-w01-l01", "meisner-t01-w01-l02"],
      requiredMode: "partner_required",
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w01-e02",
      title: "Notice → Offer → Receive",
      linkedLessonIds: ["meisner-t01-w01-l03"],
      requiredMode: "partner_required",
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w02-e01",
      title: "The Plain Repetition Exchange",
      linkedLessonIds: ["meisner-t01-w02-l01"],
      requiredMode: "partner_required",
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w02-e02",
      title: "When the Moment Changes",
      linkedLessonIds: ["meisner-t01-w02-l02", "meisner-t01-w02-l03"],
      requiredMode: "partner_required",
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w03-e01",
      title: "Available Voice, Available Partner",
      linkedLessonIds: ["meisner-t01-w03-l01"],
      requiredMode: "partner_or_group",
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
    {
      id: "meisner-t01-w03-e02",
      title: "Partner Evidence: Two-Take Listening Lab",
      linkedLessonIds: ["meisner-t01-w03-l02", "meisner-t01-w03-l03"],
      requiredMode: "partner_or_group",
      reviewStatus: "DRAFT_AWAITING_QUALIFIED_MEISNER_EDUCATOR",
      publicationAuthorized: false,
    },
  ],
} as const;

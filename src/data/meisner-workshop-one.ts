/** Original SLAMS Content 03 v0.9, Meisner T01 Workshop 1.
 * Condensed teaching previews only; full unreviewed manuscripts stay private.
 * This is a SLAMS-designed preparation, not an official institutional syllabus.
 */
export const WORKSHOP_ONE = {
  id: "meisner-t01-w01",
  publicationAuthorized: false,
  masteryAwardAllowed: false,
  partnerReviewRequired: true,
  lessons: [
    { id: "meisner-t01-w01-l01",
      title: "Describe directly observable partner behavior",
      why: "Turn attention from performing an anticipated result toward observable action.",
      example: "You stopped tapping the chair is observable. You are nervous is an unverified assumption.",
      apply: "Notice a neutral present action or audible change. Describe it without deciding why.",
      caution: "Never make appearance judgments or insist you know another person's private emotions.",
      director: "You observed a fact. Do not invent the biography behind it."
    },
    { id: "meisner-t01-w01-l02",
      title: "Avoid inferring private emotions from appearance",
      why: "Separate observable events, personal experiences and interpretations.",
      example: "You folded your arms describes an action; you despise me invents a motive.",
      apply: "Name the behavior, acknowledge uncertainty, and consider another possible explanation.",
      caution: "This preparatory distinction does not prohibit imagination when developing fictional characters.",
      director: "You are here to listen, not to diagnose strangers."
    },
    { id: "meisner-t01-w01-l03",
      title: "Say what you notice and receive the response",
      why: "Let the real partner's reply affect the next unscripted beat.",
      example: "A: You looked at the window. B: I heard a car. A responds to that answer, not a rehearsed script.",
      apply: "Make a simple observation; let the reply finish; answer what happened.",
      caution: "A quiet or unexpected response is not failure. Both partners may pause.",
      director: "Do not prepare the reply before the other person speaks."
    }
  ],
  exercises: [
    { id: "meisner-t01-w01-e01", title: "Evidence, Not Mind-Reading", requiresPartner: true },
    { id: "meisner-t01-w01-e02", title: "Notice → Offer → Receive", requiresPartner: true }
  ]
} as const;

export const KNOWLEDGE_CHECK = [
  { id: "q1", statement: "Your shoulders moved.", answer: "observation", why: "Movement is checkable." },
  { id: "q2", statement: "You are resentful.", answer: "interpretation", why: "This assumes an inner feeling." },
  { id: "q3", statement: "I felt rushed when you interrupted.", answer: "experience", why: "It reports the speaker's experience." },
  { id: "q4", statement: "You are ignoring me.", answer: "interpretation", why: "Silence does not establish intent." }
] as const;

export type Mode = "solo" | "partner";
export type Category = "observation" | "interpretation" | "experience";
export type Notes = {
  observation: string; assumption: string; correction: string; partnerReply: string;
  expected: string; actual: string; adjusted: string; reflection: string; next: string;
};
export function emptyNotes(): Notes {
  return { observation: "", assumption: "", correction: "", partnerReply: "",
    expected: "", actual: "", adjusted: "", reflection: "", next: "" };
}
export function isCorrectAnswer(id: string, answer: Category) {
  return KNOWLEDGE_CHECK.find((q) => q.id === id)?.answer === answer;
}
export function canStart(mode: Mode, consent: boolean, boundaries: boolean) {
  return mode === "solo" || (consent && boundaries);
}
export function canContinue(mode: Mode, exercise: 0 | 1, notes: Notes) {
  if (exercise === 0) {
    return [notes.observation, notes.assumption, notes.correction,
      ...(mode === "partner" ? [notes.partnerReply] : [])].every((t) => !!t.trim());
  }
  return mode === "partner" && [notes.expected, notes.actual, notes.adjusted].every((t) => !!t.trim());
}
export function canSummarize(notes: Notes) {
  return !!notes.reflection.trim() && !!notes.next.trim();
}
export function practiceNote(mode: Mode, notes: Notes) {
  return [
    "SLAMS · Meisner Workshop 1 · user-authored practice note",
    "Editorial training preview; not reviewed or accredited. NO MASTERY OR TERM CREDIT.",
    "Mode: " + (mode === "solo" ? "solo preparation (not partner training)" : "partner practice (self-reported only)"),
    "Observed: " + notes.observation.trim(),
    "Assumption: " + notes.assumption.trim(),
    "Correction: " + notes.correction.trim(),
    ...(mode === "partner" ? [
      "Partner reply/correction (self-report): " + notes.partnerReply.trim(),
      "Expected reply: " + notes.expected.trim(),
      "Actual reply: " + notes.actual.trim(),
      "Changed response: " + notes.adjusted.trim()
    ] : []),
    "Reflection: " + notes.reflection.trim(),
    "Next practice: " + notes.next.trim(),
    "Evidence: learner reflection only, no reviewer; no Passport/cloud save."
  ].join("\n");
}

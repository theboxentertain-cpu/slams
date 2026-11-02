import type { DirectorExpression } from "./office-data";

export type CoachSection = "studio" | "school" | "conservatory" | "work" | "stuck" | "rehearsal" | "scene" | "passport" | "progress";
export const SECTION_COACH: Record<CoachSection, { expression: DirectorExpression; note: string; short: string }> = {
  studio: { expression: "bored", note: "A studio is for working. Pick your next move; I’ll keep the coffee company.", short: "Pick your next move." },
  school: { expression: "master", note: "Different school, different lens. Read what’s available. The work matters more than the label.", short: "One school. One clear lens." },
  conservatory: { expression: "observant", note: "Eight ways into the work. Choose a school, not a personality transplant.", short: "Choose a way into the work." },
  work: { expression: "critical", note: "Before the audition: who do you want something from, and what will you do to get it? Be specific.", short: "Make the objective specific." },
  stuck: { expression: "unimpressed", note: "Stuck isn’t a character flaw. Name the problem. Change one thing. Try again.", short: "Change one thing. Try again." },
  rehearsal: { expression: "observant", note: "You don’t need a perfect take. You need something concrete to try. I’ll stay quiet once you begin.", short: "Try something concrete." },
  scene: { expression: "observant", note: "Play the action, not the result. I’ll stay silent during takes.", short: "Play the action." },
  passport: { expression: "proud", note: "Your notes, not my verdict. Look for what changed between takes; let the record speak for itself.", short: "Look for what changed." },
  progress: { expression: "observant", note: "A record of the work, not a score for your talent. Only actual saved progress belongs here.", short: "The work, on record." },
};

export function coachPresence(mode: "on" | "quiet" | "off", performing: boolean) {
  return { visible: mode !== "off" && !performing, speaking: mode === "on" && !performing };
}
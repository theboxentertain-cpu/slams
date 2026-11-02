import { describe, expect, it } from "vitest";
import { coachPresence, SECTION_COACH } from "@/components/office/section-coach";

describe("Director presence rules", () => {
  it("OFF hides the coach", () => expect(coachPresence("off", false)).toEqual({ visible: false, speaking: false }));
  it("QUIET keeps a still, brief coach", () => expect(coachPresence("quiet", false)).toEqual({ visible: true, speaking: false }));
  it("ON enables expressive coaching outside takes", () => expect(coachPresence("on", false)).toEqual({ visible: true, speaking: true }));
  it.each(["on", "quiet", "off"] as const)("never interrupts a take in %s mode", mode => expect(coachPresence(mode, true)).toEqual({ visible: false, speaking: false }));
  it("assigns distinct reactions to work, stuck and Passport", () => {
    expect(SECTION_COACH.work.expression).toBe("critical");
    expect(SECTION_COACH.stuck.expression).toBe("unimpressed");
    expect(SECTION_COACH.passport.expression).toBe("proud");
  });
});
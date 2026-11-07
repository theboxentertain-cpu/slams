import { describe, expect, it } from "vitest";
import {
  MARKER_CATEGORIES,
  MARKER_LIMIT_PER_TAKE,
  formatLocalReview,
  formatTimecode,
  markerPrompt,
  validateMarker,
  type ReviewMarker,
} from "@/lib/performance-review-model";

const timestamped: ReviewMarker = {
  id: "one",
  take: "a",
  seconds: 12.75,
  category: "listening",
  observation: "I began responding before the other line ended.",
};
const other: ReviewMarker = {
  id: "two",
  take: "b",
  seconds: 3,
  category: "tactic",
  observation: "I switched from persuading to clarifying the request.",
};

describe("V2 playback markers and truthful review contracts", () => {
  it("formats a real finite playback position, rejecting invalid positions", () => {
    expect(formatTimecode(12.75)).toBe("00:12");
    expect(formatTimecode(65)).toBe("01:05");
    expect(formatTimecode(0)).toBe("00:00");
    expect(formatTimecode(Number.NaN)).toBe("--:--");
    expect(formatTimecode(-1)).toBe("--:--");
  });
  it("requires an actual position, bounded observation and supported category", () => {
    expect(validateMarker("a", 12, "listening", timestamped.observation, 0)).toBeNull();
    expect(validateMarker("a", Number.NaN, "tactic", timestamped.observation, 0)).toMatch(/Open and seek/);
    expect(validateMarker("a", 91, "tactic", timestamped.observation, 0)).toMatch(/Open and seek/);
    expect(validateMarker("a", -1, "tactic", timestamped.observation, 0)).toMatch(/Open and seek/);
    expect(validateMarker("a", 10, "guess", timestamped.observation, 0)).toMatch(/supported/);
    expect(validateMarker("a", 10, "listening", "vague", 0)).toMatch(/8–400/);
    expect(validateMarker("a", 10, "listening", "x".repeat(401), 0)).toMatch(/8–400/);
    expect(validateMarker("b", 10, "listening", timestamped.observation, MARKER_LIMIT_PER_TAKE)).toMatch(/Limit reached/);
  });
  it("provides five authored bilingual technique lenses, not emotional verdicts or observed AI claims", () => {
    expect(MARKER_CATEGORIES.map((c) => c.id)).toEqual([
      "listening", "objective", "tactic", "timing", "movement",
    ]);
    for (const lens of MARKER_CATEGORIES) {
      expect(lens.actionEn.length).toBeGreaterThan(40);
      expect(lens.actionAr.length).toBeGreaterThan(40);
    }
    const prompt = markerPrompt(timestamped, "en");
    expect(prompt.heading).toContain("not an AI verdict");
    expect(prompt.observation).toEqual(timestamped.observation);
    expect(prompt.exercise).toContain("Replay the marked moment");
    expect(prompt.caveat).toContain("did not watch or grade");
    expect(markerPrompt(timestamped, "ar").caveat).toContain("التطبيق لم يشاهد الأداء");
  });
  it("copies only actor-authored observations and the chosen objective, including exact timecodes", () => {
    const text = formatLocalReview(
      "en", "Ask for a clear answer",
      { a: "First take before note", b: "Second take after note" },
      "No detectable change", [other, timestamped],
    );
    expect(text).toContain("not graded");
    expect(text).toContain("Scene objective: Ask for a clear answer");
    expect(text).toContain("Take A: First take before note");
    expect(text).toContain("A [00:12] Listening / response: I began responding");
    expect(text).toContain("B [00:03] Tactic / adjustment: I switched");
    expect(text).toContain("No detectable change");
    expect(text).toContain("No media was analyzed or evaluated");
    expect(text).not.toMatch(/https:|blob:|talent score|you improved/i);
    const ar = formatLocalReview("ar", "أسمع الرد", { a: "", b: "" }, "", [timestamped]);
    expect(ar).toContain("هدف المشهد: أسمع الرد");
    expect(ar).toContain("A [00:12] الاستماع والاستجابة");
    expect(ar).toContain(timestamped.observation);
  });
  it("returns a useful empty-state report without invented evidence", () => {
    expect(formatLocalReview("en", "", { a: "", b: "" }, "", [])).toContain("No time-coded observations");
    expect(formatLocalReview("en", "", { a: "", b: "" }, "", [])).toContain("Not entered");
  });
});

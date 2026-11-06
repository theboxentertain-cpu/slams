import { describe, expect, it } from "vitest";
import { SCHOOLS, totalTerms } from "@/data/schools";
import { getObstacle } from "@/data/scene";

const expected: Record<string, [number, number]> = {
  stanislavski: [4, 8],
  meisner: [2, 4],
  adler: [3, 6],
  strasberg: [2, 6],
  chekhov: [2, 4],
  laban: [1, 2],
  "practical-aesthetics": [2, 4],
  viewpoints: [1, 2],
};

describe("provisional curriculum", () => {
  it("has exactly eight schools", () => expect(SCHOOLS).toHaveLength(8));
  for (const [slug, [y, t]] of Object.entries(expected)) {
    it(`${slug} has ${y} years and ${t} terms`, () => {
      const s = SCHOOLS.find((x) => x.slug === slug)!;
      expect(s.curriculum).toHaveLength(y);
      expect(totalTerms(s)).toBe(t);
    });
  }
  it("no term is marked complete", () => {
    for (const s of SCHOOLS)
      for (const y of s.curriculum)
        for (const t of y.terms) expect(t.status).toBe("in-development");
  });
});

describe("living scene branching", () => {
  it("different interventions produce different retake obstacles", () => {
    expect(getObstacle("plead", "meisner")).not.toBe(getObstacle("plead", "adler"));
  });
});

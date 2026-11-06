import { describe, expect, it } from "vitest";
import { validateCurriculumPack } from "@/lib/curriculum-schema";
import { compileCurriculumImport } from "@/lib/curriculum-import";
import { toCloudRows, shouldOfferImport } from "@/lib/migration";
import { progressInput } from "@/lib/unit-progress";
import { SCHOOLS } from "@/data/schools";
import type { PassportEntry } from "@/lib/store";

// Single-element tuples make these deliberately nonempty fixtures safe under
// noUncheckedIndexedAccess without weakening the production compiler settings.
const single = <T>(value: T): [T] => [value];
const pack = () => ({
  version: 1,
  schools: single({
    slug: "test",
    name: "Test",
    years: 1,
    terms: 1,
    curriculum: single({ number: 1, terms: single({ number: 1, courses: [] as unknown[] }) }),
  }),
});
describe("Curriculum honesty and stable imports", () => {
  it("accepts the actual 8 school / 36 term empty structure without inventing 432 lessons", () => {
    const result = validateCurriculumPack({ version: 1, schools: SCHOOLS });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.counts).toMatchObject({ schools: 8, terms: 36, lessons: 0 });
  });
  it("rejects nonexistent year numbering", () => {
    const p = pack();
    p.schools[0].curriculum[0].number = 2;
    expect(validateCurriculumPack(p).ok).toBe(false);
  });
  it("rejects nonexistent term numbering", () => {
    const p = pack();
    p.schools[0].curriculum[0].terms[0].number = 2;
    expect(validateCurriculumPack(p).ok).toBe(false);
  });
  it("rejects unknown fields rather than silently losing them", () =>
    expect(validateCurriculumPack({ ...pack(), typo: true }).ok).toBe(false));
  it("rejects publishing unreviewed empty material", () => {
    const p = pack();
    p.schools[0].curriculum[0].terms[0].courses.push({
      slug: "course",
      title: "Course",
      status: "published",
    });
    expect(validateCurriculumPack(p).ok).toBe(false);
  });
  it("supports 432 synthetic instructional units without seeding them into the app", () => {
    const p = pack();
    p.schools[0].curriculum[0].terms[0].courses.push({
      slug: "course",
      title: "Test",
      workshops: [
        {
          slug: "workshop",
          title: "Test",
          lessons: Array.from({ length: 432 }, (_, i) => ({
            slug: `lesson-${i}`,
            title: `Test ${i}`,
          })),
        },
      ],
    });
    const result = validateCurriculumPack(p);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.counts.lessons).toBe(432);
    const sql = compileCurriculumImport(p);
    expect(
      sql.filter((statement) => statement.startsWith("INSERT INTO public.curriculum_lessons")),
    ).toHaveLength(432);
    expect(sql.join("\n")).not.toContain("DELETE");
    expect(sql.at(-1)).toContain("curriculum_imports");
  });
});
describe("Explicit browser migration", () => {
  const entry: PassportEntry = {
    id: "00000000-0000-4000-8000-000000000001",
    date: "2026-10-27T00:00:00Z",
    tactic: "To plead",
    intervention: "Listening",
    exerciseNote: "Observed",
    obstacle: "Silence",
    retakeLine: "Stay",
    reflection: "Changed",
  };
  it("preserves entry identity for retry-safe imports", () =>
    expect(toCloudRows([entry], "owner")[0]).toMatchObject({
      id: entry.id,
      user_id: "owner",
      created_at: entry.date,
    }));
  it("excludes incomplete records so callers can retain them locally", () =>
    expect(toCloudRows([entry, { ...entry, reflection: " " }], "owner")).toHaveLength(1));
  it("offers import only when signed in with local records and no dismissal", () => {
    expect(shouldOfferImport(1, true, false)).toBe(true);
    expect(shouldOfferImport(1, false, false)).toBe(false);
    expect(shouldOfferImport(1, true, true)).toBe(false);
  });
  it("does not accept a browser-supplied owner for unit progress", () =>
    expect(
      progressInput.safeParse({
        unit_kind: "lesson",
        unit_id: entry.id,
        status: "completed",
        user_id: "other",
      }).success,
    ).toBe(false));
});

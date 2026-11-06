// Versioned, validated curriculum pack format (School > Year > Term > Course >
// Workshop > Lesson > Exercise > Assessment). Import packs are validated here
// before anything touches the database. Empty terms stay empty — a pack must
// never invent lessons to look complete.
import { z } from "zod";

export const PACK_VERSION = 1;

const status = z.enum(["in-development", "published", "archived"]);
const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");
const title = z.string().trim().min(1).max(500);
const material = {
  content: z.string().max(100000).default(""),
  reviewed: z.boolean().default(false),
  contentVersion: z.number().int().positive().default(1),
};

const assessmentSchema = z
  .object({ slug, title, ...material, status: status.default("in-development") })
  .strict();
const exerciseSchema = z
  .object({ slug, title, ...material, status: status.default("in-development") })
  .strict();
const lessonSchema = z
  .object({
    slug,
    title,
    ...material,
    status: status.default("in-development"),
    exercises: z.array(exerciseSchema).default([]),
    assessments: z.array(assessmentSchema).default([]),
  })
  .strict();
const workshopSchema = z
  .object({
    slug,
    title,
    ...material,
    status: status.default("in-development"),
    lessons: z.array(lessonSchema).default([]),
  })
  .strict();
const courseSchema = z
  .object({
    slug,
    title,
    ...material,
    status: status.default("in-development"),
    workshops: z.array(workshopSchema).default([]),
  })
  .strict();
const termSchema = z
  .object({
    number: z.number().int().positive(),
    status: status.default("in-development"),
    courses: z.array(courseSchema).default([]),
  })
  .strict();
const yearSchema = z
  .object({ number: z.number().int().positive(), terms: z.array(termSchema).default([]) })
  .strict();
const schoolSchema = z
  .object({
    slug,
    name: title,
    focus: z.string().default(""),
    years: z.number().int().positive(),
    terms: z.number().int().positive(),
    curriculum: z.array(yearSchema).default([]),
  })
  .strict();

export const curriculumPackSchema = z
  .object({
    version: z.literal(PACK_VERSION),
    source: z.string().default(""),
    schools: z.array(schoolSchema).min(1),
  })
  .strict();

export type CurriculumPack = z.infer<typeof curriculumPackSchema>;

export interface PackCounts {
  schools: number;
  years: number;
  terms: number;
  courses: number;
  workshops: number;
  lessons: number;
  exercises: number;
  assessments: number;
}

export type PackValidation =
  { ok: true; pack: CurriculumPack; counts: PackCounts } | { ok: false; errors: string[] };

function duplicateSlugs(items: { slug: string }[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const i of items) (seen.has(i.slug) ? dupes : seen).add(i.slug);
  return [...dupes];
}

/** Validate a parsed JSON pack. Returns typed data + counts, or a list of human-readable errors. */
export function validateCurriculumPack(input: unknown): PackValidation {
  const parsed = curriculumPackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    };
  }
  const pack = parsed.data;
  const errors: string[] = [];
  const counts: PackCounts = {
    schools: 0,
    years: 0,
    terms: 0,
    courses: 0,
    workshops: 0,
    lessons: 0,
    exercises: 0,
    assessments: 0,
  };

  for (const dup of duplicateSlugs(pack.schools)) errors.push(`duplicate school slug "${dup}"`);

  for (const school of pack.schools) {
    counts.schools++;
    if (school.curriculum.length !== school.years)
      errors.push(
        `${school.slug}: declares ${school.years} years but contains ${school.curriculum.length}`,
      );
    const termTotal = school.curriculum.reduce((a, y) => a + y.terms.length, 0);
    if (termTotal !== school.terms)
      errors.push(`${school.slug}: declares ${school.terms} terms but contains ${termTotal}`);

    const years = school.curriculum.map((year) => year.number).sort((a, b) => a - b);
    if (years.some((number, index) => number !== index + 1))
      errors.push(`${school.slug}: year numbers must be unique and consecutive`);
    const terms = school.curriculum.flatMap((year) => year.terms.map((term) => term.number));
    if (terms.some((number, index) => number !== index + 1))
      errors.push(`${school.slug}: term numbers must be unique, consecutive, and in year order`);
    for (const year of school.curriculum) {
      counts.years++;
      for (const term of year.terms) {
        counts.terms++;
        const where = `${school.slug} y${year.number} t${term.number}`;
        // Honesty rule: a term may be empty, but then it must say so.
        if (term.status === "published" && term.courses.length === 0)
          errors.push(
            `${where}: marked published but has no courses — empty terms must stay "in-development"`,
          );
        for (const dup of duplicateSlugs(term.courses))
          errors.push(`${where}: duplicate course slug "${dup}"`);

        for (const course of term.courses) {
          counts.courses++;
          checkMaterial(course, `${where}/${course.slug}`, errors);
          for (const dup of duplicateSlugs(course.workshops))
            errors.push(`${where}/${course.slug}: duplicate workshop slug "${dup}"`);
          for (const workshop of course.workshops) {
            counts.workshops++;
            checkMaterial(workshop, `${where}/${course.slug}/${workshop.slug}`, errors);
            for (const dup of duplicateSlugs(workshop.lessons))
              errors.push(
                `${where}/${course.slug}/${workshop.slug}: duplicate lesson slug "${dup}"`,
              );
            for (const lesson of workshop.lessons) {
              counts.lessons++;
              checkMaterial(
                lesson,
                `${where}/${course.slug}/${workshop.slug}/${lesson.slug}`,
                errors,
              );
              for (const unit of [...lesson.exercises, ...lesson.assessments])
                checkMaterial(unit, `${where}/${lesson.slug}/${unit.slug}`, errors);
              counts.exercises += lesson.exercises.length;
              counts.assessments += lesson.assessments.length;
              for (const dup of duplicateSlugs(lesson.exercises))
                errors.push(`${lesson.slug}: duplicate exercise slug "${dup}"`);
              for (const dup of duplicateSlugs(lesson.assessments))
                errors.push(`${lesson.slug}: duplicate assessment slug "${dup}"`);
            }
          }
        }
      }
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, pack, counts };
}

function checkMaterial(
  unit: { status: string; content: string; reviewed: boolean },
  path: string,
  errors: string[],
) {
  if (unit.status === "published" && (!unit.reviewed || !unit.content.trim()))
    errors.push(`${path}: published units require reviewed material`);
}

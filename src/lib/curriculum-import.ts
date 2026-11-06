import { validateCurriculumPack } from "@/lib/curriculum-schema";

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** Trusted operator import plan. Execute all statements in one database transaction.
 * No browser endpoint exposes this plan or a privileged database client.
 * Natural-key upserts retain UUIDs and existing progress across reimports.
 */
export function compileCurriculumImport(input: unknown): string[] {
  const result = validateCurriculumPack(input);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  const statements: string[] = [];
  for (const [position, school] of result.pack.schools.entries()) {
    statements.push(
      `INSERT INTO public.schools(slug,name,focus,years,terms,position) VALUES(${quote(school.slug)},${quote(school.name)},${quote(school.focus)},${school.years},${school.terms},${position}) ON CONFLICT(slug) DO UPDATE SET name=excluded.name,focus=excluded.focus,years=excluded.years,terms=excluded.terms,position=excluded.position;`,
    );
    const schoolId = `(SELECT id FROM public.schools WHERE slug=${quote(school.slug)})`;
    for (const year of school.curriculum) {
      statements.push(
        `INSERT INTO public.curriculum_years(school_id,number) VALUES(${schoolId},${year.number}) ON CONFLICT(school_id,number) DO NOTHING;`,
      );
      const yearId = `(SELECT id FROM public.curriculum_years WHERE school_id=${schoolId} AND number=${year.number})`;
      for (const term of year.terms) {
        statements.push(
          `INSERT INTO public.curriculum_terms(year_id,number,status) VALUES(${yearId},${term.number},${quote(term.status)}) ON CONFLICT(year_id,number) DO UPDATE SET status=excluded.status;`,
        );
        const termId = `(SELECT id FROM public.curriculum_terms WHERE year_id=${yearId} AND number=${term.number})`;
        for (const [i, course] of term.courses.entries()) {
          const courseId = addUnit("courses", "term_id", termId, course, i);
          for (const [j, workshop] of course.workshops.entries()) {
            const workshopId = addUnit("workshops", "course_id", courseId, workshop, j);
            for (const [k, lesson] of workshop.lessons.entries()) {
              const lessonId = addUnit("lessons", "workshop_id", workshopId, lesson, k);
              lesson.exercises.forEach((exercise, n) =>
                addUnit("exercises", "lesson_id", lessonId, exercise, n),
              );
              lesson.assessments.forEach((assessment, n) =>
                addUnit("assessments", "lesson_id", lessonId, assessment, n),
              );
            }
          }
        }
      }
    }
  }
  statements.push(
    `INSERT INTO public.curriculum_imports(pack_version,source,counts) VALUES(${result.pack.version},${quote(result.pack.source)},${quote(JSON.stringify(result.counts))}::jsonb);`,
  );
  return statements;

  function addUnit(
    table: string,
    parentColumn: string,
    parentId: string,
    unit: {
      slug: string;
      title: string;
      status: string;
      content: string;
      reviewed: boolean;
      contentVersion: number;
    },
    position: number,
  ) {
    statements.push(
      `INSERT INTO public.curriculum_${table}(${parentColumn},slug,title,status,content,reviewed,content_version,position) VALUES(${parentId},${quote(unit.slug)},${quote(unit.title)},${quote(unit.status)},${quote(unit.content)},${unit.reviewed},${unit.contentVersion},${position}) ON CONFLICT(${parentColumn},slug) DO UPDATE SET title=excluded.title,status=excluded.status,content=excluded.content,reviewed=excluded.reviewed,content_version=excluded.content_version,position=excluded.position WHERE public.curriculum_${table}.content_version <= excluded.content_version;`,
    );
    return `(SELECT id FROM public.curriculum_${table} WHERE ${parentColumn}=${parentId} AND slug=${quote(unit.slug)})`;
  }
}

import { T } from "@/lib/i18n";
import { MEISNER_EDITORIAL_TERM_ONE as pilot } from "@/data/meisner-editorial-term-one";
import { MeisnerWorkshopOne } from "./MeisnerWorkshopOne";

/**
 * Academic editorial preview; optional guided practice is session-only and cannot
 * award verified curriculum progress or replace real partner training.
 */
export function MeisnerAcademicPreview() {
  return (
    <section
      className="studio-sheet foundation-stack meisner-editorial-preview"
      aria-label="Meisner first term editorial preview"
    >
      <div className="availability-note">
        <h2>{pilot.title} · editorial preview</h2>
        <p>
          <T>
            This original SLAMS term draft contains nine lessons and six exercises across three
            workshops. It is not official Neighborhood Playhouse coursework, is awaiting qualified
            teaching review, and cannot award completion or mastery credit.
          </T>
        </p>
      </div>
      <p>
        <T>
          Partner observation and repetition require a consenting human partner. Solo preparation
          may help distinguish observations from assumptions, but cannot establish partner
          competence.
        </T>
      </p>
      <MeisnerWorkshopOne />
      <details className="meisner-term-outline">
        <summary>
          <T>Explore the term outline · Three workshops</T>
        </summary>
        {pilot.courses.map((course, index) => {
          const workshop = pilot.workshops.find((w) => w.id === course.workshopId);
          const prefix = workshop?.id ?? "";
          const lessons = pilot.lessons.filter((l) => l.id.startsWith(prefix + "-l"));
          const exercises = pilot.exercises.filter((e) => e.id.startsWith(prefix + "-e"));
          return (
            <section key={course.id} className="panel p-4">
              <h3>
                Workshop {index + 1} — {workshop?.title ?? course.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {course.title} · Awaiting faculty review
              </p>
              <h4 className="mt-3 font-bold">
                <T>Lessons · draft outline</T>
              </h4>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <details>
                      <summary className="cursor-pointer font-semibold">{lesson.title}</summary>
                      <p className="mt-1 text-sm">{lesson.objective}</p>
                      <p className="text-xs text-muted-foreground">
                        <T>
                          Educational draft only. The full manuscript is not published in this
                          preview.
                        </T>
                      </p>
                    </details>
                  </li>
                ))}
              </ol>
              <h4 className="mt-3 font-bold">
                <T>Applied exercises · draft inventory</T>
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {exercises.map((exercise) => (
                  <li key={exercise.id}>
                    {exercise.title}{" "}
                    <span className="text-xs text-muted-foreground">
                      (
                      {exercise.requiredMode === "partner_required"
                        ? "human partner required"
                        : "review required"}
                      )
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </details>
      <p className="text-sm text-muted-foreground">
        <T>
          Term assessment: instructor review required; pass threshold unset. No term graduation or
          accreditation is available.
        </T>
      </p>
    </section>
  );
}

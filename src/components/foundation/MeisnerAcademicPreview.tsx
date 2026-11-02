import { useState } from "react";
import { MEISNER_EDITORIAL_TERM_ONE as pilot } from "@/data/meisner-editorial-term-one";

/**
 * Read-only review preview. It does not call progress APIs or persist responses.
 * The solo prompt is a non-assessed preparation exercise, not Meisner partner work.
 */
export function MeisnerAcademicPreview() {
  const [observation, setObservation] = useState("");
  const [inference, setInference] = useState("");
  const [showReflection, setShowReflection] = useState(false);

  return (
    <section className="studio-sheet foundation-stack" aria-label="Meisner first term editorial preview">
      <div className="availability-note">
        <h2>Foundations of repetition · editorial preview</h2>
        <p>
          This original SLAMS term draft contains nine lessons and six exercises across three
          workshops. It is not official Neighborhood Playhouse coursework, is awaiting qualified
          teaching review, and cannot award completion or mastery credit.
        </p>
      </div>
      <p>
        Partner observation and repetition require a consenting human partner. Solo preparation
        may help distinguish observations from assumptions, but cannot establish partner competence.
      </p>
      {pilot.courses.map((course, index) => {
        const workshop = pilot.workshops.find((w) => w.id === course.workshopId);
        const prefix = workshop?.id ?? "";
        const lessons = pilot.lessons.filter((l) => l.id.startsWith(prefix + "-l"));
        const exercises = pilot.exercises.filter((e) => e.id.startsWith(prefix + "-e"));
        return (
          <section key={course.id} className="panel p-4">
            <h3>Workshop {index + 1} — {workshop?.title ?? course.title}</h3>
            <p className="text-sm text-muted-foreground">{course.title} · Awaiting faculty review</p>
            <h4 className="mt-3 font-bold">Lessons · draft outline</h4>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <details>
                    <summary className="cursor-pointer font-semibold">{lesson.title}</summary>
                    <p className="mt-1 text-sm">{lesson.objective}</p>
                    <p className="text-xs text-muted-foreground">
                      Educational draft only. The full manuscript is not published in this preview.
                    </p>
                  </details>
                </li>
              ))}
            </ol>
            <h4 className="mt-3 font-bold">Applied exercises · draft inventory</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  {exercise.title} <span className="text-xs text-muted-foreground">
                    ({exercise.requiredMode === "partner_required" ? "human partner required" : "review required"})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <section className="panel p-4" aria-label="Optional observation preparation">
        <h3>Try a solo observation preparation</h3>
        <p>
          This short written reflection practices separating a checkable observation from an
          interpretation. It is not the partner-repetition exercise, an assessment, or a saved record.
        </p>
        <label htmlFor="meisner-observation" className="mt-3 block font-semibold">
          Describe one visible or audible event, without stating why it happened.
        </label>
        <textarea
          id="meisner-observation"
          className="mt-2 w-full rounded border border-border bg-background p-3 text-foreground"
          rows={3}
          value={observation}
          onChange={(value) => {
            setObservation(value.target.value);
            setShowReflection(false);
          }}
        />
        <label htmlFor="meisner-inference" className="mt-3 block font-semibold">
          What unverified interpretation might someone attach to that event?
        </label>
        <textarea
          id="meisner-inference"
          className="mt-2 w-full rounded border border-border bg-background p-3 text-foreground"
          rows={3}
          value={inference}
          onChange={(value) => {
            setInference(value.target.value);
            setShowReflection(false);
          }}
        />
        <button
          type="button"
          className="btn-primary mt-3"
          disabled={!observation.trim() || !inference.trim()}
          onClick={() => setShowReflection(true)}
        >
          Reflect on the distinction
        </button>
        {showReflection && (
          <div role="status" className="availability-note mt-3">
            <p>
              Ask yourself: Could an observer independently verify the first sentence?
              Could the second have several possible explanations? If unsure, revise your
              wording. No software assessment or competence claim is made.
            </p>
            <p>These responses stay only in this open screen and are not saved.</p>
          </div>
        )}
      </section>
      <p className="text-sm text-muted-foreground">
        Term assessment: instructor review required; pass threshold unset. No term
        graduation or accreditation is available.
      </p>
    </section>
  );
}

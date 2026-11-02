import { Link } from "@tanstack/react-router";
import { useCatalog, useTrainingProgress, resolveResume, type TrainingUnit } from "@/lib/training";
import { getSchool } from "@/data/schools";
export function UnitLink({ unit, children }: { unit: TrainingUnit; children?: React.ReactNode }) {
  return (
    <Link
      to="/conservatory/$school/units/$kind/$unitId"
      params={{ school: unit.school, kind: unit.kind, unitId: unit.id }}
    >
      {children ?? unit.title}
    </Link>
  );
}
export function TrainingSummary({ school }: { school?: string }) {
  const catalog = useCatalog();
  const progress = useTrainingProgress();
  const current = progress.records
    ? resolveResume(
        catalog.units.filter((u) => !school || u.school === school),
        progress.records,
      )
    : null;
  return (
    <section className="training-summary" aria-label="Current training">
      <span className="office-kicker">YOUR NEXT PAGE</span>
      {current ? (
        <>
          <h2>{getSchool(current.school)?.name}</h2>
          <p>
            Year {current.year} · Term {current.term} · Started
          </p>
          <UnitLink unit={current}>Continue training: {current.title}</UnitLink>
        </>
      ) : (
        <>
          <h2>
            {progress.loading
              ? "Checking your training…"
              : !progress.signedIn
                ? "Find your way into the craft."
                : progress.error || catalog.isError
                  ? "Training status unavailable."
                  : "No available started unit."}
          </h2>
          <p>
            {!progress.signedIn
              ? "Sign in to view account curriculum progress."
              : "A resume link appears only for a saved, started unit with reviewed published material."}
          </p>
          <Link to={progress.signedIn ? "/progress" : "/conservatory"}>
            {progress.signedIn ? "Review training progress" : "Explore the Conservatory"}
          </Link>
        </>
      )}
    </section>
  );
}

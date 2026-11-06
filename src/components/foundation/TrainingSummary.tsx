import { T } from "@/lib/i18n";
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
export function TrainingSummary({
  school,
  variant = "default",
}: {
  school?: string;
  variant?: "default" | "office";
}) {
  const catalog = useCatalog();
  const progress = useTrainingProgress();
  const current = progress.records
    ? resolveResume(
        catalog.units.filter((u) => !school || u.school === school),
        progress.records,
      )
    : null;
  if (variant === "office")
    return (
      <section className="training-summary office-training-card" aria-label="Current training">
        <span className="office-kicker">
          {current ? "CURRENT TRAINING" : "YOUR NEXT REHEARSAL"}
        </span>
        <h2>{current ? getSchool(current.school)?.name : "Your next scene is waiting."}</h2>
        <p>
          {current
            ? `Year ${current.year} · Term ${current.term} · ${current.title}`
            : "Make a choice. Try a new approach. See what changes."}
        </p>
        {current ? (
          <UnitLink unit={current}>Continue training: {current.title}</UnitLink>
        ) : (
          <Link to="/scene" aria-label="Start rehearsal — The Living Scene"><T>
            Start rehearsal </T><span aria-hidden="true">→</span>
          </Link>
        )}
        {!current && (progress.error || catalog.isError) && progress.signedIn && (
          <small><T>Curriculum status is unavailable. Your scripted rehearsal is ready.</T></small>
        )}
        {!current && progress.loading && (
          <small role="status"><T>Checking your account training…</T></small>
        )}
      </section>
    );
  return (
    <section className="training-summary" aria-label="Current training">
      <span className="office-kicker"><T>YOUR NEXT PAGE</T></span>
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

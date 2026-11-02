import { Link } from "@tanstack/react-router";
import { Page } from "@/components/slams";
import { usePassport } from "@/lib/store";
import { SCHOOLS } from "@/data/schools";
import { useCatalog, useTrainingProgress, schoolHasProgress } from "@/lib/training";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { TrainingSummary } from "./TrainingSummary";
export function ProgressPage({
  tab,
  onTabChange,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  const passport = usePassport();
  const progress = useTrainingProgress();
  const catalog = useCatalog();
  const count = passport.loaded && !passport.error ? passport.entries.length : null;
  return (
    <Page title="Your progress" eyebrow="YOUR WORK, ON RECORD" backTo="/">
      <p className="section-intro">
        {passport.signedIn ? "Account records" : "Rehearsal records in this browser"}. Counts
        describe saved work, not acting ability.
      </p>
      <dl className="progress-counts">
        <div>
          <dt>Rehearsal records loaded</dt>
          <dd>{count ?? "—"}</dd>
        </div>
        <div>
          <dt>Curriculum units completed</dt>
          <dd>{progress.records?.filter((r) => r.status === "completed").length ?? "—"}</dd>
        </div>
      </dl>
      {passport.error && (
        <p role="alert">
          Rehearsal records could not be loaded. <Link to="/passport">Open Passport to retry.</Link>
        </p>
      )}
      {progress.error && (
        <div role="alert">
          Account curriculum records are unavailable.{" "}
          <button className="preference-button" onClick={() => void progress.retry()}>
            Retry progress
          </button>
        </div>
      )}
      {!progress.signedIn && !progress.loading && (
        <p>
          <Link to="/auth">Sign in</Link> for account curriculum milestones.
        </p>
      )}
      <SectionTabs page="progress" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "by-skill" ? (
            <Unavailable>
              Reviewed skill criteria and evidence mapping are not available. No skill scores or
              competence estimates are calculated.
            </Unavailable>
          ) : current === "history" ? (
            <section className="foundation-stack">
              <h2>Recorded work</h2>
              <Link to="/passport">Read saved rehearsal reflections</Link>
              {progress.loading ? (
                <p role="status">Loading curriculum history…</p>
              ) : progress.records ? (
                progress.records.length ? (
                  <ul className="foundation-stack">
                    {[...progress.records]
                      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                      .map((r) => {
                        const unit = catalog.units.find(
                          (u) => u.id === r.unit_id && u.kind === r.unit_kind,
                        );
                        return (
                          <li key={`${r.unit_kind}:${r.unit_id}`} className="panel p-3">
                            <strong>
                              {unit?.title ?? "Curriculum record · details unavailable"}
                            </strong>
                            <p>
                              {r.status} · {new Date(r.updated_at).toLocaleString()}
                            </p>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p>No curriculum activity recorded.</p>
                )
              ) : (
                <p>Curriculum history unavailable.</p>
              )}
            </section>
          ) : (
            <section className="foundation-stack">
              <TrainingSummary />
              {catalog.isError && (
                <p role="alert">
                  School attribution is unavailable while the curriculum catalog cannot be loaded.
                </p>
              )}
              <ul className="school-progress-list">
                {SCHOOLS.map((school) => (
                  <li key={school.slug}>
                    <Link to="/conservatory/$school" params={{ school: school.slug }}>
                      {school.name}
                    </Link>
                    <span>
                      {!progress.records || !catalog.isSuccess
                        ? "Status unavailable"
                        : schoolHasProgress(school.slug, catalog.units, progress.records)
                          ? "Recorded activity"
                          : "No mapped activity"}
                    </span>
                  </li>
                ))}
              </ul>
              <p>
                Whole-school completion and advancement require reviewed requirements; unit counts
                alone do not establish them.
              </p>
            </section>
          )
        }
      </SectionTabs>
    </Page>
  );
}

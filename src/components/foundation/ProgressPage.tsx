import { T } from "@/lib/i18n";
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
    <Page title="Your progress" eyebrow="YOUR WORK, ON RECORD" backTo="/" world="progress">
      <p className="section-intro">
        {passport.signedIn ? "Account records" : "Rehearsal records in this browser"}. Counts
        describe saved work, not acting ability.
      </p>
      <dl className="progress-counts">
        <div>
          <dt><T>Rehearsal records loaded</T></dt>
          <dd>{count ?? "—"}</dd>
        </div>
        <div>
          <dt><T>Legacy unit completion markers (unverified)</T></dt>
          <dd>{progress.records?.filter((r) => r.status === "completed").length ?? "—"}</dd>
        </div>
      </dl>
      {passport.error && (
        <p role="alert"><T>
          Rehearsal records could not be loaded. </T><Link to="/passport"><T>Open Passport to retry.</T></Link>
        </p>
      )}
      {progress.error && (
        <div role="alert">
          Account curriculum records are unavailable.{" "}
          <button className="preference-button" onClick={() => void progress.retry()}><T>
            Retry progress
          </T></button>
        </div>
      )}
      {!progress.signedIn && !progress.loading && (
        <p>
          <Link to="/auth"><T>Sign in</T></Link><T> for account curriculum milestones.
        </T></p>
      )}
      <SectionTabs page="progress" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "by-skill" ? (
            <Unavailable><T>
              Reviewed skill criteria and evidence mapping are not available. No skill scores or
              competence estimates are calculated.
            </T></Unavailable>
          ) : current === "history" ? (
            <section className="foundation-stack">
              <h2><T>Recorded work</T></h2>
              <Link to="/passport"><T>Read saved rehearsal reflections</T></Link>
              {progress.loading ? (
                <p role="status"><T>Loading curriculum history…</T></p>
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
                              {r.status === "completed" ? "Legacy recorded completion (not assessed)" : "Started activity"} · {new Date(r.updated_at).toLocaleString()}
                            </p>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p><T>No curriculum activity recorded.</T></p>
                )
              ) : (
                <p><T>Curriculum history unavailable.</T></p>
              )}
            </section>
          ) : (
            <section className="foundation-stack">
              <TrainingSummary />
              {catalog.isError && (
                <p role="alert"><T>
                  School attribution is unavailable while the curriculum catalog cannot be loaded.
                </T></p>
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
              <p><T>
                Whole-school completion and advancement require reviewed requirements; unit counts
                alone do not establish them.
              </T></p>
            </section>
          )
        }
      </SectionTabs>
    </Page>
  );
}

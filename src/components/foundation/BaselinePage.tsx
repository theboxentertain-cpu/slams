import { T } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Compass,
  Drama,
  NotebookPen,
  Play,
  ScrollText,
  Target,
} from "lucide-react";
import { Page } from "@/components/slams";
import { useActorSetup } from "@/lib/actor-setup";
import { SUPPORT_PAGES } from "@/lib/foundation";
import { enterStudio } from "@/lib/studio-entry";

const PRACTICE_STEPS = [
  {
    title: "Prepare",
    detail: "Read the scene circumstances and objective.",
    to: "/scene",
    Icon: ScrollText,
  },
  {
    title: "Perform",
    detail: "Try a scripted choice, then a new approach.",
    to: "/scene",
    Icon: Clapperboard,
  },
  {
    title: "Reflect",
    detail: "Review your saved reflections in your Passport.",
    to: "/passport",
    Icon: NotebookPen,
  },
  {
    title: "Next steps",
    detail: "Choose where you want to work next.",
    to: "/conservatory",
    Icon: Compass,
  },
] as const;

/** Saved self-description and real practice links, without a simulated assessment. */
export function BaselineContent({ welcome = false }: { welcome?: boolean }) {
  const setup = useActorSetup();
  const onEnter = welcome ? enterStudio : undefined;
  const hasSelfReport = !!setup.data.experience || setup.data.goals.length > 0;
  return (
    <div className="baseline-experience">
      <section className="availability-note baseline-availability">
        <span className="baseline-eyebrow"><T>BEFORE WE TRAIN</T></span>
        <h2><T>Begin with something you can try.</T></h2>
        <p>
          {welcome
            ? "Guided baseline assessments are still in development. You can begin with the working, text-only Living Scene and save your own reflection."
            : SUPPORT_PAGES.baseline.message}
        </p>
      </section>

      <section className="baseline-record" aria-labelledby="baseline-record-title">
        <div className="baseline-section-heading">
          <Drama aria-hidden="true" />
          <div>
            <span className="baseline-eyebrow"><T>YOUR STARTING RECORD</T></span>
            <h2 id="baseline-record-title"><T>In your own words</T></h2>
          </div>
        </div>
        {!setup.ready ? (
          <p role="status" className="baseline-record-state"><T>
            Checking your saved starting point…
          </T></p>
        ) : setup.error ? (
          <div className="baseline-record-state">
            <p role="alert">{setup.error}</p>
            <p><T>Your saved self-description is unavailable. You can still begin a rehearsal.</T></p>
          </div>
        ) : hasSelfReport ? (
          <>
            <div className="baseline-profile-sheets">
              <section className="baseline-paper">
                <Drama aria-hidden="true" />
                <h3><T>Your experience</T></h3>
                <p>{setup.data.experience ?? "No experience selected."}</p>
              </section>
              <section className="baseline-paper">
                <Target aria-hidden="true" />
                <h3><T>Your chosen direction</T></h3>
                {setup.data.goals.length > 0 ? (
                  <ul>
                    {setup.data.goals.map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                ) : (
                  <p><T>No goals selected.</T></p>
                )}
              </section>
            </div>
            <p className="baseline-self-report-note"><T>
              These are your saved preferences, not a diagnosis or a training score. Your choices
              are stored on this device.
            </T></p>
          </>
        ) : (
          <div className="baseline-record-state">
            <p><T>No self-description saved.</T></p>
            <p><T>You can begin with a scene and record your own observations as you go.</T></p>
          </div>
        )}
      </section>

      <section className="baseline-practice" aria-labelledby="baseline-practice-title">
        <h2 id="baseline-practice-title" className="baseline-ribbon"><T>
          A way into the work
        </T></h2>
        <ol className="baseline-practice-path">
          {PRACTICE_STEPS.map(({ title, detail, to, Icon }, index) => (
            <li key={title}>
              <Link to={to} onClick={onEnter}>
                <span className="baseline-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{detail}</p>
                <ArrowRight className="baseline-step-arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <Link className="baseline-start" to="/scene" onClick={onEnter}>
          <Play aria-hidden="true" />
          {welcome ? "Start a first rehearsal" : SUPPORT_PAGES.baseline.label}
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <nav className="baseline-related" aria-label="Continue in the studio">
        <Link to="/conservatory" onClick={onEnter}>
          <BookOpen aria-hidden="true" />
          <span><T>
            Explore the schools</T><small><T>Eight ways into the work</T></small>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/work" onClick={onEnter}>
          <Clapperboard aria-hidden="true" />
          <span><T>
            Prepare an audition</T><small><T>Bring your own circumstances</T></small>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
      {welcome && (
        <Link className="welcome-skip" to="/" onClick={enterStudio}><T>
          Skip to the Office
        </T></Link>
      )}
    </div>
  );
}

export function BaselinePage() {
  return (
    <Page title="Actor’s Baseline" eyebrow="YOUR STARTING POINT" world="baseline">
      <BaselineContent />
    </Page>
  );
}

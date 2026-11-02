import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useAuditionPrep, usePassport } from "@/lib/store";
import { DRAFT_INTERVENTIONS } from "@/data/stuck";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { AuditionWorkspace } from "./AuditionWorkspace";
type TabProps = { tab: string; onTabChange: (tab: string) => void };

export function WorkHub({ tab, onTabChange }: TabProps) {
  const prep = useAuditionPrep();
  return (
    <Page title="Actor at Work" eyebrow="DO THE WORK" backTo="/">
      <p className="section-intro">
        Practical preparation for the room. Start with your own circumstances and playable choices.
      </p>
      <SectionTabs page="work" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "auditions" ? (
            <section className="foundation-stack">
              <h2>Your audition preparation</h2>
              {!prep.loaded ? (
                <p role="status">Loading audition notes…</p>
              ) : prep.error ? (
                <p role="alert">
                  Your audition notes could not be loaded. Open preparation to retry.
                </p>
              ) : (
                <p>{prep.data["role"] || "Your personal audition-preparation workspace."}</p>
              )}
              <Link to="/work/audition" search={{ tab: "preparation" }} className={btnPrimary}>
                Open audition preparation
              </Link>
              <p className="text-sm text-muted-foreground">
                Multiple audition files and deadlines are in development.
              </p>
            </section>
          ) : (
            <section className="foundation-stack">
              <Unavailable>
                {current === "projects"
                  ? "Project files, saved scripts and revision history are in development."
                  : current === "characters"
                    ? "Dedicated character files are in development. Existing audition notes remain available."
                    : "Recording, playback and export are not implemented."}
              </Unavailable>
              {current === "projects" ? (
                <>
                  <Link to="/work/journal">Open Project Journal</Link>
                  <Link to="/work/breakdown">Open Scene Breakdown</Link>
                </>
              ) : current === "characters" ? (
                <Link to="/work/character">Open Character File</Link>
              ) : (
                <Link to="/work/self-tape">Open Self-Tape Studio</Link>
              )}
            </section>
          )
        }
      </SectionTabs>
    </Page>
  );
}
export function AuditionFile({ tab, onTabChange }: TabProps) {
  const prep = useAuditionPrep();
  return (
    <Page title="Audition File" eyebrow="Actor at Work" backTo="/work">
      <SectionTabs page="audition" value={tab} onChange={onTabChange} keepMounted>
        {(current) =>
          current === "preparation" ? (
            <AuditionWorkspace prep={prep} />
          ) : current === "script" ? (
            <Unavailable>
              Saved scripts and sides are in development. Your current preparation notes are
              preserved.
            </Unavailable>
          ) : (
            <section className="foundation-stack">
              <h2>{current === "brief" ? "Your brief" : "Your character choices"}</h2>
              {!prep.loaded ? (
                <p role="status">Loading notes…</p>
              ) : prep.error ? (
                <p role="alert">Notes unavailable. Open Preparation to retry.</p>
              ) : (
                <dl className="saved-choices">
                  {(current === "brief"
                    ? ["role"]
                    : ["circumstances", "objective", "obstacle", "action"]
                  ).map((key) => (
                    <div key={key}>
                      <dt>
                        {
                          (
                            {
                              role: "Role & project",
                              circumstances: "Given circumstances",
                              objective: "Objective",
                              obstacle: "Obstacle",
                              action: "Playable action",
                            } as Record<string, string>
                          )[key]
                        }
                      </dt>
                      <dd>{prep.data[key] || "Not entered"}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {current === "character" && (
                <p>
                  These are your own preparation notes; script-supported facts and interpretations
                  are not classified automatically.
                </p>
              )}
              <button className={btnPrimary} onClick={() => onTabChange("preparation")}>
                Edit preparation
              </button>
            </section>
          )
        }
      </SectionTabs>
    </Page>
  );
}
export function RehearsalHub({ tab, onTabChange }: TabProps) {
  const passport = usePassport();
  return (
    <Page title="Rehearsal Studio" eyebrow="MAKE THE WORK ACTIVE" backTo="/">
      <SectionTabs page="rehearsal" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "my-scenes" ? (
            <section className="foundation-stack">
              <span className="office-kicker">ORIGINAL SCRIPTED DEMONSTRATION</span>
              <h2>“Stay”</h2>
              <p>
                Explore, perform, intervene, practice, retake and reflect. The partner responses are
                fixed; no recording, analysis or grading takes place.
              </p>
              <Link to="/scene" className={btnPrimary}>
                Start rehearsal
              </Link>
              <p>
                Rehearsal drafts and personal scene libraries are in development. Completed
                reflections remain in Passport.
              </p>
            </section>
          ) : current === "new-scene" ? (
            <section className="foundation-stack">
              <Unavailable>
                Importing and saving your own scripts is in development. The working demonstration
                is available now.
              </Unavailable>
              <Link to="/scene" className={btnPrimary}>
                Try the demonstration
              </Link>
            </section>
          ) : (
            <section className="foundation-stack">
              <h2>Saved rehearsal records</h2>
              {!passport.loaded ? (
                <p role="status">Loading records…</p>
              ) : passport.error ? (
                <p role="alert">Saved records could not be loaded.</p>
              ) : (
                <p>
                  {passport.entries.length} completed rehearsal{" "}
                  {passport.entries.length === 1 ? "record" : "records"} saved{" "}
                  {passport.signedIn ? "to your account" : "in this browser"}.
                </p>
              )}
              <Link to="/passport" className={btnPrimary}>
                Open rehearsal history
              </Link>
              <p>These are completed reflection records, not resumable or live sessions.</p>
              <Link to="/lab">Performance Lab</Link>
              <Link to="/lounge">Rehearsal Lounge</Link>
            </section>
          )
        }
      </SectionTabs>
    </Page>
  );
}
export function DraftInterventions() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <p className="section-intro">
        Existing draft interventions — pending faculty review. These suggestions do not analyze or
        grade a performance.
      </p>
      <ul className="foundation-stack">
        {DRAFT_INTERVENTIONS.map((p, i) => (
          <li className="panel p-4" key={p.q}>
            <button
              className={`${btnSecondary} w-full text-left`}
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {p.q}
            </button>
            {open === i && (
              <div className="foundation-stack mt-3">
                <p className="font-bold text-amber">{p.school}</p>
                <p>{p.fix}</p>
                <Link to="/scene">Practice in the scripted demonstration</Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
export function StuckIntake({ tab, onTabChange }: TabProps) {
  return (
    <Page title="The Stuck Desk" eyebrow="FIX WHAT ISN’T WORKING" backTo="/">
      <SectionTabs page="stuck" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "describe" ? (
            <DraftInterventions />
          ) : (
            <Unavailable>
              {current === "scene"
                ? "Saving a scene-specific problem intake is in development. Use the existing draft suggestions or run the demonstration scene."
                : "Structured problem intake and diagnosis are in development. No cause has been inferred from your performance."}
            </Unavailable>
          )
        }
      </SectionTabs>
      <nav className="context-links" aria-label="Stuck Desk workflow">
        <Link to="/stuck/diagnosis">Diagnosis</Link>
        <Link to="/stuck/intervention">Draft interventions</Link>
        <Link to="/stuck/retry">Retry</Link>
        <Link to="/stuck/saved">Saved fixes</Link>
      </nav>
    </Page>
  );
}
export function StuckIntervention({ tab, onTabChange }: TabProps) {
  return (
    <Page
      title="Stuck Desk · Interventions"
      eyebrow="Draft · Pending faculty review"
      backTo="/stuck"
    >
      <SectionTabs page="intervention" value={tab} onChange={onTabChange}>
        {() => <DraftInterventions />}
      </SectionTabs>
    </Page>
  );
}

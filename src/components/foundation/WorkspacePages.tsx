import { T } from "@/lib/i18n";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useAuditionPrep, usePassport } from "@/lib/store";
import { DRAFT_INTERVENTIONS } from "@/data/stuck";
import { StuckDeskGuided } from "./StuckDeskGuided";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { AuditionWorkspace } from "./AuditionWorkspace";
import { SUPPORT_PAGES } from "@/lib/foundation";
type TabProps = { tab: string; onTabChange: (tab: string) => void };

export function WorkHub({ tab, onTabChange }: TabProps) {
  const prep = useAuditionPrep();
  return (
    <Page title="Actor at Work" eyebrow="DO THE WORK" backTo="/" world="work">
      <p className="section-intro">
        <T>
          Practical preparation for the room. Start with your own circumstances and playable
          choices.
        </T>
      </p>
      {tab === "auditions" ? (
        <section className="foundation-stack">
          <h2>
            <T>Your audition preparation</T>
          </h2>
          {!prep.loaded ? (
            <p role="status">
              <T>Loading audition notes…</T>
            </p>
          ) : prep.error ? (
            <p role="alert">
              <T>Your audition notes could not be loaded. Open preparation to retry.</T>
            </p>
          ) : (
            <p>{prep.data["role"] || "Your personal audition-preparation workspace."}</p>
          )}
          <Link to="/work/audition" search={{ tab: "preparation" }} className={btnPrimary}>
            <T>Open audition preparation</T>
          </Link>
          <p className="text-sm text-muted-foreground">
            <T>Multiple audition files and deadlines are in development.</T>
          </p>
        </section>
      ) : (
        <section className="foundation-stack">
          <Unavailable>
            {tab === "projects"
              ? "Project files, saved scripts and revision history are in development."
              : tab === "characters"
                ? "Dedicated character files are in development. Existing audition notes remain available."
                : "Recording, playback and export are not implemented."}
          </Unavailable>
          <button className={btnPrimary} onClick={() => onTabChange("auditions")}>
            <T>Back to audition preparation</T>
          </button>
        </section>
      )}
      <details className="planned-tools">
        <summary>
          <T>Tools in development</T>
        </summary>
        <p>
          <T>These tools are not available yet. Your audition preparation remains available.</T>
        </p>
        <ul>
          {(["character", "breakdown", "selfTape", "journal"] as const).map((id) => {
            const tool = SUPPORT_PAGES[id];
            return (
              <li key={id}>
                <Link to={tool.to}>View {tool.title} availability</Link>
              </li>
            );
          })}
        </ul>
      </details>
    </Page>
  );
}
export function AuditionFile({ tab, onTabChange }: TabProps) {
  const prep = useAuditionPrep();
  return (
    <Page title="Audition File" eyebrow="Actor at Work" backTo="/work" world="work">
      <SectionTabs page="audition" value={tab} onChange={onTabChange} keepMounted>
        {(current) =>
          current === "preparation" ? (
            <AuditionWorkspace prep={prep} />
          ) : current === "script" ? (
            <Unavailable>
              <T>
                Saved scripts and sides are in development. Your current preparation notes are
                preserved.
              </T>
            </Unavailable>
          ) : (
            <section className="foundation-stack">
              <h2>{current === "brief" ? "Your brief" : "Your character choices"}</h2>
              {!prep.loaded ? (
                <p role="status">
                  <T>Loading notes…</T>
                </p>
              ) : prep.error ? (
                <p role="alert">
                  <T>Notes unavailable. Open Preparation to retry.</T>
                </p>
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
                  <T>
                    These are your own preparation notes; script-supported facts and interpretations
                    are not classified automatically.
                  </T>
                </p>
              )}
              <button className={btnPrimary} onClick={() => onTabChange("preparation")}>
                <T>Edit preparation</T>
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
    <Page title="Rehearsal Studio" eyebrow="MAKE THE WORK ACTIVE" backTo="/" world="rehearsal">
      <SectionTabs page="rehearsal" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "my-scenes" ? (
            <section className="foundation-stack">
              <span className="office-kicker">
                <T>ORIGINAL SCRIPTED DEMONSTRATION</T>
              </span>
              <h2>
                <T>“Stay”</T>
              </h2>
              <p>
                <T>
                  Explore, perform, intervene, practice, retake and reflect. The partner responses
                  are fixed; no recording, analysis or grading takes place.
                </T>
              </p>
              <Link to="/scene" className={btnPrimary}>
                <T>Start rehearsal</T>
              </Link>
              <p>
                <T>
                  Rehearsal drafts and personal scene libraries are in development. Completed
                  reflections remain in Passport.
                </T>
              </p>
            </section>
          ) : current === "new-scene" ? (
            <section className="foundation-stack">
              <Unavailable>
                <T>
                  Importing and saving your own scripts is in development. The working demonstration
                  is available now.
                </T>
              </Unavailable>
              <Link to="/scene" className={btnPrimary}>
                <T>Try the demonstration</T>
              </Link>
            </section>
          ) : (
            <section className="foundation-stack">
              <h2>
                <T>Saved rehearsal records</T>
              </h2>
              {!passport.loaded ? (
                <p role="status">
                  <T>Loading records…</T>
                </p>
              ) : passport.error ? (
                <p role="alert">
                  <T>Saved records could not be loaded.</T>
                </p>
              ) : (
                <p>
                  {passport.entries.length} completed rehearsal{" "}
                  {passport.entries.length === 1 ? "record" : "records"} saved{" "}
                  {passport.signedIn ? "to your account" : "in this browser"}.
                </p>
              )}
              <Link to="/passport" className={btnPrimary}>
                <T>Open rehearsal history</T>
              </Link>
              <p>
                <T>These are completed reflection records, not resumable or live sessions.</T>
              </p>
              <Link to="/lab">
                <T>Performance Lab</T>
              </Link>
              <Link to="/lounge">
                <T>Rehearsal Lounge</T>
              </Link>
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
        <T>
          Existing draft interventions — pending faculty review. These suggestions do not analyze or
          grade a performance.
        </T>
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
                <Link to="/scene">
                  <T>Practice in the scripted demonstration</T>
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
export function StuckIntake({ tab }: TabProps) {
  return (
    <Page title="The Stuck Desk" eyebrow="FIX WHAT ISN’T WORKING" backTo="/" world="stuck">
      {tab !== "describe" && (
        <p className="text-sm text-muted-foreground">
          <T>Older Stuck Desk links now open the guided self-report practice flow. No automated performance diagnosis is available.</T>
        </p>
      )}
      <StuckDeskGuided />
      <details className="planned-tools">
        <summary><T>Browse original quick intervention prompts</T></summary>
        <DraftInterventions />
      </details>
    </Page>
  );
}

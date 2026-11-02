import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useAuditionPrep, usePassport } from "@/lib/store";
import { DRAFT_INTERVENTIONS } from "@/data/stuck";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { AuditionWorkspace } from "./AuditionWorkspace";
import { SUPPORT_PAGES } from "@/lib/foundation";
type TabProps = { tab: string; onTabChange: (tab: string) => void };

export function WorkHub({ tab, onTabChange }: TabProps) {
  const prep = useAuditionPrep();
  return (
    <Page title="Actor at Work" eyebrow="DO THE WORK" backTo="/" world="work">
      <p className="section-intro">
        Practical preparation for the room. Start with your own circumstances and playable choices.
      </p>
      {tab === "auditions" ? (
        <section className="foundation-stack">
          <h2>Your audition preparation</h2>
          {!prep.loaded ? (
            <p role="status">Loading audition notes…</p>
          ) : prep.error ? (
            <p role="alert">Your audition notes could not be loaded. Open preparation to retry.</p>
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
            {tab === "projects"
              ? "Project files, saved scripts and revision history are in development."
              : tab === "characters"
                ? "Dedicated character files are in development. Existing audition notes remain available."
                : "Recording, playback and export are not implemented."}
          </Unavailable>
          <button className={btnPrimary} onClick={() => onTabChange("auditions")}>
            Back to audition preparation
          </button>
        </section>
      )}
      <details className="planned-tools">
        <summary>Tools in development</summary>
        <p>These tools are not available yet. Your audition preparation remains available.</p>
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
    <Page title="Rehearsal Studio" eyebrow="MAKE THE WORK ACTIVE" backTo="/" world="rehearsal">
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
    <Page title="The Stuck Desk" eyebrow="FIX WHAT ISN’T WORKING" backTo="/" world="stuck">
      {tab === "describe" ? (
        <DraftInterventions />
      ) : (
        <Unavailable>
          {tab === "scene"
            ? "Saving a scene-specific problem intake is in development. Use the existing draft suggestions or run the demonstration scene."
            : "Structured problem intake and diagnosis are in development. No cause has been inferred from your performance."}
        </Unavailable>
      )}
      {tab !== "describe" ? (
        <button className={btnPrimary} onClick={() => onTabChange("describe")}>
          View draft interventions
        </button>
      ) : (
        <Link to="/scene" className={btnPrimary}>
          Try the Living Scene
        </Link>
      )}
    </Page>
  );
}

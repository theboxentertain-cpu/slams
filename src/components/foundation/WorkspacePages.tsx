import { T } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary } from "@/components/slams";
import { useAuditionPrep, usePassport } from "@/lib/store";
import { StuckDeskGuide } from "./StuckDeskGuide";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { AuditionWorkspace } from "./AuditionWorkspace";
import { AuditionFiles } from "./AuditionFiles";
import { ActorProjects } from "./ActorProjects";
import { SUPPORT_PAGES } from "@/lib/foundation";
import { ContextualRehearsal } from "./ContextualRehearsal";
import { validateRehearsalSearch, type RehearsalSearch } from "@/lib/actor-rehearsal-model";
type TabProps = { tab: string; onTabChange: (tab: string) => void };

export function WorkHub({
  tab,
  onTabChange,
  projectId,
  auditionId,
}: TabProps & { projectId?: string | undefined; auditionId?: string | undefined }) {
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
          <Link to="/work/sides" className="underline">
            <T>Open script sides and line-anchored beats</T>
          </Link>
          <AuditionFiles auditionId={auditionId} />
        </section>
      ) : tab === "projects" ? (
        <ActorProjects projectId={projectId} />
      ) : tab === "characters" ? (
        <section className="foundation-stack">
          <h2>
            <T>Character files</T>
          </h2>
          <p>
            <T>Choose a saved project and work on its character independently from other roles.</T>
          </p>
          <Link to="/work/character" className={btnPrimary}>
            <T>Open Character Files</T>
          </Link>
          <Link to="/work/breakdown">
            <T>Open Scene Breakdowns</T>
          </Link>
        </section>
      ) : (
        <section className="foundation-stack">
          <Unavailable>Recording, playback and export are not implemented.</Unavailable>
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
          <T>Recording, playback and export are not implemented.</T>
        </p>
        <ul>
          {(["selfTape"] as const).map((id) => {
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
            <section className="foundation-stack">
              <h2>
                <T>Your script sides</T>
              </h2>
              <p>
                <T>
                  Import TXT, PDF or DOCX sides, or paste text, and attach them to an audition or
                  project. Existing single-record audition notes are not modified.
                </T>
              </p>
              <Link to="/work/sides" className={btnPrimary}>
                <T>Open script sides and beat annotations</T>
              </Link>
            </section>
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
export function RehearsalHub({
  tab,
  onTabChange,
  search = validateRehearsalSearch({}),
  onContextChange = () => undefined,
}: TabProps & {
  search?: RehearsalSearch;
  onContextChange?: (next: Partial<RehearsalSearch>) => void;
}) {
  const passport = usePassport();
  const contextual = !!(
    search.projectId ||
    search.auditionId ||
    search.sideId ||
    search.sceneId ||
    search.sessionId
  );
  return (
    <Page
      title="Rehearsal Studio"
      eyebrow="MAKE THE WORK ACTIVE"
      backTo="/"
      world="rehearsal"
      performing={!!search.sessionId}
    >
      {contextual ? (
        <ContextualRehearsal search={search} onNavigate={onContextChange} />
      ) : (
        <SectionTabs page="rehearsal" value={tab} onChange={onTabChange}>
          {(current) =>
            current === "my-scenes" ? (
              <section className="foundation-stack">
                <ContextualRehearsal search={search} onNavigate={onContextChange} />
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
              </section>
            ) : current === "new-scene" ? (
              <section className="foundation-stack">
                <ContextualRehearsal search={search} onNavigate={onContextChange} />
                <Link to="/scene" className={btnPrimary}>
                  <T>Try the demonstration</T>
                </Link>
              </section>
            ) : (
              <section className="foundation-stack">
                <ContextualRehearsal search={search} onNavigate={onContextChange} />
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
      )}
    </Page>
  );
}
export function DraftInterventions() {
  return <StuckDeskGuide />;
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
          <T>View draft interventions</T>
        </button>
      ) : (
        <Link to="/scene" className={btnPrimary}>
          <T>Try the Living Scene</T>
        </Link>
      )}
    </Page>
  );
}

import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Settings,
  Clapperboard,
  IdCard,
  NotebookPen,
  Play,
  MoveHorizontal,
  BookOpen,
  Drama,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { DemoBanner, DirectorToggle, Wordmark } from "@/components/slams";
import { useDirectorMode, usePassport } from "@/lib/store";
import panorama from "@/assets/premium/director-studio.webp";
import { DirectorPortrait } from "./DirectorPortrait";
import { OfficeJourney } from "./OfficeJourney";
import { OfficeDirectory } from "./OfficeDirectory";
import { ProfileMenu } from "@/components/foundation/AppShell";
import { TrainingSummary } from "@/components/foundation/TrainingSummary";
import { useOfficePreferences } from "@/lib/office-preferences";
import { CoachPanel } from "./CoachPanel";
import { DeskBooks, SchoolBooks } from "./SchoolBooks";
import { useOfficeMilestones } from "./useOfficeMilestones";
import {
  OFFICE_CONTROLS,
  OFFICE_VIEWS,
  type DirectorExpression,
  type OfficeView,
} from "./office-data";

const WorkWall = lazy(() => import("./WorkWall"));
const RehearsalCorner = lazy(() => import("./RehearsalCorner"));
const VIEW_KEY = "slams.office.view.v1";

function paperSound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(220, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    /* Optional gesture-initiated sound; never block navigation. */
  }
}

export function DirectorsOffice() {
  const [view, setView] = useState<OfficeView>("desk");
  const [visited, setVisited] = useState<OfficeView[]>(["desk"]);
  const [booksOpen, setBooksOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const { preferences, updatePreferences, reducedMotion, animate } = useOfficePreferences();
  const [intent, setIntent] = useState<"script" | null>(null);
  const [mode] = useDirectorMode();
  const passport = usePassport();
  const milestones = useOfficeMilestones();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const booksTrigger = useRef<HTMLButtonElement>(null);
  const activeBookTrigger = useRef<HTMLElement | null>(null);
  const coachTrigger = useRef<HTMLButtonElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const count = passport.loaded && !passport.error ? passport.entries.length : null;
  const index = OFFICE_VIEWS.findIndex((item) => item.id === view);

  useEffect(() => {
    try {
      const prior = sessionStorage.getItem(VIEW_KEY);
      if (prior === "wall" || prior === "corner") {
        setView(prior);
        setVisited(["desk", prior]);
      }
    } catch {
      /* Usable defaults when storage is unavailable. */
    }
  }, []);

  function openBooks(trigger: HTMLElement | null = booksTrigger.current) {
    activeBookTrigger.current = trigger;
    setBooksOpen(true);
    setIntent(null);
    if (preferences.sound) paperSound();
  }
  function selectView(next: OfficeView, focus = false) {
    setView(next);
    setIntent(null);
    setVisited((prior) => (prior.includes(next) ? prior : [...prior, next]));
    try {
      sessionStorage.setItem(VIEW_KEY, next);
    } catch {
      /* Navigation still works. */
    }
    if (preferences.sound) paperSound();
    if (focus) tabs.current[OFFICE_VIEWS.findIndex((item) => item.id === next)]?.focus();
  }
  function tabKeys(event: KeyboardEvent) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % 3;
    else if (event.key === "ArrowLeft") next = (index + 2) % 3;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 2;
    else return;
    event.preventDefault();
    selectView(OFFICE_VIEWS[next]!.id, true);
  }
  const expression: DirectorExpression =
    mode === "off"
      ? "bored"
      : intent
        ? "critical"
        : view === "wall"
          ? "exhausted"
          : milestones !== null && milestones > 0
            ? "impressed"
            : count !== null && count > 0
              ? "proud"
              : "observant";
  const note = intent
    ? "The marked-up script. Start there."
    : view === "wall"
      ? "The paperwork. It does multiply."
      : milestones !== null && milestones > 0
        ? `${milestones} curriculum ${milestones === 1 ? "unit" : "units"} marked complete in your account. The next page is waiting.`
        : count !== null && count > 0
          ? `${count} ${count === 1 ? "rehearsal record" : "rehearsal records"} saved. Your next take is waiting.`
          : "You’re here. Good. Let’s get to work.";

  return (
    <div className="office-shell office-premium" data-motion={animate ? "on" : "off"}>
      <header className="office-masthead">
        <h1 className="sr-only">The Director’s Office</h1>
        <button
          className="office-icon-button premium-preferences"
          type="button"
          aria-label="Office preferences"
          aria-expanded={settingsOpen}
          aria-controls="office-settings"
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          {settingsOpen ? <X size={23} /> : <Settings size={23} />}
        </button>
        <div className="office-brand">
          <span className="studio-credit">mrahmostudios presents</span>
          <Wordmark small />
          <span className="office-tagline">The Actor’s Pocket Studio</span>
        </div>
        <div className="office-header-actions">
          <Link
            to={OFFICE_CONTROLS.progress.to}
            className="office-icon-button reference-status"
            aria-label={
              passport.error
                ? "Progress and save status — records unavailable"
                : "Progress and save status"
            }
          >
            <Bell size={23} />
            {passport.error && <span className="save-attention" aria-hidden="true" />}
          </Link>
          <ProfileMenu className="reference-account" identity />
        </div>
      </header>
      {settingsOpen && (
        <section id="office-settings" aria-label="Office preferences" className="office-settings">
          <DirectorToggle />
          <button
            type="button"
            aria-pressed={preferences.motion}
            onClick={() => updatePreferences({ ...preferences, motion: !preferences.motion })}
          >
            Motion {preferences.motion ? "on" : "off"}
            {reducedMotion ? " · reduced by device" : ""}
          </button>
          <button
            type="button"
            aria-pressed={preferences.sound}
            onClick={() => {
              updatePreferences({ ...preferences, sound: !preferences.sound });
              if (!preferences.sound) paperSound();
            }}
          >
            {preferences.sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound{" "}
            {preferences.sound ? "on" : "off"}
          </button>
        </section>
      )}
      <main
        id="page-content"
        tabIndex={-1}
        aria-label="The Director’s Office"
        className="office-world"
        data-view={view}
        onPointerDown={(event) => {
          start.current = null;
          swiped.current = false;
          if (!(event.target as Element).closest("input,textarea,[role=dialog]"))
            start.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
        onPointerUp={(event) => {
          const from = start.current;
          start.current = null;
          if (!from) return;
          const dx = event.clientX - from.x,
            dy = event.clientY - from.y;
          if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            swiped.current = true;
            event.preventDefault();
            selectView(OFFICE_VIEWS[Math.max(0, Math.min(2, index + (dx < 0 ? 1 : -1)))]!.id);
          }
        }}
        onClickCapture={(event) => {
          if (swiped.current) {
            swiped.current = false;
            if (event.detail > 0) {
              event.preventDefault();
              event.stopPropagation();
            }
          }
        }}
      >
        <div className="office-navigation">
          <button
            type="button"
            className="office-icon-button room-arrow"
            aria-label="Previous office view"
            disabled={index === 0}
            onClick={() => selectView(OFFICE_VIEWS[index - 1]!.id)}
          >
            <ArrowLeft size={17} />
          </button>
          <div role="tablist" aria-label="Office views" className="office-tabs" onKeyDown={tabKeys}>
            {OFFICE_VIEWS.map((item, i) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabs.current[i] = node;
                }}
                type="button"
                role="tab"
                id={`office-tab-${item.id}`}
                aria-selected={view === item.id}
                aria-controls={`office-panel-${item.id}`}
                tabIndex={view === item.id ? 0 : -1}
                onClick={() => selectView(item.id)}
              >
                <span>{item.number}</span>
                {item.short}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="office-icon-button room-arrow"
            aria-label="Next office view"
            disabled={index === 2}
            onClick={() => selectView(OFFICE_VIEWS[index + 1]!.id)}
          >
            <ArrowRight size={17} />
          </button>
        </div>
        {OFFICE_VIEWS.map((item) => (
          <section
            key={item.id}
            className={`office-room office-room-${item.id}`}
            id={`office-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`office-tab-${item.id}`}
            hidden={view !== item.id}
          >
            {item.id === "desk" ? (
              <>
                <div className="premium-office-scene">
                  <img
                    className="premium-office-art"
                    src={panorama}
                    alt="The Director in his leather chair, offering his signature coffee mug across the desk in a warmly lit rehearsal studio."
                    width={1536}
                    height={1024}
                    fetchPriority="high"
                  />
                  <Link
                    to="/work"
                    className="desk-casting-sign"
                    aria-label="Actor at Work — open audition preparation"
                  >
                    <Clapperboard aria-hidden="true" />
                    <span>Actor at Work</span>
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                  <Link
                    to={OFFICE_CONTROLS.studio.to}
                    className="reference-rehearsal-sign"
                    aria-label="Go to the rehearsal studio"
                  >
                    <span>Rehearse</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    ref={coachTrigger}
                    onClick={() => setCoachOpen(true)}
                    className="director-figure office-object"
                    aria-label="The Director — Acting Coach, meet your studio guide"
                  >
                    <DirectorPortrait expression={expression} className="premium-coach-seal" />
                    <span>
                      <strong>The Director</strong>
                      <small>Your reluctant accomplice</small>
                    </span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <TrainingSummary variant="office" />
                <OfficeDirectory includeRehearsal onStuckIntent={() => setIntent("script")} />
                <section className="premium-bookcase" aria-label="The Conservatory bookcase">
                  <div className="premium-section-label">
                    <span />
                    The Conservatory
                    <span />
                  </div>
                  <p>Eight schools. Eight ways into the work.</p>
                  <DeskBooks buttonRef={booksTrigger} onOpen={() => openBooks()} />
                </section>
              </>
            ) : (
              visited.includes(item.id) && (
                <Suspense
                  fallback={
                    <div className="office-loading" role="status">
                      Turning toward the {item.id === "wall" ? "work wall" : "rehearsal corner"}…
                    </div>
                  }
                >
                  {item.id === "wall" ? <WorkWall savedCount={count} /> : <RehearsalCorner />}
                </Suspense>
              )
            )}
          </section>
        ))}
        {view === "wall" && (
          <nav className="office-wall-shortcuts" aria-label="Continue from the Work Wall">
            <button type="button" onClick={() => selectView("corner", true)}>
              <Clapperboard aria-hidden="true" />
              <strong>Rehearsal Corner</strong>
              <span>Practice · Perform · Reflect</span>
            </button>
            <Link to="/scene">
              <Play aria-hidden="true" />
              <strong>Living Scene</strong>
              <span>Try a different approach</span>
            </Link>
            <Link to="/passport">
              <IdCard aria-hidden="true" />
              <strong>Rehearsal notes</strong>
              <span>Your saved reflections</span>
            </Link>
            <Link to="/work/audition">
              <NotebookPen aria-hidden="true" />
              <strong>Audition desk</strong>
              <span>Prepare your next audition</span>
            </Link>
          </nav>
        )}
        <OfficeJourney rehearsals={count} milestones={milestones} signedIn={passport.signedIn} />
        <details className="premium-studio-tools">
          <summary>
            Inside your studio <span>Tools, notes &amp; your journey</span>
          </summary>
          <nav aria-label="Supporting studio tools">
            <Link to="/passport">
              <IdCard aria-hidden="true" />
              <strong>Actor’s Passport</strong>
              <span>Your saved reflections</span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link to="/matrix">
              <BookOpen aria-hidden="true" />
              <strong>Technique Matrix</strong>
              <span>Reviewed comparisons in development</span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link to="/director">
              <Drama aria-hidden="true" />
              <strong>The Director</strong>
              <span>Modes &amp; studio guidance</span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </nav>
        </details>
        <div className="office-understage">
          <div className="office-director-note" aria-live="polite">
            {mode !== "off" && (
              <>
                <span className="office-kicker">A WORD FROM THE DIRECTOR</span>
                <p>“{mode === "quiet" ? "Your next take is waiting." : note}”</p>
              </>
            )}
          </div>
          <span className="office-swipe-hint">
            <MoveHorizontal size={16} /> One studio. Three views.
          </span>
        </div>
      </main>
      <footer className="office-footer">
        <DemoBanner />
        <p>TRAIN. REHEARSE. EXPERIMENT. PERFORM.</p>
      </footer>
      <SchoolBooks
        open={booksOpen}
        onOpenChange={setBooksOpen}
        motion={animate}
        onReturnFocus={() => (activeBookTrigger.current ?? booksTrigger.current)?.focus()}
      />
      <CoachPanel
        open={coachOpen}
        onOpenChange={setCoachOpen}
        motion={animate}
        onReturnFocus={() => coachTrigger.current?.focus()}
        expression={expression}
      />
    </div>
  );
}

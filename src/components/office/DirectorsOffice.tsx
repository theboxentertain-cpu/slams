import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MoveHorizontal,
  Settings2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { AccountLink, DemoBanner, DirectorToggle, Wordmark } from "@/components/slams";
import { useDirectorMode, usePassport } from "@/lib/store";
import panorama from "@/assets/office/office-panorama.webp";
import { DirectorPortrait } from "./DirectorPortrait";
import { DeskArt } from "./OfficeArt";
import { OfficeObject } from "./OfficeObject";
import { DeskBooks, SchoolBooks } from "./SchoolBooks";
import { useOfficeMilestones } from "./useOfficeMilestones";
import {
  OFFICE_DESTINATIONS,
  OFFICE_VIEWS,
  type DirectorExpression,
  type OfficeView,
} from "./office-data";

const WorkWall = lazy(() => import("./WorkWall"));
const RehearsalCorner = lazy(() => import("./RehearsalCorner"));
const PREFERENCES = "slams.office.preferences.v1";
const VIEW_KEY = "slams.office.view.v1";
type Preferences = { motion: boolean; sound: boolean };

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
  const [preferences, setPreferences] = useState<Preferences>({ motion: true, sound: false });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [intent, setIntent] = useState<"script" | null>(null);
  const [mode] = useDirectorMode();
  const passport = usePassport();
  const milestones = useOfficeMilestones();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const booksTrigger = useRef<HTMLButtonElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const count = passport.loaded && !passport.error ? passport.entries.length : null;
  const index = OFFICE_VIEWS.findIndex((item) => item.id === view);
  const animate = preferences.motion && !reducedMotion;

  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(PREFERENCES) ?? "null");
      if (
        value &&
        typeof value === "object" &&
        "motion" in value &&
        "sound" in value &&
        typeof value.motion === "boolean" &&
        typeof value.sound === "boolean"
      )
        setPreferences({ motion: value.motion, sound: value.sound });
      const prior = sessionStorage.getItem(VIEW_KEY);
      if (prior === "wall" || prior === "corner") {
        setView(prior);
        setVisited(["desk", prior]);
      }
    } catch {
      /* Usable defaults when storage is unavailable. */
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function updatePreferences(next: Preferences) {
    setPreferences(next);
    try {
      localStorage.setItem(PREFERENCES, JSON.stringify(next));
    } catch {
      /* Keep the current preference. */
    }
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
    <div className="office-shell" data-motion={animate ? "on" : "off"}>
      <header className="office-masthead">
        <h1 className="sr-only">The Director’s Office</h1>
        <div className="office-brand">
          <span className="studio-credit">MRAHMO STUDIOS PRESENTS</span>
          <Wordmark small />
          <span className="office-tagline">The Actor’s Pocket Studio</span>
        </div>
        <div className="office-header-actions">
          <AccountLink />
          <button
            className="office-icon-button"
            type="button"
            aria-label="Office preferences"
            aria-expanded={settingsOpen}
            aria-controls="office-settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            {settingsOpen ? <X size={19} /> : <Settings2 size={19} />}
          </button>
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
      <div className="office-section-line">
        <span>THE STUDIO IS OPEN</span>
        <span>YOUR NEXT TAKE STARTS HERE</span>
      </div>
      <main
        id="office"
        aria-label="The Director’s Office"
        className="office-world"
        data-view={view}
        style={{ backgroundImage: `url(${panorama})` }}
        onPointerDown={(event) => {
          start.current = null;
          if (!(event.target as Element).closest("a,button,input,textarea,[role=dialog]"))
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
          if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4)
            selectView(OFFICE_VIEWS[Math.max(0, Math.min(2, index + (dx < 0 ? 1 : -1)))]!.id);
        }}
      >
        <div className="office-light" aria-hidden="true" />
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
                <div className="room-heading">
                  <span className="office-kicker">01 / THE DIRECTOR’S DESK</span>
                  <h2>
                    Leave your ego.
                    <br />
                    <em>Take a seat.</em>
                  </h2>
                  <p>
                    Eight schools. One room.
                    <br />A lifetime of better questions.
                  </p>
                </div>
                <Link
                  to={OFFICE_DESTINATIONS.director.to}
                  className="director-figure office-object"
                  aria-label="The Director — meet your studio guide"
                >
                  <DirectorPortrait expression={expression} />
                  <span className="object-label">
                    <strong>
                      The Director <ArrowUpRight aria-hidden="true" size={12} />
                    </strong>
                    <span>Your reluctant accomplice</span>
                  </span>
                </Link>
                <div className="office-desk" aria-hidden="true">
                  <DeskArt />
                </div>
                <DeskBooks
                  buttonRef={booksTrigger}
                  onOpen={() => {
                    setBooksOpen(true);
                    setIntent(null);
                    if (preferences.sound) paperSound();
                  }}
                />
                <OfficeObject destination="rehearsal" />
                {milestones !== null && milestones > 0 && (
                  <span className="office-milestone">
                    {milestones} curriculum {milestones === 1 ? "milestone" : "milestones"} saved
                  </span>
                )}
                <OfficeObject destination="stuck" onIntent={() => setIntent("script")} />
                <div className="office-coffee" aria-hidden="true">
                  <span>
                    Not your
                    <br />
                    <b>fucking</b>
                    <br />
                    cheerleader.
                  </span>
                </div>
                <span className="desk-nameplate" aria-hidden="true">
                  THE DIRECTOR’S OFFICE · EST. EVERY DAY
                </span>
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
        <div className="office-room-caption" aria-hidden="true">
          <span className="caption-rule" />
          ONE OFFICE. MANY WAYS INTO THE WORK.
          <span className="caption-rule" />
        </div>
      </main>
      <div className="office-navigation">
        <button
          type="button"
          className="office-icon-button room-arrow"
          aria-label="Previous office view"
          disabled={index === 0}
          onClick={() => selectView(OFFICE_VIEWS[index - 1]!.id)}
        >
          <ArrowLeft size={19} />
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
          <ArrowRight size={19} />
        </button>
      </div>
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
          <MoveHorizontal size={17} /> Swipe to explore the room
        </span>
      </div>
      <footer className="office-footer">
        <DemoBanner />
        <p>SCENE · LISTENING · ACTION · MOVEMENT · STAKES</p>
      </footer>
      <SchoolBooks
        open={booksOpen}
        onOpenChange={setBooksOpen}
        motion={animate}
        onReturnFocus={() => booksTrigger.current?.focus()}
      />
    </div>
  );
}

import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Drama,
  ScrollText,
  IdCard,
  Play,
  Check,
  Volume2,
  MoveHorizontal,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { enterStudio } from "@/lib/studio-entry";
import { useActorSetup, EXPERIENCES, ACTOR_GOALS } from "@/lib/actor-setup";
import { useOfficePreferences } from "@/lib/office-preferences";
import { BOOK_DESIGNS } from "@/components/office/office-data";
import { BookCover, SchoolBooks } from "@/components/office/SchoolBooks";
import { WelcomeFrame } from "./WelcomeFrame";

export function WelcomeLanding() {
  const [books, setBooks] = useState(false);
  const bookTrigger = useRef<HTMLButtonElement>(null);
  const { animate } = useOfficePreferences();
  return (
    <WelcomeFrame
      step={1}
      title="Welcome to SLAMS"
      subtitle="A serious acting conservatory in your pocket."
      variant="landing"
    >
      <button
        ref={bookTrigger}
        className="welcome-books"
        onClick={() => setBooks(true)}
        aria-label="Explore the eight acting-school books"
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">
          {BOOK_DESIGNS.map((book) => (
            <BookCover key={book.slug} book={book} mini />
          ))}
        </span>
        <strong>Eight schools. Find your way in.</strong>
      </button>
      <nav className="welcome-features" aria-label="Inside the studio">
        <Link to="/conservatory">
          <BookOpen aria-hidden="true" />
          <span>Eight acting schools</span>
        </Link>
        <Link to="/rehearsal">
          <Clapperboard aria-hidden="true" />
          <span>Rehearsal Studio</span>
        </Link>
        <Link to="/work">
          <Drama aria-hidden="true" />
          <span>Actor at Work</span>
        </Link>
        <Link to="/stuck">
          <ScrollText aria-hidden="true" />
          <span>The Stuck Desk</span>
        </Link>
        <Link to="/passport">
          <IdCard aria-hidden="true" />
          <span>Your Passport</span>
        </Link>
      </nav>
      <Link to="/welcome/account" className="welcome-primary">
        <Play aria-hidden="true" />
        Enter the Studio
        <ArrowRight aria-hidden="true" />
      </Link>
      <div className="welcome-account-links">
        <Link to="/auth" search={{ mode: "signup", flow: "welcome" }}>
          Create account
        </Link>
        <Link to="/auth" search={{ mode: "signin", flow: "welcome" }}>
          Sign in
        </Link>
      </div>
      <p className="welcome-paper-quote">
        “A serious acting conservatory
        <br />
        in your pocket.”
      </p>
      <Link className="welcome-skip" to="/" onClick={enterStudio}>
        Explore the Office now
      </Link>
      <SchoolBooks
        open={books}
        onOpenChange={setBooks}
        motion={animate}
        onReturnFocus={() => bookTrigger.current?.focus()}
      />
    </WelcomeFrame>
  );
}
export function WelcomeAccount() {
  const { user, loading } = useSession();
  return (
    <WelcomeFrame
      step={2}
      title="Welcome, Actor."
      subtitle="Serious training. Real practice. No hand-holding."
      back="/welcome"
    >
      <section className="welcome-choice-list" aria-label="Choose how to enter">
        {loading ? (
          <p role="status">Checking account…</p>
        ) : user ? (
          <>
            <Link className="welcome-primary" to="/welcome/setup">
              Continue with your account
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="welcome-outline" to="/auth">
              Manage your account
            </Link>
          </>
        ) : (
          <>
            <Link
              className="welcome-primary"
              to="/auth"
              search={{ mode: "signin", flow: "welcome" }}
            >
              Sign in to your account
            </Link>
            <Link
              className="welcome-outline"
              to="/auth"
              search={{ mode: "signup", flow: "welcome" }}
            >
              Create a new account
            </Link>
            <Link className="welcome-outline" to="/welcome/setup">
              <Play aria-hidden="true" />
              <span>
                Explore as Guest<small>Rehearsals and notes stay in this browser</small>
              </span>
            </Link>
          </>
        )}
        <p className="welcome-planned">
          Email sign-in is available. Google and Apple sign-in are not available yet.
        </p>
        <details className="welcome-why">
          <summary>Why create an account?</summary>
          <p>
            Keep Passport reflections and audition notes in your account. Guests can rehearse and
            save locally. Curriculum progress needs a signed-in account and reviewed, published
            material.
          </p>
        </details>
        <Link className="welcome-skip" to="/" onClick={enterStudio}>
          Skip to the Office
        </Link>
      </section>
    </WelcomeFrame>
  );
}
export function ActorSetupPage() {
  const setup = useActorSetup();
  const { preferences, updatePreferences, reducedMotion } = useOfficePreferences();
  const navigate = useNavigate();
  return (
    <WelcomeFrame
      step={4}
      title="Actor Setup"
      subtitle="A few choices, in your own words. No auditions at the door."
      variant="setup"
      back="/welcome/account"
    >
      {!setup.ready ? (
        <p role="status">Loading your setup…</p>
      ) : (
        <form
          className="actor-setup-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (setup.save())
              void navigate({ to: "/baseline", search: { flow: "welcome", tab: "prepare" } });
          }}
        >
          <fieldset className="welcome-paper">
            <legend>Your experience</legend>
            <p>How would you describe your acting experience? Optional.</p>
            <div className="experience-options">
              {EXPERIENCES.map((experience) => (
                <label key={experience}>
                  <input
                    type="radio"
                    name="experience"
                    checked={setup.data.experience === experience}
                    onChange={() => setup.update((value) => ({ ...value, experience }))}
                  />
                  <span>{experience}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="welcome-paper">
            <legend>Your goals</legend>
            <p>What would you like to work on? Select any that apply.</p>
            <div className="goal-options">
              {ACTOR_GOALS.map((goal) => (
                <label key={goal}>
                  <input
                    type="checkbox"
                    checked={setup.data.goals.includes(goal)}
                    onChange={() =>
                      setup.update((value) => ({
                        ...value,
                        goals: value.goals.includes(goal)
                          ? value.goals.filter((g) => g !== goal)
                          : [...value.goals, goal],
                      }))
                    }
                  />
                  <span>{goal}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <section className="welcome-paper">
            <h2>Language</h2>
            <p>English is available. Arabic translation and RTL support are in development.</p>
            <span className="available-language">
              <Check aria-hidden="true" />
              English
            </span>
          </section>
          <fieldset className="welcome-paper">
            <legend>Your experience of the studio</legend>
            <div className="setup-preferences">
              <label>
                <input
                  type="checkbox"
                  checked={!preferences.motion}
                  onChange={() =>
                    updatePreferences({ ...preferences, motion: !preferences.motion })
                  }
                />
                <MoveHorizontal aria-hidden="true" />
                Reduce motion
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={() => updatePreferences({ ...preferences, sound: !preferences.sound })}
                />
                <Volume2 aria-hidden="true" />
                Office sounds
              </label>
            </div>
            {reducedMotion && <p>Motion is also reduced by your device preference.</p>}
            <p>
              Recording, captions for recordings and coach audio are not available yet. No camera or
              microphone access is requested.
            </p>
          </fieldset>
          <p className="welcome-storage-note">
            Optional setup is saved on this device, separately{" "}
            {setup.signedIn ? "for your account" : "for guests"}. It does not assess your acting or
            unlock unpublished training.
          </p>
          {setup.error && (
            <p role="alert" className="welcome-error">
              {setup.error}
            </p>
          )}
          <button type="submit" className="welcome-primary">
            Continue to Baseline
            <ArrowRight aria-hidden="true" />
          </button>
          <Link
            className="welcome-skip"
            to="/baseline"
            search={{ flow: "welcome", tab: "prepare" }}
          >
            Skip setup for now
          </Link>
        </form>
      )}
    </WelcomeFrame>
  );
}
export function BaselineWelcome() {
  const setup = useActorSetup();
  return (
    <WelcomeFrame
      step={5}
      title="Your Actor’s Baseline"
      subtitle="A starting point. Not a judgment. Your observations belong to you."
      variant="setup"
      back="/welcome/setup"
    >
      <section className="welcome-paper baseline-introduction">
        <h2>The Actor’s Baseline</h2>
        <p>
          Guided baseline assessments are still in development. You can begin with the working,
          text-only Living Scene and save your own reflection.
        </p>
      </section>
      <ol className="baseline-path">
        {[
          ["Prepare", "Read the scene circumstances and objective."],
          ["Perform", "Try a scripted choice, then a new approach."],
          ["Reflect", "Record what you noticed in your Passport."],
          ["Next steps", "Choose where you want to work next."],
        ].map(([label, text], i) => (
          <li className="welcome-paper" key={label}>
            <span>
              {i + 1}. {label}
            </span>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      {setup.ready && setup.data.goals.length > 0 && (
        <section className="welcome-paper">
          <h2>Your chosen direction</h2>
          <p>{setup.data.goals.join(" · ")}</p>
          <p>These are your preferences, not a diagnosis or a training score.</p>
        </section>
      )}
      <Link className="welcome-primary" to="/scene" onClick={enterStudio}>
        <Play aria-hidden="true" />
        Start a first rehearsal
        <ArrowRight aria-hidden="true" />
      </Link>
      <div className="welcome-account-links">
        <Link to="/conservatory" onClick={enterStudio}>
          Explore the schools
        </Link>
        <Link to="/work" onClick={enterStudio}>
          Prepare an audition
        </Link>
      </div>
      <Link className="welcome-skip" to="/" onClick={enterStudio}>
        Skip to the Office
      </Link>
    </WelcomeFrame>
  );
}

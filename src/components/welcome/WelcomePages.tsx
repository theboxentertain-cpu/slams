import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Drama,
  ScrollText,
  IdCard,
  Play,
  Volume2,
  MoveHorizontal,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { enterStudio } from "@/lib/studio-entry";
import { BaselineContent } from "@/components/foundation/BaselinePage";
import baselineDirector from "@/assets/premium/baseline-director.webp";
import { useOfficePreferences } from "@/lib/office-preferences";
import { BOOK_DESIGNS } from "@/components/office/office-data";
import { BookCover, SchoolBooks } from "@/components/office/SchoolBooks";
import { WelcomeFrame } from "./WelcomeFrame";

export function WelcomeLanding() {
  const { t } = useLanguage();
  const [books, setBooks] = useState(false);
  const bookTrigger = useRef<HTMLButtonElement>(null);
  const { animate } = useOfficePreferences();
  return (
    <WelcomeFrame
      title="Welcome to SLAMS"
      subtitle="A serious acting conservatory in your pocket."
      variant="landing"
    >
      <section className="welcome-entry" aria-labelledby="first-rehearsal-title">
        <h2 id="first-rehearsal-title">{t("Your first rehearsal starts here.")}</h2>
        <p>
          {t("SLAMS is your acting practice studio. Try a short, text-only scene, change your approach and reflect on your retake.")}
        </p>
        <Link to="/scene" onClick={enterStudio} className="welcome-primary">
          <Play aria-hidden="true" />
          {t("Enter the Studio")}
          <ArrowRight aria-hidden="true" />
        </Link>
        <p className="welcome-entry-note">
          {t("No account or profile needed. Guest reflections stay in this browser.")}
        </p>
        <div className="welcome-account-links">
          <Link to="/auth" search={{ mode: "signin", flow: "welcome" }}>
            {t("Sign in")}
          </Link>
          <Link to="/welcome/setup">{t("Studio settings · optional")}</Link>
        </div>
        <Link className="welcome-skip" to="/" onClick={enterStudio}>
          {t("Explore the Office")}
        </Link>
      </section>
      <details className="welcome-explore">
        <summary>{t("Explore more of the studio")}</summary>
        <button
          ref={bookTrigger}
          className="welcome-books"
          onClick={() => setBooks(true)}
          aria-label={t("Explore the eight acting-school books")}
          aria-haspopup="dialog"
        >
          <span aria-hidden="true">
            {BOOK_DESIGNS.map((book) => (
              <BookCover key={book.slug} book={book} mini />
            ))}
          </span>
          <strong>{t("Eight schools. Find your way in.")}</strong>
        </button>
        <nav className="welcome-features" aria-label={t("Inside the studio")}>
          <Link to="/conservatory">
            <BookOpen aria-hidden="true" />
            <span>{t("Eight acting schools")}</span>
          </Link>
          <Link to="/rehearsal">
            <Clapperboard aria-hidden="true" />
            <span>{t("Rehearsal Studio")}</span>
          </Link>
          <Link to="/work">
            <Drama aria-hidden="true" />
            <span>{t("Actor at Work")}</span>
          </Link>
          <Link to="/stuck">
            <ScrollText aria-hidden="true" />
            <span>{t("The Stuck Desk")}</span>
          </Link>
          <Link to="/passport">
            <IdCard aria-hidden="true" />
            <span>{t("Your Passport")}</span>
          </Link>
        </nav>
      </details>
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
  const { t } = useLanguage();
  const { user, loading } = useSession();
  return (
    <WelcomeFrame
      title="Welcome, Actor."
      subtitle="Start rehearsing now. An account is optional."
      back="/welcome"
    >
      <section className="welcome-choice-list" aria-label="Choose how to enter">
        <Link className="welcome-primary" to="/scene" onClick={enterStudio}>
          <Play aria-hidden="true" />
          {t("Start a first rehearsal")}
          <ArrowRight aria-hidden="true" />
        </Link>
        <p className="welcome-storage-note">
          {t("No account needed. Guest reflections stay in this browser.")}
        </p>
        {loading ? (
          <p role="status">{t("Checking account… You can rehearse while we check.")}</p>
        ) : user ? (
          <Link className="welcome-outline" to="/auth">
            {t("Manage your account")}
          </Link>
        ) : (
          <div className="welcome-account-links">
            <Link to="/auth" search={{ mode: "signin", flow: "welcome" }}>
              Sign in
            </Link>
            <Link to="/auth" search={{ mode: "signup", flow: "welcome" }}>
              {t("Create a new account")}
            </Link>
          </div>
        )}
        <Link className="welcome-outline" to="/welcome/setup">
          Studio settings · optional
        </Link>
        <p className="welcome-planned">
          {t("Email sign-in is available. Google and Apple sign-in are not available yet.")}
        </p>
        <details className="welcome-why">
          <summary>{t("Why create an account?")}</summary>
          <p>
            Keep Passport reflections and audition notes in your account. Guests can rehearse and
            save locally. Curriculum progress needs a signed-in account and reviewed, published
            material.
          </p>
        </details>
        <Link className="welcome-skip" to="/" onClick={enterStudio}>
          {t("Skip to the Office")}
        </Link>
      </section>
    </WelcomeFrame>
  );
}
export function ActorSetupPage() {
  const { t } = useLanguage();
  const { preferences, updatePreferences, reducedMotion } = useOfficePreferences();
  return (
    <WelcomeFrame
      title="Studio Settings"
      subtitle="Optional controls. Start rehearsing whenever you’re ready."
      variant="setup"
      back="/welcome"
    >
      <fieldset className="welcome-paper">
        <legend>{t("Your experience of the studio")}</legend>
        <div className="setup-preferences">
          <label>
            <input
              type="checkbox"
              checked={!preferences.motion}
              onChange={() => updatePreferences({ ...preferences, motion: !preferences.motion })}
            />
            <MoveHorizontal aria-hidden="true" />
            {t("Reduce motion")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.sound}
              onChange={() => updatePreferences({ ...preferences, sound: !preferences.sound })}
            />
            <Volume2 aria-hidden="true" />
            {t("Office sounds")}
          </label>
        </div>
        {reducedMotion && <p>{t("Motion is also reduced by your device preference.")}</p>}
        <p>
          {t("Changes apply immediately. This browser remembers them when local storage is available.")}
        </p>
      </fieldset>
      <Link className="welcome-primary" to="/scene" onClick={enterStudio}>
        <Play aria-hidden="true" />
        Start a first rehearsal
        <ArrowRight aria-hidden="true" />
      </Link>
      <Link className="welcome-skip" to="/" onClick={enterStudio}>
        Explore the Office
      </Link>
    </WelcomeFrame>
  );
}
export function BaselineWelcome() {
  return (
    <WelcomeFrame
      title="Your Actor’s Baseline"
      subtitle="A starting point. Not a judgment. Your observations belong to you."
      variant="setup"
      back="/welcome/setup"
      artwork={{
        src: baselineDirector,
        alt: "The Director points toward the actor from his warmly lit studio desk.",
      }}
    >
      <BaselineContent welcome />
    </WelcomeFrame>
  );
}

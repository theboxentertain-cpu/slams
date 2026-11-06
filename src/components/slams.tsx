import { T, useLanguage } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { useDirectorMode, type DirectorMode } from "@/lib/store";
import { DirectorPortrait } from "@/components/office/DirectorPortrait";
import { ProfileMenu } from "@/components/foundation/AppShell";
import { StudioHeading, type StudioWorld } from "./StudioHeading";
import type { DirectorExpression } from "./office/office-data";

export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className={`wordmark ${small ? "text-xl" : "text-6xl sm:text-7xl"}`} aria-label="SLAMS">
      SL<span className="text-crimson">A</span>MS
    </span>
  );
}

export function DemoBanner() {
  const { t } = useLanguage();
  const { user, loading } = useSession();
  if (loading) return null;
  if (user) {
    return (
      <p
        role="note"
        className="bg-secondary px-3 py-1.5 text-center text-xs font-bold text-foreground"
      >
        {t("Signed in as")} <bdi>{user.email}</bdi>.{" "}
        {t("Passport and audition notes save to your account. Director settings stay on this device.")}
      </p>
    );
  }
  return (
    <p role="note" className="bg-warning px-3 py-1.5 text-center text-xs font-bold text-charcoal">
      {t("GUEST STUDIO — rehearsal reflections and audition notes stay in this browser.")}{" "}
      <Link to="/auth" className="underline"><T>
        Sign in to save to your account.
      </T></Link>
    </p>
  );
}

export function AccountLink() {
  const { t } = useLanguage();
  const { user, loading, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (loading) return null;
  if (!user) {
    return (
      <Link to="/auth" className="account-link rounded bg-secondary px-3 py-2 text-sm"><T>
        Sign in
      </T></Link>
    );
  }
  return (
    <span className="text-sm">
      <Button
        variant="secondary"
        disabled={busy}
        type="button"
        className="account-link rounded bg-secondary px-3 py-2 text-sm"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await signOut();
          } catch {
            setError("Sign-out failed. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {t(busy ? "Signing out…" : "Sign out")}
      </Button>
      {error && (
        <span role="alert" className="block text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}

export function DirectorToggle() {
  const { t } = useLanguage();
  const [mode, setMode] = useDirectorMode();
  return (
    <fieldset className="director-controls flex items-center gap-1 text-xs">
      <legend className="sr-only"><T>Director mode</T></legend>
      <span className="mr-1 text-muted-foreground" aria-hidden><T>
        Director
      </T></span>
      {(["on", "quiet", "off"] as DirectorMode[]).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
          className={`rounded px-2 py-1 uppercase ${mode === m ? "bg-amber text-charcoal font-bold" : "bg-secondary"}`}
        >
          {t(m)}
        </button>
      ))}
    </fieldset>
  );
}

/** Director note. Never rendered during a take (pass performing). */
export function DirectorNote({
  children,
  short,
  performing = false,
  expression = "observant",
}: {
  children: ReactNode;
  short?: string;
  performing?: boolean;
  expression?: DirectorExpression;
}) {
  const [mode] = useDirectorMode();
  const { t } = useLanguage();
  if (performing || mode === "off") return null;
  return (
    <aside aria-label="The Director" className="panel mt-4 flex gap-3 border-amber/40 p-3 text-sm">
      <DirectorPortrait expression={expression} className="director-note-portrait" />
      <p>
        <span className="font-bold text-amber"><T>The Director: </T></span>
        {mode === "quiet" && short ? t(short) : children}
      </p>
    </aside>
  );
}

export function Page({
  title,
  eyebrow,
  children,
  school,
  backTo = "/",
  world = school ? "school" : "studio",
  performing = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  school?: string;
  backTo?: "/" | "/work" | "/stuck" | "/rehearsal" | "/conservatory";
  world?: StudioWorld;
  performing?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div data-school={school} data-world={world} className="studio-page min-h-screen">
      <DemoBanner />
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link to={backTo} className="page-back-button rounded bg-secondary px-3 py-2 text-sm"><T>
          ← Back
        </T></Link>
        <Link to="/" aria-label="Return to the Director’s Office" className="page-office-link">
          <Wordmark small />
          <span><T>THE OFFICE</T></span>
        </Link>
        <ProfileMenu />
      </header>
      <main id="page-content" tabIndex={-1} className="rise mx-auto max-w-3xl px-4 pb-8">
        <StudioHeading
          title={t(title)}
          eyebrow={eyebrow ? t(eyebrow) : undefined}
          school={school}
          world={world}
          performing={performing}
        />
        {children}
      </main>
    </div>
  );
}

export const btnPrimary =
  "studio-action-primary inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 font-bold tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-40";
export const btnSecondary =
  "studio-action-secondary inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm hover:brightness-125 disabled:opacity-40";

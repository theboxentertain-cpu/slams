import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { useDirectorMode, type DirectorMode } from "@/lib/store";
import { DirectorPortrait } from "@/components/office/DirectorPortrait";

export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className={`wordmark ${small ? "text-xl" : "text-6xl sm:text-7xl"}`} aria-label="SLAMS">
      SL<span className="text-crimson">A</span>MS
    </span>
  );
}

export function DemoBanner() {
  const { user, loading } = useSession();
  if (loading) return null;
  if (user) {
    return (
      <p
        role="note"
        className="bg-secondary px-3 py-1.5 text-center text-xs font-bold text-foreground"
      >
        Signed in as {user.email} — Passport and audition saves use Lovable Cloud. Director settings
        stay in this browser.
      </p>
    );
  }
  return (
    <p role="note" className="bg-warning px-3 py-1.5 text-center text-xs font-bold text-charcoal">
      DEMO MODE — progress is saved only in this browser (local-only).{" "}
      <Link to="/auth" className="underline">
        Sign in to save to your account.
      </Link>
    </p>
  );
}

export function AccountLink() {
  const { user, loading, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (loading) return null;
  if (!user) {
    return (
      <Link to="/auth" className="account-link rounded bg-secondary px-3 py-2 text-sm">
        Sign in
      </Link>
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
        {busy ? "Signing out…" : "Sign out"}
      </Button>
      {error && (
        <span role="alert" className="block text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}

const SYSTEMS = [
  { to: "/baseline", label: "Baseline" },
  { to: "/lab", label: "Performance Lab" },
  { to: "/matrix", label: "Technique Matrix" },
  { to: "/lounge", label: "Rehearsal Lounge" },
  { to: "/passport", label: "Passport" },
  { to: "/director", label: "Director" },
] as const;

export function SystemsNav() {
  return (
    <nav aria-label="Studio systems" className="mt-8">
      <h2 className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Studio systems
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SYSTEMS.map((s) => (
          <li key={s.to}>
            <Link to={s.to} className="panel block px-3 py-3 text-sm hover:border-amber">
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DirectorToggle() {
  const [mode, setMode] = useDirectorMode();
  return (
    <fieldset className="director-controls flex items-center gap-1 text-xs">
      <legend className="sr-only">Director mode</legend>
      <span className="mr-1 text-muted-foreground" aria-hidden>
        Director
      </span>
      {(["on", "quiet", "off"] as DirectorMode[]).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
          className={`rounded px-2 py-1 uppercase ${mode === m ? "bg-amber text-charcoal font-bold" : "bg-secondary"}`}
        >
          {m}
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
}: {
  children: ReactNode;
  short?: string;
  performing?: boolean;
}) {
  const [mode] = useDirectorMode();
  if (performing || mode === "off") return null;
  return (
    <aside aria-label="The Director" className="panel mt-4 flex gap-3 border-amber/40 p-3 text-sm">
      <DirectorPortrait className="director-note-portrait" />
      <p>
        <span className="font-bold text-amber">The Director: </span>
        {mode === "quiet" ? (short ?? children) : children}
      </p>
    </aside>
  );
}

export function Page({
  title,
  eyebrow,
  children,
  school,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  school?: string;
}) {
  const router = useRouter();
  return (
    <div data-school={school} className="min-h-screen">
      <DemoBanner />
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="page-back-button rounded bg-secondary px-3 py-2 text-sm"
        >
          ← Back
        </button>
        <Link to="/" aria-label="Return to the Director’s Office" className="page-office-link">
          <Wordmark small />
          <span>THE OFFICE</span>
        </Link>
        <AccountLink />
      </header>
      <main className="rise mx-auto max-w-3xl px-4 pb-16">
        {eyebrow && (
          <p className="text-xs font-bold tracking-widest text-school uppercase">{eyebrow}</p>
        )}
        <h1 className="mb-4 text-3xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function InDev({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-block rounded border border-warning px-2 py-0.5 text-xs font-bold text-warning">
      {children ?? "In development"}
    </span>
  );
}

export const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 font-bold tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-40";
export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm hover:brightness-125 disabled:opacity-40";

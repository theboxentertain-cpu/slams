import { T } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/slams";
import type { useAuditionPrep } from "@/lib/store";

const FIELDS = [
  { id: "role", label: "Role & project" },
  { id: "circumstances", label: "Given circumstances (who, where, when)" },
  { id: "objective", label: "What do you want from the other person?" },
  { id: "obstacle", label: "What's in the way?" },
  { id: "action", label: "Playable action (to ___ them)" },
  { id: "moment", label: "Moment before you enter" },
] as const;

export function AuditionWorkspace({ prep }: { prep: ReturnType<typeof useAuditionPrep> }) {
  const { error, data, loaded, signedIn, sessionLoading, localHasData, save, importLocalToCloud } =
    prep;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded) setDraft(data);
  }, [loaded, signedIn, data]);

  async function handleSave() {
    setBusy(true);
    setStatus(null);
    const res = await save(draft);
    setBusy(false);
    setStatus(
      res.error
        ? `Save failed: ${res.error}`
        : signedIn
          ? "Saved to your account."
          : "Saved in this browser.",
    );
  }

  async function handleImport() {
    setBusy(true);
    setStatus(null);
    const res = await importLocalToCloud();
    setBusy(false);
    setStatus(
      res.error ? `Import failed: ${res.error}` : "Browser notes imported to your account.",
    );
  }

  return (
    <section aria-label="Audition preparation">
      {!sessionLoading && !signedIn && (
        <p className="mb-4 text-sm text-muted-foreground">
          Work through your sides before the room. Saved locally in this browser —{" "}
          <Link to="/auth" className="underline">
            <T>sign in to save to your account.</T>
          </Link>
        </p>
      )}
      {signedIn && (
        <p className="mb-4 text-sm text-muted-foreground">
          <T>Work through your sides before the room. Saved to your account.</T>
        </p>
      )}
      {signedIn && localHasData && (
        <div className="mb-4 rounded border border-amber p-3 text-sm">
          <p>
            <T>This browser holds audition notes not yet in your account.</T>
          </p>
          <button
            type="button"
            className={`${btnSecondary} mt-2`}
            disabled={busy}
            onClick={handleImport}
          >
            <T>Import browser notes to my account</T>
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {!loaded ? (
        <p role="status">
          <T>Loading…</T>
        </p>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {FIELDS.map((f) => (
            <label key={f.id} className="grid gap-1 text-sm">
              {f.label}
              <textarea
                rows={2}
                disabled={busy}
                value={draft[f.id] ?? ""}
                onChange={(e) => {
                  setDraft({ ...draft, [f.id]: e.target.value });
                  setStatus(null);
                }}
                className="rounded border border-input bg-background p-2"
              />
            </label>
          ))}
          <button className={btnPrimary} disabled={busy}>
            {busy ? "Saving…" : "Save audition prep"}
          </button>
          {status && (
            <p role="status" className="text-sm text-amber">
              {status}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

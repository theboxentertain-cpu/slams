import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useAuditionPrep } from "@/lib/store";

export const Route = createFileRoute("/work")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Actor at Work — SLAMS" }, { name: "description", content: "Prepare an audition step by step." }, { property: "og:title", content: "Actor at Work — SLAMS" }, { property: "og:description", content: "Prepare an audition step by step." }] }),
  component: Work,
});

const FIELDS = [
  { id: "role", label: "Role & project" },
  { id: "circumstances", label: "Given circumstances (who, where, when)" },
  { id: "objective", label: "What do you want from the other person?" },
  { id: "obstacle", label: "What's in the way?" },
  { id: "action", label: "Playable action (to ___ them)" },
  { id: "moment", label: "Moment before you enter" },
] as const;

function Work() {
  const { error, data, loaded, signedIn, sessionLoading, localHasData, save, importLocalToCloud } = useAuditionPrep();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded) setDraft(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, signedIn, data]);

  async function handleSave() {
    setBusy(true);
    setStatus(null);
    const res = await save(draft);
    setBusy(false);
    setStatus(res.error ? `Save failed: ${res.error}` : signedIn ? "Saved to your account." : "Saved in this browser.");
  }

  async function handleImport() {
    setBusy(true);
    setStatus(null);
    const res = await importLocalToCloud();
    setBusy(false);
    setStatus(res.error ? `Import failed: ${res.error}` : "Browser notes imported to your account.");
  }

  return (
    <Page title="Actor at Work" eyebrow="Portal · Audition prep">
      {!sessionLoading && !signedIn && (
        <p className="mb-4 text-sm text-muted-foreground">
          Work through your sides before the room. Saved locally in this browser —{" "}
          <Link to="/auth" className="underline">sign in to save to your account.</Link>
        </p>
      )}
      {signedIn && (
        <p className="mb-4 text-sm text-muted-foreground">Work through your sides before the room. Saved to your account.</p>
      )}
      {signedIn && localHasData && (
        <div className="mb-4 rounded border border-amber p-3 text-sm">
          <p>This browser holds audition notes not yet in your account.</p>
          <button type="button" className={`${btnSecondary} mt-2`} disabled={busy} onClick={handleImport}>
            Import browser notes to my account
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {!loaded ? (
        <p role="status">Loading…</p>
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
                value={draft[f.id] ?? ""}
                onChange={(e) => {
                  setDraft({ ...draft, [f.id]: e.target.value });
                  setStatus(null);
                }}
                className="rounded border border-input bg-background p-2"
              />
            </label>
          ))}
          <button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save audition prep"}</button>
          {status && <p role="status" className="text-sm text-amber">{status}</p>}
        </form>
      )}
    </Page>
  );
}

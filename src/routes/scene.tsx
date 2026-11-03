import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DirectorNote, DirectorToggle, Page, btnPrimary, btnSecondary } from "@/components/slams";
import { INTERVENTIONS, SCENE, TACTICS, getObstacle } from "@/data/scene";
import { usePassport } from "@/lib/store";

export const Route = createFileRoute("/scene")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Living Scene: Stay — SLAMS" },
      { name: "description", content: "A demonstration branching rehearsal scene." },
      { property: "og:title", content: "Living Scene: Stay — SLAMS" },
      { property: "og:description", content: "Perform, intervene, practice, retake." },
    ],
  }),
  component: Scene,
});

type Step =
  "explore" | "perform" | "response" | "intervene" | "practice" | "retake" | "reflect" | "saved";
const STAGES: Step[] = ["perform", "intervene", "practice", "retake", "reflect"];

function Scene() {
  const passport = usePassport();
  const [step, setStep] = useState<Step>("explore");
  const [tactic, setTactic] = useState<string>();
  const [intervention, setIntervention] = useState<string>();
  const [note, setNote] = useState("");
  const [retakeLine, setRetakeLine] = useState("");
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const t = TACTICS.find((x) => x.id === tactic);
  const iv = INTERVENTIONS.find((x) => x.id === intervention);
  const obstacle = t && iv ? getObstacle(t.id, iv.id) : "";
  const performing = step === "perform" || step === "retake";
  const stageIdx = STAGES.indexOf(step === "response" ? "perform" : step);

  async function save() {
    if (!t || !iv) return;
    if (reflection.trim().length < 3) return setError("Write a short reflection before saving.");
    setSaving(true);
    const result = await passport.add({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      tactic: t.verb,
      intervention: `${iv.school}: ${iv.label}`,
      exerciseNote: note.trim(),
      obstacle,
      retakeLine: retakeLine.trim(),
      reflection: reflection.trim(),
    });
    setSaving(false);
    if (result.error) return setError(result.error);
    setStep("saved");
  }

  return (
    <Page
      title={`“${SCENE.title}”`}
      eyebrow="Demonstration Living Scene"
      backTo="/rehearsal"
      world="scene"
      performing={performing}
    >
      <div className="mb-4">
        <DirectorToggle />
      </div>
      {stageIdx >= 0 && (
        <ol aria-label="Progress" className="mb-4 flex gap-1 text-[10px] uppercase">
          {STAGES.map((s, i) => (
            <li
              key={s}
              aria-current={i === stageIdx ? "step" : undefined}
              className={`flex-1 rounded py-1 text-center ${i <= stageIdx ? "bg-crimson" : "bg-secondary"}`}
            >
              {s}
            </li>
          ))}
        </ol>
      )}
      <div aria-live="polite" className="panel p-4">
        {step === "explore" && (
          <>
            <p>{SCENE.setup}</p>
            <p className="mt-2 font-bold">Objective: {SCENE.objective}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Original scene written for demonstration. Sam's responses are fixed and scripted —
              nothing here judges or grades you.
            </p>
            <button className={`${btnPrimary} mt-4 w-full`} onClick={() => setStep("perform")}>
              Begin take
            </button>
          </>
        )}
        {step === "perform" && (
          <>
            <h2 className="text-xl font-bold">Take 1 — choose your tactic</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Read the line aloud if you like, then commit.
            </p>
            <div className="grid gap-2">
              {TACTICS.map((x) => (
                <button
                  key={x.id}
                  className={`${btnSecondary} flex-col items-start text-left`}
                  onClick={() => {
                    setTactic(x.id);
                    setStep("response");
                  }}
                >
                  <span className="font-bold text-amber">{x.verb}</span>
                  <span>“{x.line}”</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === "response" && t && (
          <>
            <p className="text-sm text-muted-foreground">You: “{t.line}”</p>
            <p className="mt-3 text-lg">{t.response}</p>
            <button className={`${btnPrimary} mt-4 w-full`} onClick={() => setStep("intervene")}>
              Cut — call an intervention
            </button>
          </>
        )}
        {step === "intervene" && (
          <>
            <h2 className="text-xl font-bold">Choose one technique intervention</h2>
            <div className="mt-3 grid gap-2">
              {INTERVENTIONS.map((x) => (
                <button
                  key={x.id}
                  data-school={x.id}
                  className={`${btnSecondary} flex-col items-start border-l-4 border-l-school text-left`}
                  onClick={() => {
                    setIntervention(x.id);
                    setStep("practice");
                  }}
                >
                  <span className="font-bold text-school">
                    {x.school} — {x.label}
                  </span>
                  <span className="text-xs">{x.principle}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === "practice" && iv && (
          <>
            <h2 className="text-xl font-bold">{iv.school} exercise</h2>
            <p className="mt-2 text-sm">{iv.exercisePrompt}</p>
            <label htmlFor="ex" className="sr-only">
              Your exercise
            </label>
            <textarea
              id="ex"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={iv.exercisePlaceholder}
              rows={4}
              className="mt-3 w-full rounded border border-input bg-background p-2"
            />
            <button
              disabled={note.trim().length < 3}
              className={`${btnPrimary} mt-3 w-full`}
              onClick={() => setStep("retake")}
            >
              Go to retake
            </button>
          </>
        )}
        {step === "retake" && (
          <>
            <h2 className="text-xl font-bold">Take 2 — new obstacle</h2>
            <p className="mt-2 rounded border border-crimson p-3">{obstacle}</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <strong>Earlier tactic:</strong> {t?.verb}
              </p>
              <p>
                <strong>Your intervention:</strong> {iv?.school} — {iv?.label}
              </p>
              <p className="whitespace-pre-wrap break-words">
                <strong>Your exercise note:</strong> {note}
              </p>
            </div>
            <label htmlFor="rt" className="mt-3 block text-sm">
              Your new line or action
            </label>
            <textarea
              id="rt"
              value={retakeLine}
              onChange={(e) => setRetakeLine(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-input bg-background p-2"
            />
            <button
              disabled={retakeLine.trim().length < 3}
              className={`${btnPrimary} mt-3 w-full`}
              onClick={() => setStep("reflect")}
            >
              Cut — end take
            </button>
            <button
              type="button"
              className={`${btnSecondary} mt-3 w-full`}
              onClick={() => setStep("practice")}
            >
              Back to exercise
            </button>
          </>
        )}
        {step === "reflect" && (
          <>
            <h2 className="text-xl font-bold">Reflection</h2>
            <p className="text-sm text-muted-foreground">
              What changed between take 1 and take 2? Only you can judge this.
            </p>
            <section
              aria-label="Rehearsal summary"
              className="my-4 rounded border border-border p-3"
            >
              <h3 className="font-bold">Your two takes, on the page</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                The partner response is scripted. The exercise, retake and reflection are your own
                notes.
              </p>
              <dl className="mt-3 grid gap-3 text-sm">
                {[
                  ["First-take tactic", `${t?.verb}: “${t?.line}”`],
                  ["Scripted partner response", t?.response],
                  ["Intervention", `${iv?.school} — ${iv?.label}`],
                  ["Your exercise note", note],
                  ["Retake obstacle", obstacle],
                  ["Your retake line or action", retakeLine],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-bold text-amber">{label}</dt>
                    <dd className="whitespace-pre-wrap break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <label htmlFor="rf" className="sr-only">
              Reflection
            </label>
            <textarea
              id="rf"
              value={reflection}
              onChange={(e) => {
                setReflection(e.target.value);
                setError("");
              }}
              rows={4}
              className="mt-2 w-full rounded border border-input bg-background p-2"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              disabled={saving || passport.sessionLoading}
              className={`${btnPrimary} mt-3 w-full`}
              onClick={save}
            >
              {saving ? "Saving…" : "Save to Passport"}
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              Saving is optional. Leaving without saving discards this rehearsal’s notes.
            </p>
            {!saving && (
              <Link to="/" className={`${btnSecondary} mt-2 w-full`}>
                Continue to the Office without saving
              </Link>
            )}
            {!saving && (
              <>
                <button
                  type="button"
                  className={`${btnSecondary} mt-3 w-full`}
                  onClick={() => {
                    setError("");
                    setStep("retake");
                  }}
                >
                  Practice again
                </button>
                <p className="mt-3 text-sm text-muted-foreground">
                  Practice again edits this retake and keeps your notes. Leaving without saving
                  discards the unsaved rehearsal.
                </p>
                <Link to="/rehearsal" className={`${btnSecondary} mt-2 w-full`}>
                  Return to rehearsal without saving
                </Link>
              </>
            )}
          </>
        )}
        {step === "saved" && (
          <>
            <h2 className="text-xl font-bold">Saved to your Passport</h2>
            <p className="text-sm text-muted-foreground">
              {passport.signedIn
                ? "Saved to your account in Lovable Cloud."
                : "Stored in this browser only (demo mode)."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/passport" className={btnPrimary}>
                Open Passport
              </Link>
              <button
                className={btnSecondary}
                onClick={() => {
                  setStep("explore");
                  setTactic(undefined);
                  setIntervention(undefined);
                  setNote("");
                  setRetakeLine("");
                  setReflection("");
                }}
              >
                Rehearse again
              </button>
              <Link to="/rehearsal" className={btnSecondary}>
                Return to the rehearsal studio
              </Link>
            </div>
          </>
        )}
      </div>
      <DirectorNote performing={performing} expression={step === "saved" ? "proud" : step === "intervene" ? "critical" : step === "reflect" ? "observant" : "master"} short={step === "saved" ? "Your reflection is saved." : "Play the action, not the result."}>
        {step === "intervene"
          ? "Each intervention gives you a different retake problem. Pick the one you want to train."
          : step === "saved" ? "Your reflection is saved. Evidence of the work, not a verdict on your talent."
          : step === "reflect" ? "What changed? Be specific. Your observation matters more than my approval."
          : "Play the action, not the result. I'll stay silent during takes."}
      </DirectorNote>
    </Page>
  );
}

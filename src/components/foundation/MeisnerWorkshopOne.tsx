import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { DirectorNote, btnPrimary, btnSecondary } from "@/components/slams";
import { useSession } from "@/lib/session";
import {
  WORKSHOP_ONE, KNOWLEDGE_CHECK, emptyNotes, isCorrectAnswer,
  canStart, canContinue, canSummarize, practiceNote,
  type Category, type Mode, type Notes
} from "@/data/meisner-workshop-one";

type Stage = "learn" | "check" | "mode" | "practice" | "reflect" | "summary";

function Field({ id, label, value, onChange, hint }: {
  id: string; label: string; value: string; onChange: (value: string) => void; hint?: string
}) {
  return <div className="mt-4">
    <label htmlFor={id} className="block font-semibold">{label}</label>
    {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    <textarea id={id} rows={3} maxLength={1200} value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded border border-border bg-background p-3 text-foreground" />
  </div>;
}

/** Account-identity-keyed, temporary session state; intentionally no remote or local storage. */
export function MeisnerWorkshopOne() {
  const { user, loading } = useSession();
  if (loading) return <p role="status">Loading training preview…</p>;
  return <WorkshopRun key={user?.id ?? "guest"} />;
}

function WorkshopRun() {
  const [stage, setStage] = useState<Stage>("learn");
  const [lessonNumber, setLessonNumber] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState<Category | null>(null);
  const [mode, setMode] = useState<Mode>("solo");
  const [consent, setConsent] = useState(false);
  const [boundaries, setBoundaries] = useState(false);
  const [exercise, setExercise] = useState<0 | 1>(0);
  const [notes, setNotes] = useState<Notes>(emptyNotes);
  const [copyMessage, setCopyMessage] = useState("");

  const lesson = WORKSHOP_ONE.lessons[lessonNumber]!;
  const question = KNOWLEDGE_CHECK[questionNumber]!;
  const correct = answer !== null && isCorrectAnswer(question.id, answer);
  const stages: Record<Stage, string> = {
    learn: "1 of 5 · Learn", check: "2 of 5 · Distinguish", mode: "3 of 5 · Choose",
    practice: "4 of 5 · Practice", reflect: "5 of 5 · Reflect", summary: "Review your note"
  };
  const update = (field: keyof Notes, value: string) =>
    setNotes((previous) => ({ ...previous, [field]: value }));
  const reset = () => {
    setStage("learn"); setLessonNumber(0); setQuestionNumber(0); setAnswer(null);
    setMode("solo"); setConsent(false); setBoundaries(false); setExercise(0);
    setNotes(emptyNotes()); setCopyMessage("");
  };
  const copy = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setCopyMessage("Clipboard unavailable. Select the note and copy it manually.");
      } else {
        await navigator.clipboard.writeText(practiceNote(mode, notes));
        setCopyMessage("Copied. Your note was not saved to SLAMS.");
      }
    } catch {
      setCopyMessage("Copy failed. Select the note and copy it manually.");
    }
  };

  return <section className="panel p-4 sm:p-6" aria-label="Interactive Meisner Workshop 1">
    <span className="office-kicker">SOURCE-GROUNDED EDITORIAL PREVIEW · {WORKSHOP_ONE.id}</span>
    <h3 className="mt-2 text-xl font-bold">Workshop 1 — Attention on the other person</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Three original SLAMS lessons, two partner exercises, and a guided reflection.
      Pending qualified teacher review. No formal lesson completion or acting evaluation is available.
    </p>
    <p className="mt-3 text-sm font-semibold" role="status">{stages[stage]}</p>

    {stage === "learn" && <section className="mt-4" aria-label="Lesson">
      <p className="text-xs text-muted-foreground">Lesson {lessonNumber + 1} of 3 · {lesson.id}</p>
      <h4 className="mt-2 text-lg font-semibold">{lesson.title}</h4>
      <p className="mt-3"><strong>Why:</strong> {lesson.why}</p>
      <p className="mt-3"><strong>Demonstration:</strong> {lesson.example}</p>
      <p className="mt-3"><strong>Try:</strong> {lesson.apply}</p>
      <p className="mt-3"><strong>Avoid:</strong> {lesson.caution}</p>
      <DirectorNote short="Observe, then respond.">{lesson.director}</DirectorNote>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => {
          if (lessonNumber < 2) setLessonNumber(lessonNumber + 1);
          else { setStage("check"); setQuestionNumber(0); setAnswer(null); }
        }}>{lessonNumber === 2 ? "Try knowledge questions" : "Next lesson"}</button>
        {lessonNumber > 0 && <button type="button" className={btnSecondary}
          onClick={() => setLessonNumber(lessonNumber - 1)}>Previous lesson</button>}
      </div>
    </section>}

    {stage === "check" && <section className="mt-4" aria-label="Knowledge check">
      <h4 className="text-lg font-semibold">Observation or interpretation?</h4>
      <p className="mt-2 text-sm">This is a written classification exercise, not a test of partner responsiveness.</p>
      <p className="mt-3 text-sm">Example {questionNumber + 1} of {KNOWLEDGE_CHECK.length}</p>
      <fieldset className="mt-3">
        <legend className="text-lg font-semibold">“{question.statement}”</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["observation", "Observation"], ["interpretation", "Interpretation"], ["experience", "My experience"]
          ] as [Category, string][]).map(([value, label]) =>
            <button type="button" key={value} aria-pressed={answer === value}
              className={btnSecondary} onClick={() => setAnswer(value)}>{label}</button>
          )}
        </div>
      </fieldset>
      {answer && <div role="status" className="availability-note mt-3">
        <strong>{correct ? "Correct." : "Reconsider your answer."}</strong>
        <p>{correct ? question.why : "Does this describe an observable event, an inference, or the speaker's own experience?"}</p>
      </div>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={!correct} onClick={() => {
          if (questionNumber < KNOWLEDGE_CHECK.length - 1) {
            setQuestionNumber(questionNumber + 1); setAnswer(null);
          } else setStage("mode");
        }}>{questionNumber === KNOWLEDGE_CHECK.length - 1 ? "Choose practice mode" : "Next example"}</button>
        <button type="button" className={btnSecondary} onClick={() => {
          if (questionNumber === 0) { setStage("learn"); setLessonNumber(2); }
          else { setQuestionNumber(questionNumber - 1); setAnswer(null); }
        }}>Back</button>
      </div>
    </section>}

    {stage === "mode" && <section className="mt-4" aria-label="Practice setup">
      <h4 className="text-lg font-semibold">Who can practise with you?</h4>
      <p className="mt-2">Solo observation preparation cannot count as Meisner partner practice.
        The two authored exercises require a consenting human partner.</p>
      <fieldset className="mt-3 space-y-3">
        <legend className="font-semibold">Practice mode</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="meisner-practice-mode" checked={mode === "solo"} onChange={() => setMode("solo")} />
          Solo preparation only
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="meisner-practice-mode" checked={mode === "partner"} onChange={() => setMode("partner")} />
          With a real human partner
        </label>
      </fieldset>
      {mode === "partner" && <fieldset className="mt-3 space-y-2">
        <legend className="font-semibold">Participation and boundaries</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          My partner voluntarily agreed.
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={boundaries} onChange={(event) => setBoundaries(event.target.checked)} />
          We can both pause or stop, avoid personal judgments, and will not record by default.
        </label>
        <p className="text-sm text-muted-foreground">
          These are self-reported conditions, not verified consent. Do not include personal identifying information.
        </p>
      </fieldset>}
      <DirectorNote short="A real partner matters.">
        Repetition requires another human. Solo preparation is useful; it is not the same thing.
      </DirectorNote>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary}
          disabled={!canStart(mode, consent, boundaries)}
          onClick={() => { setExercise(0); setStage("practice"); }}>Begin practice</button>
        <button type="button" className={btnSecondary}
          onClick={() => { setStage("check"); setQuestionNumber(KNOWLEDGE_CHECK.length - 1); setAnswer(null); }}>Back</button>
      </div>
    </section>}

    {stage === "practice" && <section className="mt-4" aria-label="Guided exercise">
      <p className="text-xs text-muted-foreground">{mode === "solo" ? "SOLO PREPARATION" : "REAL PARTNER · SELF-REPORTED ONLY"}</p>
      <h4 className="mt-2 text-lg font-semibold">
        {exercise === 0 ? WORKSHOP_ONE.exercises[0].title : WORKSHOP_ONE.exercises[1].title}
      </h4>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        {(exercise === 0
          ? mode === "solo"
            ? ["Observe a neutral object or your own non-sensitive material.",
                "Describe a visible change, without inferring motive.",
                "Write an assumption and revise it as a testable observation."]
            : ["Agree a pause signal and comfortable distance.", "Notice neutral movement, action or timing.",
                "Offer a simple observation. Allow correction or disagreement.",
                "Swap roles, then note an assumption and its correction."]
          : ["Privately note a harmless reply you expect.", "Offer an ordinary observation.",
              "Listen to the person's actual reply without forcing an effect.",
              "Answer what you heard. Swap roles and reflect."]
        ).map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">
        No recording, matching, diagnosis or remote saving. Do not identify or describe private details of your partner.
      </p>
      {exercise === 0 ? <>
        <Field id="meisner-observation" label="What observable event did you notice?"
          value={notes.observation} onChange={(v) => update("observation", v)} />
        <Field id="meisner-assumption" label="What explanation or assumption occurred to you?"
          value={notes.assumption} onChange={(v) => update("assumption", v)} />
        <Field id="meisner-correction" label="How can you express this more accurately?"
          value={notes.correction} onChange={(v) => update("correction", v)} />
        {mode === "partner" && <Field id="meisner-partner-reply"
          label="How did your partner reply, confirm or correct you?"
          hint="Your note is self-report, not independent partner verification."
          value={notes.partnerReply} onChange={(v) => update("partnerReply", v)} />}
      </> : <>
        <Field id="meisner-expected" label="What reply did you originally predict?"
          value={notes.expected} onChange={(v) => update("expected", v)} />
        <Field id="meisner-actual" label="What did your partner actually say or do?"
          value={notes.actual} onChange={(v) => update("actual", v)} />
        <Field id="meisner-adjusted" label="How did your next response change?"
          value={notes.adjusted} onChange={(v) => update("adjusted", v)} />
      </>}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={!canContinue(mode, exercise, notes)}
          onClick={() => {
            if (mode === "partner" && exercise === 0) setExercise(1);
            else setStage("reflect");
          }}>{mode === "partner" && exercise === 0 ? "Exercise 02 — Receive" : "Reflect on this attempt"}</button>
        <button type="button" className={btnSecondary}
          onClick={() => { if (exercise === 1) setExercise(0); else setStage("mode"); }}>Back</button>
      </div>
    </section>}

    {stage === "reflect" && <section className="mt-4" aria-label="Post-exercise reflection">
      <h4 className="text-lg font-semibold">Reflect on what happened</h4>
      <p className="mt-2">Describe what changed without rating yourself or another actor's emotions.</p>
      <Field id="meisner-reflection"
        label={mode === "partner" ? "What surprised you in the actual exchange?" : "What did you notice about your assumptions?"}
        value={notes.reflection} onChange={(v) => update("reflection", v)} />
      <Field id="meisner-next" label="What specific change will you try next?"
        value={notes.next} onChange={(v) => update("next", v)} />
      <DirectorNote short="One specific adjustment.">
        Name one concrete adjustment. You can test it next time without inventing a grade.
      </DirectorNote>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={!canSummarize(notes)}
          onClick={() => setStage("summary")}>Review private practice note</button>
        <button type="button" className={btnSecondary} onClick={() => {
          setExercise(mode === "partner" ? 1 : 0); setStage("practice");
        }}>Back to practice</button>
      </div>
    </section>}

    {stage === "summary" && <section className="mt-4" aria-label="Private practice note">
      <h4 className="text-lg font-semibold">Your practice note</h4>
      <p className="mt-2">
        Self-reported and NOT assessed. This note exists only in the open screen until you explicitly copy it.
        It does not save to Passport or unlock training.
      </p>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-secondary p-3 text-sm">
        {practiceNote(mode, notes)}
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => void copy()}>Copy my note</button>
        <button type="button" className={btnSecondary} onClick={() => setStage("reflect")}>Revise</button>
        <button type="button" className={btnSecondary} onClick={reset}>Start a new attempt</button>
      </div>
      {copyMessage && <p role="status" className="mt-2 text-sm">{copyMessage}</p>}
      <p className="mt-4 text-sm">You can also try the <Link to="/scene" className="underline">
        scripted Living Scene</Link>, which is separate from this partnered exercise.</p>
    </section>}
    <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
      SLAMS independent editorial adaptation, pending faculty review.
      No acting evaluation, saved progression, official credential or term completion.
    </p>
  </section>;
}

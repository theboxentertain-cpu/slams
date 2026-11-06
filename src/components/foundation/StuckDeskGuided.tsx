import { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { usePassport, type PassportEntry } from "@/lib/store";
import { DirectorNote, btnPrimary, btnSecondary } from "@/components/slams";
import {
  RESCUE_PROBLEMS,
  canCompareRescue,
  rescueNote,
  rescueOutcomeLabel,
  rescueProblemById,
  type RescueInput,
  type RescueOutcome,
  type RescueProblemId,
} from "@/data/stuck-guided";

type RescueStage = "choose" | "first" | "intervene" | "retake" | "review";
type TextField = "firstAttempt" | "secondAttempt" | "difference";
const MAX_LENGTH = 1200;
const initialInput: RescueInput = {
  problemId: "",
  firstAttempt: "",
  secondAttempt: "",
  difference: "",
  outcome: "unsure",
};

export function StuckDeskGuided() {
  const { user, loading } = useSession();
  const { locale } = useLanguage();
  if (loading) return <p role="status">{locale === "ar" ? "جارٍ فتح مكتب التعثر…" : "Opening the Stuck Desk…"}</p>;
  return <StuckDeskSession key={user?.id ?? "guest"} />;
}

function StuckDeskSession() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const passport = usePassport();
  const [stage, setStage] = useState<RescueStage>("choose");
  const [input, setInput] = useState<RescueInput>(initialInput);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const problem = rescueProblemById(input.problemId);
  const tx = <T extends { en: string; ar: string }>(text: T) => text[locale];
  const ready = canCompareRescue(input);
  const summary = ready ? rescueNote(input, locale) : "";

  useEffect(() => {
    stageHeading.current?.focus();
  }, [stage]);

  function choose(problemId: RescueProblemId) {
    setInput({ ...initialInput, problemId });
    setFeedback("");
    setFeedbackError(false);
    setSaved(false);
    setStage("first");
  }
  function edit(field: TextField, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setFeedback("");
    setFeedbackError(false);
  }
  function restart() {
    setInput(initialInput);
    setStage("choose");
    setSaved(false);
    setBusy(false);
    setFeedback("");
    setFeedbackError(false);
  }
  async function copyNote() {
    if (!ready) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setFeedbackError(true);
      setFeedback(ar ? "الحافظة غير متاحة. حدّد النص وانسخه يدويًا." : "Clipboard unavailable. Select the note and copy it manually.");
      return;
    }
    try {
      await navigator.clipboard.writeText(summary);
      setFeedbackError(false);
      setFeedback(ar ? "تم نسخ ملاحظاتك، ولم تُحفظ في حسابك." : "Note copied. It was not saved to your account.");
    } catch {
      setFeedbackError(true);
      setFeedback(ar ? "تعذّر النسخ. حدّد النص وانسخه يدويًا." : "Copy failed. Select the note and copy it manually.");
    }
  }
  async function saveNote() {
    if (!ready || !passport.loaded || passport.error || saved || busy || !problem) return;
    if (!globalThis.crypto?.randomUUID) {
      setFeedbackError(true);
      setFeedback(ar ? "الحفظ غير متاح في هذا السياق. انسخ ملاحظاتك بدلًا من ذلك." : "Secure saving is unavailable here. Copy your note instead.");
      return;
    }
    setBusy(true);
    setFeedback("");
    setFeedbackError(false);
    const entry: PassportEntry = {
      id: globalThis.crypto.randomUUID(),
      date: new Date().toISOString(),
      tactic: problem.lens.en,
      intervention: problem.intervention.en,
      exerciseNote: input.firstAttempt.trim(),
      obstacle: problem.title.en,
      retakeLine: input.secondAttempt.trim(),
      reflection: [input.difference.trim(), rescueOutcomeLabel(input.outcome).en].join(" — "),
    };
    try {
      const result = await passport.add(entry);
      if (result.error) {
        setFeedbackError(true);
        setFeedback(ar ? "تعذّر حفظ المذكرة. لم يتم تأكيد الحفظ؛ حاول مجددًا أو انسخ النص." : "Save was not confirmed. Retry or copy your note.");
      } else {
        setSaved(true);
        setFeedbackError(false);
        setFeedback(ar ? "تم الحفظ في جواز الممثل." : "Saved to your Actor’s Passport.");
      }
    } catch {
      setFeedbackError(true);
      setFeedback(ar ? "تعذّر حفظ المذكرة. لم يتم تأكيد الحفظ؛ حاول مجددًا أو انسخ النص." : "Save was not confirmed. Retry or copy your note.");
    } finally {
      setBusy(false);
    }
  }
  const label = (en: string, arLabel: string) => (ar ? arLabel : en);
  const heading = (text: string) => <h3 ref={stageHeading} tabIndex={-1} className="text-xl font-bold focus:outline-none">{text}</h3>;
  const textField = (field: TextField, en: string, arabic: string, hint?: string) => (
    <div className="mt-4">
      <label className="block font-semibold" htmlFor={`stuck-${field}`}>{label(en, arabic)}</label>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <textarea
        id={`stuck-${field}`}
        rows={4}
        maxLength={MAX_LENGTH}
        className="mt-2 w-full rounded border border-border bg-background p-3 text-foreground"
        value={input[field]}
        onChange={(event) => edit(field, event.target.value)}
      />
      <p className="mt-1 text-xs text-muted-foreground">{input[field].length}/{MAX_LENGTH}</p>
    </div>
  );

  return (
    <section className="studio-sheet foundation-stack stuck-guided" data-stage={stage} aria-label={label("Guided Stuck Desk workflow", "مسار مكتب التعثر التفاعلي")}>
      <div className="availability-note">
        <p className="office-kicker">{label("60-SECOND RESCUE · ORIGINAL SLAMS DRAFT", "إنقاذ سريع · مسودة SLAMS أصلية")}</p>
        <p className="mt-1">
          {label(
            "You choose the problem. SLAMS suggests a technique-informed experiment; it does not watch, diagnose, or grade your acting. No recording is made.",
            "أنت تختار المشكلة. يقترح SLAMS تجربة مستندة إلى أسلوب تمثيل، لكنه لا يشاهد أداءك ولا يشخّصه أو يمنحه درجة. لا يوجد تسجيل."
          )}
        </p>
      </div>

      {stage === "choose" && (
        <section className="panel p-4">
          {heading(label("01 — What actually got stuck?", "٠١ — ما المشكلة التي واجهتك؟"))}
          <p className="mt-2 text-sm text-muted-foreground">
            {label("Select the one issue you noticed yourself. This is not an automatic diagnosis.", "اختر مشكلة واحدة لاحظتها بنفسك. هذا ليس تشخيصًا آليًا.")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {RESCUE_PROBLEMS.map((item) => (
              <button key={item.id} type="button" className="min-h-16 rounded border border-border bg-secondary p-4 text-start transition-colors hover:border-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                onClick={() => choose(item.id)}>
                <strong className="block">{tx(item.title)}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{tx(item.lens)}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm">
            <Link to="/scene" className="underline">{label("Try the Living Scene instead", "جرّب المشهد التفاعلي بدلًا من ذلك")}</Link>
          </p>
        </section>
      )}

      {stage === "first" && problem && (
        <section className="panel p-4">
          {heading(label("02 — Observe your first attempt", "٠٢ — لاحظ محاولتك الأولى"))}
          <p className="mt-2"><strong>{tx(problem.title)}</strong> · {tx(problem.lens)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {label("Use a real rehearsal you just did or a short safe rehearsal now. Describe behavior, not a personality label or guessed emotion.", "استخدم بروفة حقيقية قمت بها أو جرّب بروفة قصيرة آمنة الآن. صف السلوك، لا الشخصية أو المشاعر التي تفترضها.")}
          </p>
          {textField("firstAttempt", "What did you actually say or do on the first attempt?", "ماذا قلت أو فعلت بالفعل في المحاولة الأولى؟")}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={input.firstAttempt.trim().length < 8} onClick={() => setStage("intervene")}>
              {label("Choose the adjustment", "اختر التعديل")}
            </button>
            <button type="button" className={btnSecondary} onClick={() => setStage("choose")}>{label("Change the problem", "غيّر المشكلة")}</button>
          </div>
        </section>
      )}

      {stage === "intervene" && problem && (
        <section className="panel p-4">
          {heading(label("03 — Change one playable thing", "٠٣ — غيّر فعلًا واحدًا قابلًا للأداء"))}
          <p className="mt-2 font-semibold text-amber">{tx(problem.lens)}</p>
          <div className="mt-3">
            <h4 className="font-bold">{label("WHY IT MAY HELP", "لماذا قد يساعد؟")}</h4>
            <p className="mt-1">{tx(problem.why)}</p>
          </div>
          <div className="mt-3">
            <h4 className="font-bold">{label("DO THIS", "جرّب هذا")}</h4>
            <p className="mt-1">{tx(problem.intervention)}</p>
          </div>
          <div className="mt-3">
            <h4 className="font-bold">{label("SOLO APPLICATION", "التطبيق الفردي")}</h4>
            <p className="mt-1">{tx(problem.solo)}</p>
          </div>
          <div className="mt-3">
            <h4 className="font-bold">{label("WITH A CONSENTING PARTNER", "مع شريك موافق")}</h4>
            <p className="mt-1">{tx(problem.partner)}</p>
          </div>
          <div className="mt-3">
            <h4 className="font-bold">{label("DON’T", "تجنّب")}</h4>
            <p className="mt-1">{tx(problem.avoid)}</p>
          </div>
          <DirectorNote short={label("Change the action. Watch the result.", "غيّر الفعل. راقب النتيجة.")}>
            {label("Do the same short scene again with exactly one adjustment. The difference may be small or absent. Record what happens, not what you wish happened.",
              "أعِد المشهد القصير بتعديل واحد فقط. قد يكون الفرق بسيطًا أو غير موجود. دوّن ما حدث، لا ما كنت تتمناه.")}
          </DirectorNote>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => setStage("retake")}>{label("Attempt the retake", "جرّب الإعادة")}</button>
            <button type="button" className={btnSecondary} onClick={() => setStage("first")}>{label("Back to first attempt", "العودة للمحاولة الأولى")}</button>
          </div>
        </section>
      )}

      {stage === "retake" && problem && (
        <section className="panel p-4">
          {heading(label("04 — Retake and compare", "٠٤ — أعد المحاولة وقارن"))}
          <p className="mt-2 text-sm text-muted-foreground">{tx(problem.cue)}</p>
          <div className="mt-3 rounded border border-border bg-secondary p-3">
            <h4 className="font-semibold">{label("First attempt — your own observation", "المحاولة الأولى — ملاحظتك الشخصية")}</h4>
            <p className="mt-1 whitespace-pre-wrap break-words">{input.firstAttempt}</p>
          </div>
          {textField("secondAttempt", "What did you actually say or do after the adjustment?", "ماذا قلت أو فعلت بالفعل بعد التعديل؟")}
          {textField("difference", "What specific difference, if any, did you notice?", "ما الفرق المحدد الذي لاحظته، إن وُجد؟", label("It is valid to say nothing changed. Avoid grading yourself.", "من المقبول أن تقول إن شيئًا لم يتغيّر. لا تمنح نفسك درجة."))}
          <fieldset className="mt-4 space-y-2">
            <legend className="font-semibold">{label("Your own judgment — not a skill rating", "رأيك الشخصي — ليس تقييمًا للمهارة")}</legend>
            {(["change", "no-change", "unsure"] as RescueOutcome[]).map((value) => (
              <label key={value} className="flex min-h-11 items-center gap-2">
                <input type="radio" name="rescue-outcome" checked={input.outcome === value}
                  onChange={() => setInput((current) => ({ ...current, outcome: value }))} />
                {tx(rescueOutcomeLabel(value))}
              </label>
            ))}
          </fieldset>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={!ready} onClick={() => setStage("review")}>{label("Review private comparison", "راجع المقارنة الخاصة")}</button>
            <button type="button" className={btnSecondary} onClick={() => setStage("intervene")}>{label("Review the adjustment", "راجع التعديل")}</button>
          </div>
        </section>
      )}

      {stage === "review" && problem && (
        <section className="panel p-4">
          {heading(label("05 — Keep the evidence, not a fake score", "٠٥ — احتفظ بالملاحظات دون درجة وهمية"))}
          <p className="mt-2 text-sm text-muted-foreground">
            {label(
              "This is a learner-written comparison only. The app has not verified your performance or the partner’s consent.",
              "هذه مقارنة كتبتها بنفسك. لم يتحقق التطبيق من الأداء أو موافقة الشريك."
            )}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-border bg-secondary p-3">
              <h4 className="font-bold">{label("Before", "قبل")}</h4>
              <p className="mt-2 whitespace-pre-wrap break-words">{input.firstAttempt}</p>
            </div>
            <div className="rounded border border-border bg-secondary p-3">
              <h4 className="font-bold">{label("After", "بعد")}</h4>
              <p className="mt-2 whitespace-pre-wrap break-words">{input.secondAttempt}</p>
            </div>
          </div>
          <p className="mt-3 font-semibold">{tx(rescueOutcomeLabel(input.outcome))}</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{input.difference}</p>
          <h4 className="mt-4 font-bold">{label("Your private note", "مذكرتك الخاصة")}</h4>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-background p-3 text-sm" dir="auto">{summary}</pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => void copyNote()}>{label("Copy note (no save)", "انسخ المذكرة دون حفظ")}</button>
            <button type="button" className={btnPrimary} disabled={!passport.loaded || !!passport.error || saved || busy} onClick={() => void saveNote()}>
              {saved ? label("Saved to Passport", "حُفظت في جواز الممثل") : busy ? label("Saving…", "جارٍ الحفظ…") : label("Save to Actor’s Passport", "احفظ في جواز الممثل")}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {label(
              passport.signedIn
                ? "Save is explicit. Signed-in records are written to your account using the existing Passport connection."
                : "Save is explicit. Guest records stay in this browser; they are not silently uploaded.",
              passport.signedIn
                ? "الحفظ يتم بطلب منك فقط. تُحفظ بيانات الحساب المسجّل في جواز الممثل عبر الاتصال الحالي."
                : "الحفظ يتم بطلب منك فقط. بيانات الضيف تبقى في هذا المتصفح ولا تُرفع تلقائيًا."
            )}
          </p>
          {passport.error && <p role="alert">{label("Passport is unavailable. Copy this note instead.", "جواز الممثل غير متاح. انسخ مذكرتك بدلًا من ذلك.")}</p>}
          {!passport.loaded && !passport.error && <p role="status">{label("Checking Passport availability…", "جارٍ فحص جواز الممثل…")}</p>}
          {feedback && <p role={feedbackError ? "alert" : "status"} className="mt-2">{feedback}</p>}
          {saved && (
            <p className="mt-3">
              <Link to="/passport" className="underline">{label("Open your saved Passport record", "افتح السجل المحفوظ في جواز الممثل")}</Link>
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {!saved && <button type="button" className={btnSecondary} onClick={() => setStage("retake")}>{label("Revise this comparison", "عدّل المقارنة")}</button>}
            <button type="button" className={btnSecondary} onClick={restart}>{label("Try another problem", "جرّب مشكلة أخرى")}</button>
            <Link to="/scene" className={btnSecondary}>{label("Practice the Living Scene", "تدرّب في المشهد التفاعلي")}</Link>
          </div>
        </section>
      )}
    </section>
  );
}

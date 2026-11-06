import { useState } from "react";
import { useSession } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { DirectorNote, btnPrimary, btnSecondary } from "@/components/slams";
import {
  STAN_CHECKS,
  STAN_EDITORIAL_ROUNDS,
  STAN_EXERCISES,
  STAN_LESSONS,
  blankStanRound,
  canAdvanceStanExercise,
  canLogStanRound,
  canStartStanPartner,
  countStanRounds,
  recordStanRound,
  stanPracticeSummary,
  type Bilingual,
  type StanField,
  type StanMode,
  type StanRound,
  type StanRoundInput,
  type StanStage,
} from "@/data/stanislavski-editorial-workshop-one";

const FIELD_PROMPTS: Record<StanField, Bilingual> = {
  circumstances: {
    en: "What facts or conditions apply in this attempt?",
    ar: "ما الحقائق أو الظروف في هذه المحاولة؟",
  },
  objective: { en: "What precisely are you trying to achieve?", ar: "ما الهدف المحدد الذي تحاول تحقيقه؟" },
  action: { en: "Which playable action did you actually attempt?", ar: "ما الفعل القابل للأداء الذي حاولت تنفيذه؟" },
  obstacle: { en: "What ordinary obstacle affected that action?", ar: "ما العائق العادي الذي أثّر على الفعل؟" },
  observation: { en: "What did you observe, not assume?", ar: "ماذا لاحظت فعلًا، لا ماذا افترضت؟" },
  adjustment: { en: "What did you change in response?", ar: "ماذا غيّرت في استجابتك؟" },
};
const FIELDS = Object.keys(FIELD_PROMPTS) as StanField[];

function TextEntry({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="block font-semibold">{label}</label>
      <textarea
        id={id}
        rows={2}
        maxLength={900}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded border border-border bg-background p-3 text-foreground"
      />
    </div>
  );
}

/** Private session only. Identity-keyed remount prevents carrying an actor's notes to another account. */
export function StanislavskiWorkshopOne() {
  const { user, loading } = useSession();
  const { locale } = useLanguage();
  if (loading) return <p role="status">{locale === "ar" ? "جارٍ إعداد ورشة ستانيسلافسكي…" : "Loading Stanislavski workshop…"}</p>;
  return <StanislavskiWorkshopRun key={user?.id ?? "guest"} />;
}

function StanislavskiWorkshopRun() {
  const { locale } = useLanguage();
  const tx = (value: Bilingual) => value[locale];
  const [stage, setStage] = useState<StanStage>("learn");
  const [lesson, setLesson] = useState(0);
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [mode, setMode] = useState<StanMode>("solo");
  const [consent, setConsent] = useState(false);
  const [boundaries, setBoundaries] = useState(false);
  const [exercise, setExercise] = useState(0);
  const [input, setInput] = useState<StanRoundInput>(blankStanRound);
  const [history, setHistory] = useState<StanRound[]>([]);
  const [reflection, setReflection] = useState("");
  const [nextAttempt, setNextAttempt] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const lessonData = STAN_LESSONS[lesson]!;
  const check = STAN_CHECKS[question]!;
  const task = STAN_EXERCISES[exercise]!;
  const rounds = countStanRounds(task.id, mode, history);
  const enough = canAdvanceStanExercise(task.id, mode, history);
  const isArabic = locale === "ar";

  const switchMode = (newMode: StanMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setConsent(false);
    setBoundaries(false);
    setExercise(0);
    setInput(blankStanRound());
    setHistory([]);
    setReflection("");
    setNextAttempt("");
    setCopyMessage("");
  };
  const restart = () => {
    setStage("learn");
    setLesson(0);
    setQuestion(0);
    setAnswer(null);
    setMode("solo");
    setConsent(false);
    setBoundaries(false);
    setExercise(0);
    setInput(blankStanRound());
    setHistory([]);
    setReflection("");
    setNextAttempt("");
    setCopyMessage("");
  };
  const logRound = () => {
    if (!canLogStanRound(task.id, mode, input, history)) return;
    setHistory((previous) => recordStanRound(task.id, mode, input, previous));
    setInput(blankStanRound());
  };
  const copy = async () => {
    const note = stanPracticeSummary(mode, history, reflection, nextAttempt);
    try {
      if (!navigator.clipboard) {
        setCopyMessage(isArabic ? "الحافظة غير متاحة؛ حدّد النص وانسخه يدويًا." : "Clipboard unavailable. Select the text and copy manually.");
        return;
      }
      await navigator.clipboard.writeText(note);
      setCopyMessage(isArabic ? "تم النسخ. لم تُحفظ الملاحظات في SLAMS." : "Copied. Nothing was saved to SLAMS.");
    } catch {
      setCopyMessage(isArabic ? "تعذّر النسخ. حدّد النص وانسخه يدويًا." : "Copy failed. Select the text and copy manually.");
    }
  };

  return (
    <section className="panel p-4 sm:p-6 stanislavski-workshop" aria-label={isArabic ? "ورشة ستانيسلافسكي الأولى" : "Stanislavski Workshop 1"} data-stage={stage}>
      <span className="office-kicker">SLAMS ORIGINAL EDITORIAL PREVIEW · Y1/T1/W01</span>
      <h3 className="mt-2 text-xl font-bold">{isArabic ? "الورشة الأولى — التمثيل بهدف واضح" : "Workshop 01 — Acting with a purpose"}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {isArabic
          ? "مادة تدريبية أصلية مستندة إلى نتائج تعلم منشورة في جامعات ومعاهد، وليست منهاجًا رسميًا لأي مؤسسة. لم يراجعها مدرس معتمد بعد. لا تمنح إتمامًا أو إجازة أو فتحًا أكاديميًا."
          : "Original teaching aligned to publicly documented higher-education competencies, not any institution's official course. Awaiting qualified educator review; no completion, credit, grade or academic unlock."}
      </p>
      <p role="status" className="mt-3 font-semibold">
        {({ learn: isArabic ? "١ · تعلّم" : "1 · Learn",
            check: isArabic ? "٢ · تحقّق من الفهم" : "2 · Knowledge check",
            setup: isArabic ? "٣ · اختر طريقة التدريب" : "3 · Prepare",
            practice: isArabic ? "٤ · تطبيق عملي" : "4 · Apply",
            reflect: isArabic ? "٥ · مراجعة وتأمّل" : "5 · Reflect",
            review: isArabic ? "مذكرة خاصة — بلا اعتماد" : "Private note · no credit" } as const)[stage]}
      </p>

      {stage === "learn" && (
        <section className="mt-4" aria-label={isArabic ? "الدرس" : "Lesson"}>
          <p className="text-xs text-muted-foreground">
            {isArabic ? "الدرس" : "Lesson"} {lesson + 1} / {STAN_LESSONS.length} · {lessonData.id}
          </p>
          <h4 className="mt-2 text-lg font-semibold">{tx(lessonData.title)}</h4>
          <p className="mt-2"><strong>{isArabic ? "الهدف التعليمي:" : "Learning outcome:"}</strong> {tx(lessonData.outcome)}</p>
          {([
            ["why", isArabic ? "لماذا؟" : "WHY"],
            ["how", isArabic ? "كيف؟" : "HOW"],
            ["when", isArabic ? "متى؟" : "WHEN"],
            ["notToDo", isArabic ? "ما الذي لا تفعله؟" : "WHAT NOT TO DO"],
            ["example", isArabic ? "مثال عملي" : "PRACTICAL EXAMPLE"],
            ["solo", isArabic ? "تطبيق فردي" : "SOLO APPLICATION"],
            ["partner", isArabic ? "تطبيق مع شريك" : "PARTNER / GROUP APPLICATION"],
            ["realWorld", isArabic ? "التطبيق المهني" : "REAL-WORLD APPLICATION"],
            ["evidence", isArabic ? "الدليل المطلوب" : "EVIDENCE TO OBSERVE"],
          ] as const).map(([key, label]) => (
            <div key={key} className="mt-4">
              <h5 className="font-semibold">{label}</h5>
              <p className="mt-1">{tx(lessonData[key])}</p>
            </div>
          ))}
          <div className="mt-4">
            <h5 className="font-semibold">{isArabic ? "أخطاء شائعة" : "COMMON PITFALLS"}</h5>
            <ul className="mt-1 list-disc space-y-1 ps-5">
              {lessonData.pitfalls.map((pitfall, i) => <li key={i}>{tx(pitfall)}</li>)}
            </ul>
          </div>
          <DirectorNote short={isArabic ? "لا تمثّل النتيجة؛ نفّذ الفعل." : "Play the action, not its outcome."}>
            {isArabic ? "اسأل: ماذا أحاول أن أغيّر الآن، وما الذي يحدث فعلًا؟" : "What are you trying to change now, and what actually happens?"}
          </DirectorNote>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => {
              if (lesson < STAN_LESSONS.length - 1) setLesson((n) => n + 1);
              else { setStage("check"); setQuestion(0); setAnswer(null); }
            }}>{lesson < STAN_LESSONS.length - 1
                ? (isArabic ? "الدرس التالي" : "Next lesson")
                : (isArabic ? "اختبر فهمك" : "Check your understanding")}</button>
            {lesson > 0 && <button type="button" className={btnSecondary} onClick={() => setLesson((n) => n - 1)}>
              {isArabic ? "الدرس السابق" : "Previous lesson"}
            </button>}
          </div>
        </section>
      )}

      {stage === "check" && (
        <section className="mt-4" aria-label={isArabic ? "اختبار الفهم" : "Knowledge check"}>
          <p className="text-sm">{isArabic ? "سؤال" : "Question"} {question + 1} / {STAN_CHECKS.length}</p>
          <h4 className="mt-2 text-lg font-semibold">{tx(check.prompt)}</h4>
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">{tx(check.prompt)}</legend>
            {check.options.map((option, index) => (
              <label key={index} className="flex min-h-11 items-center gap-3 rounded border border-border p-3">
                <input type="radio" name="stanislavski-check" checked={answer === index} onChange={() => setAnswer(index)} />
                <span>{tx(option)}</span>
              </label>
            ))}
          </fieldset>
          {answer !== null && <p role="status" className="availability-note mt-3">
            {answer === check.answer
              ? (isArabic ? "إجابة صحيحة. " : "Correct. ")
              : (isArabic ? "أعد التفكير. " : "Reconsider. ")}
            {tx(check.explanation)}
          </p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={answer !== check.answer} onClick={() => {
              if (question < STAN_CHECKS.length - 1) { setQuestion((n) => n + 1); setAnswer(null); }
              else setStage("setup");
            }}>{question < STAN_CHECKS.length - 1
                ? (isArabic ? "السؤال التالي" : "Next question")
                : (isArabic ? "انتقل للتحضير" : "Prepare practice")}</button>
            <button type="button" className={btnSecondary} onClick={() => {
              if (question > 0) { setQuestion((n) => n - 1); setAnswer(null); }
              else { setStage("learn"); setLesson(STAN_LESSONS.length - 1); }
            }}>{isArabic ? "رجوع" : "Back"}</button>
          </div>
        </section>
      )}

      {stage === "setup" && (
        <section className="mt-4" aria-label={isArabic ? "إعداد التدريب" : "Practice setup"}>
          <h4 className="text-lg font-semibold">{isArabic ? "كيف ستجري المحاولة؟" : "How will you practise?"}</h4>
          <p className="mt-2">
            {isArabic
              ? "التدريب الفردي يساعد في التحضير فقط، ولا يثبت القدرة على التفاعل مع شريك حقيقي."
              : "Solo preparation is valuable but cannot establish competence in responding to a real partner."}
          </p>
          <fieldset className="mt-4 space-y-2">
            <legend className="font-semibold">{isArabic ? "طريقة التدريب" : "Practice mode"}</legend>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="stan-mode" checked={mode === "solo"} onChange={() => switchMode("solo")} />{isArabic ? "تحضير فردي" : "Solo preparation"}</label>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="stan-mode" checked={mode === "partner"} onChange={() => switchMode("partner")} />{isArabic ? "مع شريك بشري" : "With a human partner"}</label>
          </fieldset>
          {mode === "partner" && <fieldset className="mt-4 space-y-3">
            <legend className="font-semibold">{isArabic ? "الموافقة والحدود" : "Consent and boundaries"}</legend>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              {isArabic ? "وافق شريكي بحرية على المشاركة." : "My partner freely agreed to take part."}
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={boundaries} onChange={(event) => setBoundaries(event.target.checked)} />
              {isArabic ? "يمكن لأي منا التوقف، ولا نسجّل صوتًا أو صورة دون موافقة." : "Either of us may stop; no audio or video recording without agreement."}
            </label>
            <p className="text-sm text-muted-foreground">
              {isArabic ? "هذا إقرار من المتدرب وليس تحققًا من موافقة الشريك." : "These are learner confirmations, not independently verified consent."}
            </p>
          </fieldset>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={!canStartStanPartner(mode, consent, boundaries)} onClick={() => { setExercise(0); setStage("practice"); }}>
              {isArabic ? "ابدأ المحاولات" : "Begin practice"}
            </button>
            <button type="button" className={btnSecondary} onClick={() => { setStage("check"); setQuestion(STAN_CHECKS.length - 1); setAnswer(null); }}>
              {isArabic ? "رجوع" : "Back"}
            </button>
          </div>
        </section>
      )}

      {stage === "practice" && (
        <section className="mt-4" aria-label={isArabic ? "تمرين عملي" : "Guided exercise"}>
          <p className="text-xs text-muted-foreground">
            {isArabic ? "تمرين" : "Exercise"} {exercise + 1} / {STAN_EXERCISES.length} · {mode === "solo"
              ? (isArabic ? "فردي — إعداد فقط" : "SOLO · PREPARATION ONLY")
              : (isArabic ? "شريك — موثّق بإقرار المتدرّب فقط" : "PARTNER · SELF-REPORTED")}
          </p>
          <h4 className="mt-2 text-lg font-semibold">{tx(task.title)}</h4>
          <p className="mt-2"><strong>{isArabic ? "لماذا:" : "WHY:"}</strong> {tx(task.why)}</p>
          <p className="mt-2"><strong>{isArabic ? "متى:" : "WHEN:"}</strong> {tx(task.when)}</p>
          <p className="mt-2"><strong>{isArabic ? "الظروف:" : "SETUP:"}</strong> {tx(task.setup)}</p>
          <h5 className="mt-4 font-semibold">{mode === "solo"
            ? (isArabic ? "خطوات التدريب الفردي" : "Solo exercise steps")
            : (isArabic ? "خطوات التطبيق مع الشريك" : "Partner / group exercise steps")}</h5>
          <ol className="mt-2 list-decimal space-y-1 ps-5">
            {(mode === "solo" ? task.soloSteps : task.partnerSteps).map((step, i) => <li key={i}>{tx(step)}</li>)}
          </ol>
          <p className="mt-3"><strong>{isArabic ? "تجنّب:" : "AVOID:"}</strong> {tx(task.avoid)}</p>
          <p className="mt-2"><strong>{isArabic ? "خطأ شائع:" : "PITFALL:"}</strong> {tx(task.pitfall)}</p>
          <p className="mt-2"><strong>{isArabic ? "في العمل المهني:" : "REAL-WORLD USE:"}</strong> {tx(task.workplace)}</p>
          <p className="mt-4 rounded border border-border bg-secondary p-3" role="status" aria-live="polite">
            <strong>{isArabic ? "جولات مسجلة:" : "Logged rounds:"} {rounds} / {STAN_EDITORIAL_ROUNDS}</strong>
            {" "} {isArabic
              ? "هدف تجريبي داخل SLAMS، وليس حدًا أدنى رسميًا أو نتيجة تقييم."
              : "This is a provisional SLAMS practice target, not an official requirement or assessment result."}
          </p>
          <form onSubmit={(event) => { event.preventDefault(); logRound(); }}>
            {FIELDS.map((field) => (
              <TextEntry key={field} id={`stan-${exercise}-${field}`} label={tx(FIELD_PROMPTS[field])}
                value={input[field]} onChange={(value) => setInput((prior) => ({ ...prior, [field]: value }))} />
            ))}
            <p className="mt-3 text-sm text-muted-foreground">
              {isArabic
                ? "لجولة جديدة اكتب ملاحظات مختلفة وكاملة. لا تذكر بيانات شخصية عن الشريك. ستختفي هذه الملاحظات عند إغلاق الصفحة."
                : "Log complete, distinct observations for each round. Avoid identifying your partner. Nothing is stored after you leave this session."}
            </p>
            <button type="submit" className={`${btnSecondary} mt-3`} disabled={!canLogStanRound(task.id, mode, input, history)}>
              {isArabic ? "سجّل الجولة" : "Log practice round"}
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={!enough} onClick={() => {
              setInput(blankStanRound());
              if (exercise < STAN_EXERCISES.length - 1) setExercise((n) => n + 1);
              else setStage("reflect");
            }}>{exercise < STAN_EXERCISES.length - 1
                ? (isArabic ? "التمرين التالي" : "Next exercise")
                : (isArabic ? "راجع المحاولات" : "Reflect on your attempts")}</button>
            <button type="button" className={btnSecondary} onClick={() => {
              setInput(blankStanRound());
              if (exercise > 0) setExercise((n) => n - 1);
              else setStage("setup");
            }}>{isArabic ? "رجوع" : "Back"}</button>
          </div>
        </section>
      )}

      {stage === "reflect" && (
        <section className="mt-4" aria-label={isArabic ? "مراجعة ذاتية" : "Reflection"}>
          <h4 className="text-lg font-semibold">{isArabic ? "راجع ما حدث، لا ما تمنّيت حدوثه" : "Reflect on what happened, not what you hoped happened"}</h4>
          <TextEntry id="stan-reflection" label={isArabic ? "أي فعل تغيّر بسبب ظرف أو عائق يمكن ملاحظته؟" : "Which action changed because of an observable circumstance or obstacle?"}
            value={reflection} onChange={setReflection} />
          <TextEntry id="stan-next" label={isArabic ? "ما التعديل المحدد الذي ستجرّبه في المرة القادمة؟" : "What precise adjustment will you try next time?"}
            value={nextAttempt} onChange={setNextAttempt} />
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic ? "الكتابة ليست تقييمًا للأداء؛ لا توجد درجة أو اجتياز تلقائي." : "This written reflection is not a performance assessment or automatic pass."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={!reflection.trim() || !nextAttempt.trim()} onClick={() => setStage("review")}>
              {isArabic ? "اعرض مذكرتك الخاصة" : "Review private practice note"}
            </button>
            <button type="button" className={btnSecondary} onClick={() => { setStage("practice"); setExercise(STAN_EXERCISES.length - 1); }}>
              {isArabic ? "رجوع للتمرين" : "Back to practice"}
            </button>
          </div>
        </section>
      )}

      {stage === "review" && (
        <section className="mt-4" aria-label={isArabic ? "مذكرة خاصة" : "Private practice note"}>
          <h4 className="text-lg font-semibold">{isArabic ? "مذكرتك — ليست شهادة" : "Your note · not a qualification"}</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "هذه ملاحظاتك الشخصية فقط. لا تُحفظ في الحساب أو سجل التدريب ولا تفتح درسًا أكاديميًا."
              : "These are your own observations. Nothing is saved to your account or training record, and no academic lesson is unlocked."}
          </p>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-secondary p-3 text-sm" dir="auto">
            {stanPracticeSummary(mode, history, reflection, nextAttempt)}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => void copy()}>{isArabic ? "انسخ المذكرة" : "Copy my note"}</button>
            <button type="button" className={btnSecondary} onClick={() => setStage("reflect")}>{isArabic ? "عدّل التأمل" : "Revise reflection"}</button>
            <button type="button" className={btnSecondary} onClick={restart}>{isArabic ? "ابدأ ورشة جديدة" : "Start another attempt"}</button>
          </div>
          {copyMessage && <p role="status" className="mt-2">{copyMessage}</p>}
        </section>
      )}

      <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
        {isArabic
          ? "هذه النسخة التحريرية مستقلة وتنتظر مراجعة مختص. مهارات الشريك والأداء الفعلي تحتاج ملاحظة بشرية. لا اعتماد جامعي ولا تقدم أكاديمي ولا تجاوز تلقائي للمتطلبات."
          : "Independent SLAMS educational draft awaiting qualified review. Performance and partner competencies require human observation. No credential, assessed progression or automatic prerequisite bypass."}
      </p>
    </section>
  );
}

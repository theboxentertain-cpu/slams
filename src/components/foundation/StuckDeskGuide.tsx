import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { DRAFT_INTERVENTIONS } from "@/data/stuck";
import { formatStuckSession, STUCK_GUIDES, type StuckGuideId } from "@/data/stuck-guides";

const COPY = {
  en: {
    intro: "Choose what is actually getting in your way. Try one small experiment, then write down what changed. This is your own observation, not an automated diagnosis.",
    heading: "Self-guided rehearsal experiment",
    status: "Draft teaching prompts · awaiting faculty review · no academic credit",
    why: "Why this might help",
    when: "Use it when",
    solo: "Working alone",
    partner: "With a willing partner",
    avoid: "What not to do",
    notice: "What to notice",
    before: "Before: what did you actually do?",
    after: "After the experiment: what did you do differently?",
    beforeHint: "Describe one observable behavior or choice, not a rating of your talent.",
    afterHint: "Describe a specific change, or say that nothing changed.",
    comparison: "Your before / after observations",
    identical: "The two notes are identical. Record an actual observation from the second attempt before comparing.",
    copy: "Copy my practice note",
    copied: "Copied. Nothing was saved to SLAMS.",
    failed: "Clipboard unavailable. Your notes are still visible here to select and copy manually.",
    temporary: "Session only: these notes are not saved, recorded, graded, or added to Passport. Switching problems clears them.",
    scene: "Practice in the scripted demonstration",
    noResult: "No result is inferred from these notes. You decide what to investigate next.",
  },
  ar: {
    intro: "حدد العائق الحقيقي في المشهد. جرب تمرين صغير، واكتب إيه اللي اتغير. دي ملاحظتك الشخصية، مش تشخيص آلي.",
    heading: "تجربة تدريبية موجهة",
    status: "محتوى تعليمي تجريبي · في انتظار مراجعة مدرسين متخصصين · بدون اعتماد أكاديمي",
    why: "ليه ده ممكن يفيد",
    when: "تستخدمه إمتى",
    solo: "تدريب فردي",
    partner: "مع شريك موافق",
    avoid: "إيه اللي تتجنبه",
    notice: "تلاحظ إيه",
    before: "قبل التجربة: عملت إيه فعلاً؟",
    after: "بعد التجربة: عملت إيه بشكل مختلف؟",
    beforeHint: "وصف سلوك أو اختيار ملحوظ، مش تقييم لموهبتك.",
    afterHint: "اكتب تغيير محدد، أو اذكر إن مفيش تغيير حصل.",
    comparison: "ملاحظاتك قبل وبعد",
    identical: "الملاحظتان متطابقتان. اكتب ملاحظة حقيقية من المحاولة الثانية قبل المقارنة.",
    copy: "انسخ ملاحظات التدريب",
    copied: "تم النسخ. لم يتم حفظ أي شيء في SLAMS.",
    failed: "الحافظة غير متاحة. تقدر تحدد الملاحظات الظاهرة وتنسخها يدوياً.",
    temporary: "الملاحظات مؤقتة: مش محفوظة أو مسجلة أو مقيمة، ومش مضافة لجواز الممثل. تغيير المشكلة يمسحها.",
    scene: "اتدرب في المشهد التفاعلي المكتوب",
    noResult: "التطبيق مش بيستنتج نتيجة من ملاحظاتك. أنت اللي بتحدد الخطوة التالية.",
  },
} as const;

/**
 * Honest interactive self-reflection, not a simulated AI coach or academic score.
 * Deliberately no network, persistent storage, recording, or third-party data.
 */
export function StuckDeskGuide() {
  const { locale } = useLanguage();
  const ui = COPY[locale];
  const [open, setOpen] = useState<StuckGuideId | null>(null);
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [copyResult, setCopyResult] = useState<"copied" | "failed" | null>(null);

  function selectProblem(id: StuckGuideId) {
    setOpen((current) => (current === id ? null : id));
    setBefore("");
    setAfter("");
    setCopyResult(null);
  }

  return (
    <section className="foundation-stack" aria-label={ui.heading}>
      <div className="panel p-4">
        <h2>{ui.heading}</h2>
        <p className="mt-2">{ui.intro}</p>
        <p className="mt-3 text-sm text-muted-foreground">{ui.status}</p>
      </div>
      <ul className="foundation-stack">
        {DRAFT_INTERVENTIONS.map((problem) => {
          const id = problem.id as StuckGuideId;
          const guide = STUCK_GUIDES[id];
          const guidance = guide[locale];
          const expanded = open === id;
          const complete = before.trim().length > 0 && after.trim().length > 0;
          const identical = complete && before.trim() === after.trim();
          const ready = expanded && complete && !identical;
          const record = ready
            ? formatStuckSession(
                locale === "ar" ? guide.arQuestion : problem.q,
                problem.school,
                before,
                after,
                locale,
              )
            : "";
          return (
            <li className="panel p-4" key={id}>
              <button
                type="button"
                className={`${btnSecondary} w-full text-start`}
                aria-expanded={expanded}
                aria-controls={`stuck-guide-${id}`}
                onClick={() => selectProblem(id)}
              >
                {locale === "ar" ? guide.arQuestion : problem.q}
              </button>
              {expanded && (
                <div id={`stuck-guide-${id}`} className="foundation-stack mt-4">
                  <p className="font-bold text-amber">{problem.school}</p>
                  <p>{locale === "ar" ? guide.arFix : problem.fix}</p>
                  <dl className="saved-choices">
                    {(
                      [
                        [ui.why, guidance.why],
                        [ui.when, guidance.when],
                        [ui.solo, guidance.solo],
                        [ui.partner, guidance.partner],
                        [ui.avoid, guidance.avoid],
                        [ui.notice, guidance.notice],
                      ] as const
                    ).map(([name, value]) => (
                      <div key={name}>
                        <dt>{name}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="grid gap-2">
                    <label className="font-semibold" htmlFor="stuck-before">
                      {ui.before}
                    </label>
                    <p className="text-sm text-muted-foreground">{ui.beforeHint}</p>
                    <textarea
                      id="stuck-before"
                      className="w-full min-h-28 rounded-md border border-amber/30 bg-background px-3 py-3 text-foreground"
                      value={before}
                      onChange={(event) => {
                        setBefore(event.target.value);
                        setCopyResult(null);
                      }}
                      maxLength={1200}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="font-semibold" htmlFor="stuck-after">
                      {ui.after}
                    </label>
                    <p className="text-sm text-muted-foreground">{ui.afterHint}</p>
                    <textarea
                      id="stuck-after"
                      className="w-full min-h-28 rounded-md border border-amber/30 bg-background px-3 py-3 text-foreground"
                      value={after}
                      onChange={(event) => {
                        setAfter(event.target.value);
                        setCopyResult(null);
                      }}
                      maxLength={1200}
                      rows={4}
                    />
                  </div>
                  {identical && <p role="alert">{ui.identical}</p>}
                  {ready && (
                    <section className="foundation-stack border-t border-amber/30 pt-4" aria-label={ui.comparison}>
                      <h3 className="font-semibold">{ui.comparison}</h3>
                      <p className="whitespace-pre-wrap break-words">{record}</p>
                      <p className="text-sm text-muted-foreground">{ui.noResult}</p>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={async () => {
                          try {
                            if (!navigator.clipboard?.writeText) throw new Error("No clipboard");
                            await navigator.clipboard.writeText(record);
                            setCopyResult("copied");
                          } catch {
                            setCopyResult("failed");
                          }
                        }}
                      >
                        {ui.copy}
                      </button>
                    </section>
                  )}
                  <p role="status" aria-live="polite">
                    {copyResult === "copied"
                      ? ui.copied
                      : copyResult === "failed"
                        ? ui.failed
                        : ui.temporary}
                  </p>
                  <Link to="/scene" className="underline underline-offset-4">
                    {ui.scene}
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

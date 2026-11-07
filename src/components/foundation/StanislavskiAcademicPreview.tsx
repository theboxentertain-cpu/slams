import { useLanguage } from "@/lib/i18n";
import { STAN_SOURCE_LINKS, STAN_TERM_ONE } from "@/data/stanislavski-editorial-workshop-one";
import { STAN_WORKSHOP_ONE_ASSESSMENT } from "@/data/stanislavski-assessment-draft";
import { PlacementAssessmentNotice } from "./PlacementAssessmentNotice";
import { StanislavskiWorkshopOne } from "./StanislavskiWorkshopOne";

/** Authored SLAMS pilot, not imported curriculum or school-affiliated instruction. */
export function StanislavskiAcademicPreview() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  return (
    <section
      className="studio-sheet foundation-stack stanislavski-editorial-preview"
      aria-label={ar ? "المسار التجريبي لستانيسلافسكي" : "Stanislavski editorial term preview"}
    >
      <div className="availability-note">
        <span className="office-kicker">STANISLAVSKI · YEAR 1 · TERM 1 · ORIGINAL SLAMS DRAFT</span>
        <h2>{STAN_TERM_ONE.title[locale]}</h2>
        <p className="mt-2">
          {ar
            ? "نراجع كفاءات منشورة في التعليم العالي، ولا ننسب هذا التسلسل إلى معهد بعينه. الخطة المبدئية أربع سنوات وثمانية فصول داخل SLAMS فقط. لم تُعتمد المواد أو معايير التقييم من هيئة تدريس."
            : "Aligned with published higher-education competencies, not a copied university syllabus. Four years and eight terms are a provisional SLAMS structure, not an institution's verified sequence. Faculty approval and official grading requirements remain unavailable."}
        </p>
      </div>
      <section className="panel p-4" aria-label={ar ? "مخطط الفصل" : "Term learning map"}>
        <h3 className="text-lg font-semibold">
          {ar ? "خريطة الفصل الأول" : "Term 1 — the teaching map"}
        </h3>
        <ol className="mt-3 list-decimal space-y-3 ps-5">
          {STAN_TERM_ONE.workshops.map((workshop, index) => (
            <li key={workshop.id}>
              <strong>
                {index + 1}. {workshop.title[locale]}
              </strong>
              <p className="text-sm text-muted-foreground">
                {workshop.status === "interactive-editorial-preview"
                  ? ar
                    ? "ورشة تفاعلية تجريبية — لا تمنح اعتمادًا."
                    : "Interactive editorial pilot — no academic credit."
                  : ar
                    ? "عنوان تخطيطي فقط؛ لا توجد دروس منشورة بعد."
                    : "Outline only; no teaching material released yet."}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <StanislavskiWorkshopOne />
      <section
        className="panel p-4"
        aria-label={ar ? "المصادر الأكاديمية" : "Academic source provenance"}
      >
        <h3 className="text-lg font-semibold">
          {ar ? "مطابقة المصادر المنشورة" : "Verified public academic references"}
        </h3>
        <p className="mt-2 text-sm">
          {ar
            ? "تدعم هذه المصادر نطاق المهارات والتعلّم التطبيقي، لا ترتيب دروس SLAMS ولا الحد الأدنى للمحاولات أو استحقاق الشهادات."
            : "These sources support competency areas and practice-based education. They do not verify SLAMS lesson ordering, repetition minima, placement permissions or certification."}
        </p>
        <ul className="mt-2 list-disc space-y-2 ps-5">
          {STAN_SOURCE_LINKS.map((source) => (
            <li key={source.url}>
              <a className="underline" href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
              <span className="block text-xs text-muted-foreground">{source.evidence}</span>
            </li>
          ))}
        </ul>
      </section>
      <section
        className="panel p-4"
        aria-label={ar ? "منطق التقييم" : "Academic assessment status"}
      >
        <h3 className="text-lg font-semibold">
          {ar ? "الاجتياز لا يتم بالضغط على زر" : "A practice log is not a pass"}
        </h3>
        <p className="mt-2">
          {ar
            ? "أي تقييم جامعي فعلي يتطلب مشاهدة أداء، وتحليل الظروف والأفعال، وتكيّفًا مع استجابة شريك، ومراجعة مدرس مؤهل وفق معايير معلنة. لا يوجد حد نجاح مُعتمد أو محرّك إصدار شهادات."
            : "A future assessed gate must require observed performance, playable actions under given circumstances, adjustment to an actual partner, documented criteria and a qualified reviewer. No pass threshold or certification engine is active."}
        </p>
        <h4 className="mt-4 font-semibold">
          {ar ? "مسودة معايير مراجعة الأداء" : "Draft faculty-observation criteria"}
        </h4>
        <ul className="mt-3 list-disc space-y-3 ps-5">
          {STAN_WORKSHOP_ONE_ASSESSMENT.criteria.map((criterion) => (
            <li key={criterion.id}>
              <strong>{criterion.focus[locale]}</strong>
              <p className="mt-1 text-sm">{criterion.evidence[locale]}</p>
              <p className="text-xs text-muted-foreground">
                {ar ? "ما لا يكفي كدليل: " : "Insufficient evidence: "}
                {criterion.commonFailure[locale]}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          {ar
            ? "لا توجد الآن درجات أو حد اجتياز أو مدرس مخوّل بترقية السجل الأكاديمي. الانتقال داخل هذه الورشة ليس اجتيازًا."
            : "No grades, pass threshold, appointed reviewer or authorized academic advancement is active. Moving between pilot exercises does not constitute passing a course."}
        </p>
      </section>
      <PlacementAssessmentNotice school="stanislavski" />
    </section>
  );
}

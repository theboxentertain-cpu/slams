import type { Bilingual } from "./stanislavski-editorial-workshop-one";

/**
 * A draft observation rubric, NOT a scoring algorithm. A university-style
 * assessment requires qualified humans and institution-specific standards.
 * This structure may be used for faculty review but must not issue credit.
 */
export const STAN_WORKSHOP_ONE_ASSESSMENT = {
  id: "stanislavski-y1-t1-w01-faculty-review-draft",
  status: "unreviewed" as const,
  requiresQualifiedHumanReviewer: true,
  requiresDemonstratedPerformance: true,
  partnerCompetenciesNeedLivePartner: true,
  learnerSelfReportCannotPass: true,
  serverAuthorizationRequired: true,
  publicationAuthorized: false,
  academicUnlockAllowed: false,
  passThreshold: null,
  repetitionMinimumFromInstitution: null,
  criteria: [
    {
      id: "given-circumstances",
      focus: { en: "Given circumstances and the creative if", ar: "الظروف المعطاة و«ماذا لو» الإبداعية" },
      evidence: {
        en: "The actor distinguishes stated scene facts from interpretations and acts consistently within them.",
        ar: "يميّز الممثل بين حقائق النص وتأويلاته ويتصرف بما يتسق مع تلك الظروف.",
      },
      commonFailure: {
        en: "Inventing facts that contradict the script, or merely naming an emotion.",
        ar: "اختراع حقائق تناقض النص أو مجرد تسمية شعور دون فعل.",
      },
      lessonIds: ["stanislavski-y1-t1-w01-l01"],
    },
    {
      id: "attention-to-task",
      focus: { en: "Practical attention and observable change", ar: "الانتباه العملي والتغيير الملحوظ" },
      evidence: {
        en: "A concrete cue is noticed and produces a meaningful change in physical behavior.",
        ar: "يلاحظ الممثل مؤثرًا محددًا ويترتب عليه تغيير واضح في السلوك الجسدي.",
      },
      commonFailure: {
        en: "Displaying concentration or repeating gestures without serving the task.",
        ar: "استعراض التركيز أو تكرار حركات لا تخدم المهمة.",
      },
      lessonIds: ["stanislavski-y1-t1-w01-l02"],
    },
    {
      id: "playable-objective",
      focus: { en: "A playable objective and a chosen tactic", ar: "هدف قابل للأداء وتكتيك مختار" },
      evidence: {
        en: "The actor names a specific goal toward the other character and pursues it through a doable action.",
        ar: "يسمي الممثل هدفًا محددًا تجاه الشخصية الأخرى ويتبعه بفعل قابل للتنفيذ.",
      },
      commonFailure: {
        en: "Choosing a passive state or trying to force an emotion instead of acting.",
        ar: "اختيار حالة ساكنة أو افتعال انفعال بدل تنفيذ فعل.",
      },
      lessonIds: ["stanislavski-y1-t1-w01-l03"],
    },
    {
      id: "response-to-obstacle",
      focus: { en: "Adjustment to an obstacle", ar: "التكيّف مع العائق" },
      evidence: {
        en: "An observable obstacle prompts a changed tactic rather than only more volume or intensity.",
        ar: "يؤدي عائق ملحوظ إلى تغيير التكتيك، لا مجرد رفع الصوت أو الشدة.",
      },
      commonFailure: {
        en: "Repeating the identical request harder without receiving new information.",
        ar: "تكرار الطلب نفسه بحدة أكبر دون الاستجابة لمعلومات جديدة.",
      },
      lessonIds: ["stanislavski-y1-t1-w01-l03"],
    },
    {
      id: "partner-response",
      focus: { en: "Listening and responsible ensemble practice", ar: "الإنصات وممارسة العمل الجماعي بمسؤولية" },
      evidence: {
        en: "With a voluntary human partner, actual responses influence the next action; the partners respect boundaries.",
        ar: "مع شريك بشري موافق، تؤثر الاستجابات الفعلية في الفعل التالي مع احترام الحدود.",
      },
      commonFailure: {
        en: "Claiming partnered competence from solo notes or requiring coercive reactions.",
        ar: "ادعاء الكفاءة في العمل مع الشريك من مذكرات فردية أو فرض ردود عليه.",
      },
      lessonIds: ["stanislavski-y1-t1-w01-l02", "stanislavski-y1-t1-w01-l03"],
    },
  ] as ReadonlyArray<{
    id: string;
    focus: Bilingual;
    evidence: Bilingual;
    commonFailure: Bilingual;
    lessonIds: ReadonlyArray<string>;
  }>,
} as const;

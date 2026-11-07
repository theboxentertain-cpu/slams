/**
 * Session-only, actor-authored take markers. Media pixels/audio are never
 * analyzed. A category selects a teaching prompt, never a performance verdict.
 */
export type TakeSlot = "a" | "b";
export type MarkerCategory = "listening" | "objective" | "tactic" | "timing" | "movement";

export type ReviewMarker = Readonly<{
  id: string;
  take: TakeSlot;
  seconds: number;
  category: MarkerCategory;
  observation: string;
}>;

export const MARKER_LIMIT_PER_TAKE = 15;
export const MARKER_MAX_CHARACTERS = 400;

export const MARKER_CATEGORIES = [
  {
    id: "listening",
    en: "Listening / response",
    ar: "الاستماع والاستجابة",
    actionEn: "Replay the marked moment. Identify one spoken word, pause or visible cue you actually noticed; in the next retake, allow that cue to affect your next action.",
    actionAr: "شاهد اللحظة المحددة مرة أخرى. حدّد كلمة أو وقفة أو إشارة لاحظتها فعلًا؛ وفي الإعادة التالية اسمح لها بالتأثير على فعلك القادم.",
  },
  {
    id: "objective",
    en: "Objective / intention",
    ar: "الهدف والنية",
    actionEn: "Name the concrete result the character seeks from the other person. Test one playable request, then observe the response rather than trying to manufacture emotion.",
    actionAr: "حدّد النتيجة التي تريدها الشخصية من الطرف الآخر. جرّب طلبًا قابلًا للأداء ثم لاحظ الاستجابة بدل افتعال المشاعر.",
  },
  {
    id: "tactic",
    en: "Tactic / adjustment",
    ar: "التكتيك والتعديل",
    actionEn: "Choose one playable verb and try an alternative on the same line while preserving the scene circumstances. Do not treat volume as a tactic.",
    actionAr: "اختر فعلًا واضحًا ثم جرّب بديلًا في نفس الجملة مع الحفاظ على ظروف المشهد. رفع الصوت ليس تكتيكًا بحد ذاته.",
  },
  {
    id: "timing",
    en: "Timing / pause",
    ar: "التوقيت والوقفة",
    actionEn: "Look for the cue motivating the pause or response. Experiment with one timing change, and check whether it serves the action rather than slowing down mechanically.",
    actionAr: "لاحظ الإشارة التي أدّت إلى الوقفة أو الرد. جرّب تعديلًا واحدًا في التوقيت وتحقّق هل يخدم الفعل بدل الإبطاء الآلي.",
  },
  {
    id: "movement",
    en: "Movement / physical task",
    ar: "الحركة والمهمة الجسدية",
    actionEn: "Notice the practical task at this point. Try one comfortable, safe movement quality that helps the action; do not push through pain or force physical intensity.",
    actionAr: "لاحظ المهمة العملية في هذه اللحظة. جرّب نوعية حركة مريحة وآمنة تخدم الفعل؛ لا تتجاوز الألم ولا تفرض مجهودًا بدنيًا.",
  },
] as const satisfies ReadonlyArray<{
  id: MarkerCategory;
  en: string;
  ar: string;
  actionEn: string;
  actionAr: string;
}>;

export function isMarkerCategory(category: unknown): category is MarkerCategory {
  return MARKER_CATEGORIES.some((item) => item.id === category);
}

/** Safe, short mm:ss formatting for the current media playback position. */
export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/** A marker is self-report; its timestamp comes from a real local media element. */
export function validateMarker(
  take: TakeSlot,
  seconds: number,
  category: unknown,
  observation: string,
  currentCount: number,
): string | null {
  if (!["a", "b"].includes(take)) return "Invalid take.";
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 90)
    return "Open and seek within a recorded take before marking a time.";
  if (!isMarkerCategory(category)) return "Choose a supported observation category.";
  if (observation.trim().length < 8 || observation.length > MARKER_MAX_CHARACTERS)
    return "Write an observed action in 8–400 characters.";
  if (currentCount >= MARKER_LIMIT_PER_TAKE)
    return "Limit reached: 15 markers per take. Remove a marker before adding more.";
  return null;
}

export function markerPrompt(
  marker: ReviewMarker,
  locale: "en" | "ar",
): { heading: string; category: string; observation: string; exercise: string; caveat: string } {
  const source = MARKER_CATEGORIES.find((item) => item.id === marker.category);
  if (!source) throw new Error("Unknown teaching lens.");
  return {
    heading: locale === "ar" ? "مهمة إعادة مقترحة — ليست نتيجة تحليل آلي" : "Suggested retake experiment — not an AI verdict",
    category: locale === "ar" ? source.ar : source.en,
    observation: marker.observation,
    exercise: locale === "ar" ? source.actionAr : source.actionEn,
    caveat:
      locale === "ar"
        ? "اخترت أنت نوع الملاحظة وكتبت وصفها. التطبيق لم يشاهد الأداء أو يقيّمه. جرّب التعديل فقط إذا كان مناسبًا للمشهد."
        : "You selected the category and wrote the observation. The app did not watch or grade the take. Try the adjustment only if it fits the scene.",
  };
}

export function formatLocalReview(
  locale: "en" | "ar",
  objective: string,
  notes: Readonly<{ a: string; b: string }>,
  difference: string,
  markers: readonly ReviewMarker[],
): string {
  const text =
    locale === "ar"
      ? [
          "SLAMS — معمل الأداء | ملاحظات الممثل الشخصية فقط",
          "لم يجرِ تحليل الفيديو أو الصوت أو تقييم الأداء. النسخ يحتوي على نص فقط.",
          `هدف المشهد: ${objective.trim() || "غير محدد"}`,
          `المحاولة أ: ${notes.a.trim() || "لا توجد ملاحظة"}`,
          `المحاولة ب: ${notes.b.trim() || "لا توجد ملاحظة"}`,
          `الفرق الملحوظ: ${difference.trim() || "غير محدد"}`,
          "الملاحظات المحددة بالتوقيت:",
        ]
      : [
          "SLAMS Performance Lab — actor-authored evidence only (not graded)",
          "No media was analyzed or evaluated. This copy contains text only.",
          `Scene objective: ${objective.trim() || "Not entered"}`,
          `Take A: ${notes.a.trim() || "No note"}`,
          `Take B: ${notes.b.trim() || "No note"}`,
          `Difference noticed: ${difference.trim() || "Not entered"}`,
          "Time-coded observations:",
        ];
  const ordered = [...markers].sort((a, b) =>
    a.take.localeCompare(b.take) || a.seconds - b.seconds || a.id.localeCompare(b.id),
  );
  if (ordered.length === 0) text.push(locale === "ar" ? "لا توجد ملاحظات زمنية" : "No time-coded observations");
  for (const marker of ordered) {
    const category = MARKER_CATEGORIES.find((item) => item.id === marker.category);
    text.push(
      `${marker.take.toUpperCase()} [${formatTimecode(marker.seconds)}] ${locale === "ar" ? category?.ar : category?.en}: ${marker.observation.trim()}`,
    );
  }
  text.push(
    locale === "ar"
      ? "هذه الملاحظات لا تتيح استنتاج تقدّم أو نجاح أو اعتماد دراسي."
      : "These observations do not prove improvement, achievement or academic credit.",
  );
  return text.join("\n");
}

/**
 * SLAMS-authored problem-to-practice editorial prompts.
 * These are technique-informed teaching lenses, not a diagnosis,
 * observation of an actor, or official school exercises.
 */

export type LocalizedText = Readonly<{ en: string; ar: string }>;
export type RescueOutcome = "change" | "no-change" | "unsure";
export type RescueInput = Readonly<{
  problemId: string;
  firstAttempt: string;
  secondAttempt: string;
  difference: string;
  outcome: RescueOutcome;
}>;

export const RESCUE_PROBLEMS = [
  {
    id: "planning",
    title: { en: "I'm in my head / planning lines", ar: "أفكر في الجمل القادمة بدل ما أسمع" },
    lens: { en: "Meisner-informed listening", ar: "الإنصات بمنظور مايزنر" },
    why: {
      en: "Preparing the next reply can draw attention away from what actually changed in the scene.",
      ar: "تحضير الرد القادم مسبقًا قد يسحب انتباهك بعيدًا عن أي تغيير حقيقي في المشهد.",
    },
    intervention: {
      en: "Give yourself one outward task: name a neutral, observable action from the other character, pause, and let the actual response affect your next playable action.",
      ar: "ركّز على مهمة خارجية واحدة: لاحظ فعلًا واضحًا ومحايدًا لدى الطرف الآخر، اترك له فرصة الرد، واجعل الاستجابة الفعلية تؤثر في فعلك التالي.",
    },
    solo: {
      en: "Solo: read a short neutral scene twice. First note one scripted cue you skipped; then reread, responding to the exact cue. Solo work cannot establish human-partner listening.",
      ar: "فردي: اقرأ مشهدًا قصيرًا ومحايدًا مرتين. حدّد أولًا علامة في النص تجاهلتها، ثم أعد القراءة وتفاعل معها. هذا لا يثبت قدرتك على الاستماع لشريك حقيقي.",
    },
    partner: {
      en: "Partner: agree on a brief, low-pressure exchange. Ask one ordinary question, receive the real answer, and change only your next action. Either person can stop.",
      ar: "مع شريك: اتفقا على تبادل قصير دون ضغط. اسأل سؤالًا عاديًا، استقبل الإجابة الفعلية، ثم غيّر فعلك التالي فقط. يمكن لأي طرف التوقف.",
    },
    avoid: {
      en: "Do not force a partner to reveal private feelings, guess their motives, or imitate an emotional reaction.",
      ar: "لا تضغط على شريكك ليكشف مشاعر خاصة، ولا تخمّن دوافعه، ولا تقلّد استجابة انفعالية.",
    },
    cue: {
      en: "What actual word, pause, sound or movement changed your next response?",
      ar: "ما الكلمة أو الوقفة أو الصوت أو الحركة التي غيّرت ردك التالي فعلًا؟",
    },
  },
  {
    id: "flat",
    title: { en: "My scene feels flat / general", ar: "المشهد مسطّح أو عام" },
    lens: { en: "Stanislavski-informed playable action", ar: "الفعل القابل للتنفيذ بمنظور ستانيسلافسكي" },
    why: {
      en: "An abstract emotion does not tell the actor what to attempt. A specific objective and action can organize behavior.",
      ar: "الشعور المجرّد لا يخبر الممثل بما سيحاول فعله. الهدف والفعل المحددان ينظمان السلوك.",
    },
    intervention: {
      en: "Write 'I want the other character to…' and finish it with a concrete result. Choose one respectful action verb such as ask, clarify, reassure or challenge. Perform the request, not the emotion.",
      ar: "اكتب «أريد من الشخصية الأخرى أن…» وأكملها بنتيجة محددة. اختر فعلًا مثل أطلب أو أوضح أو أطمئن أو أناقش. نفّذ الطلب بدل تمثيل الشعور.",
    },
    solo: {
      en: "Solo: perform a harmless, imagined request twice using two different verbs. Record exactly what changed in phrasing and physical action.",
      ar: "فردي: أدّ طلبًا متخيّلًا وعاديًا مرتين بفعلين مختلفين. سجّل ما تغيّر تحديدًا في الكلمات والحركة.",
    },
    partner: {
      en: "Partner: pursue a simple request with consent, let the partner refuse, and respond with a second tactic without raising pressure.",
      ar: "مع شريك: حاول تحقيق طلب بسيط بموافقة الطرفين، وتقبّل الرفض، ثم استخدم تكتيكًا ثانيًا بلا ضغط.",
    },
    avoid: {
      en: "Do not substitute volume for a new tactic, or coerce a partner to deliver the result you expected.",
      ar: "لا تستبدل تغيير التكتيك برفع الصوت ولا تضغط على الشريك ليعطيك النتيجة المتوقعة.",
    },
    cue: {
      en: "Which playable verb did you attempt, and what specific behavior changed?",
      ar: "أي فعل قابل للتنفيذ حاولته، وما السلوك المحدد الذي تغيّر؟",
    },
  },
  {
    id: "stakes",
    title: { en: "Nothing feels at stake", ar: "مش حاسس إن في حاجة مهمة على المحك" },
    lens: { en: "Adler-informed given circumstances and imagination", ar: "الظروف والخيال بمنظور ستيلا أدلر" },
    why: {
      en: "A precise fictional consequence can make an action more understandable than trying to generate an intense emotion.",
      ar: "النتيجة الخيالية المحددة قد تجعل الفعل أكثر قابلية للفهم من محاولة فرض انفعال شديد.",
    },
    intervention: {
      en: "Write one fictional fact about time, place or consequence that does not contradict the scene. Ask what practical action the character attempts because of it.",
      ar: "اكتب حقيقة خيالية واحدة عن الزمن أو المكان أو النتيجة دون أن تناقض النص. اسأل ما الفعل العملي الذي ستقوم به الشخصية بسببها.",
    },
    solo: {
      en: "Solo: take a neutral request. Repeat it once with no deadline and once with a gentle fictional deadline; notice the difference in your action.",
      ar: "فردي: أدّ طلبًا بسيطًا مرة بلا موعد نهائي ومرة مع موعد متخيّل معتدل؛ لاحظ فرق الفعل.",
    },
    partner: {
      en: "Partner: share the harmless fictional circumstance, agree to play within it, and observe whether it changes the request and response.",
      ar: "مع شريك: اتفقا على ظرف خيالي غير مؤذٍ، ثم لاحظا هل غيّر ذلك الطلب والاستجابة.",
    },
    avoid: {
      en: "Do not use personal trauma, real-world threats, private memories or distress to force urgency.",
      ar: "لا تستخدم صدمات شخصية أو تهديدات واقعية أو ذكريات خاصة أو ضيقًا نفسيًا لفرض الإلحاح.",
    },
    cue: {
      en: "What fictional fact changed your next concrete action without forcing an emotion?",
      ar: "أي حقيقة خيالية غيّرت فعلك التالي دون فرض شعور؟",
    },
  },
  {
    id: "stiff",
    title: { en: "My body feels stiff", ar: "جسمي متصلّب أثناء المشهد" },
    lens: { en: "Laban-informed movement quality", ar: "نوعية الحركة بمنظور لابان" },
    why: {
      en: "Movement quality can expand playable choices, but forcing a posture may make behavior less responsive.",
      ar: "نوعية الحركة قد توسّع اختياراتك، أما فرض وضعية معينة فقد يقلل استجابتك.",
    },
    intervention: {
      en: "In a comfortable, clear space, try one simple hand or arm movement slowly and lightly, then with a different safe pace. Choose the version that helps the character's practical task.",
      ar: "في مساحة آمنة ومريحة، جرّب حركة بسيطة باليد أو الذراع ببطء وخفة، ثم بإيقاع مختلف آمن. اختر ما يخدم مهمة الشخصية.",
    },
    solo: {
      en: "Solo: while seated or standing comfortably, reach for an ordinary object twice with contrasting easy tempos. Notice which serves the task.",
      ar: "فردي: أثناء الجلوس أو الوقوف براحة، مدّ يدك نحو غرض عادي مرتين بإيقاعين مريحين مختلفين. لاحظ أيهما يخدم المهمة.",
    },
    partner: {
      en: "Partner: with consent, give an ordinary object using two safe movement qualities; notice the partner's real response without imitation or pressure.",
      ar: "مع شريك وبموافقته، قدّم غرضًا عاديًا بنوعيتين آمنتين من الحركة؛ لاحظ الاستجابة الحقيقية دون تقليد أو ضغط.",
    },
    avoid: {
      en: "Do not push through pain, rush, strain, use risky movement or treat mobility limitations as acting failures.",
      ar: "لا تتجاوز حدود الألم أو تتسرع أو تجهد جسمك أو تقوم بحركات خطرة أو تعتبر محدودية الحركة عيبًا في التمثيل.",
    },
    cue: {
      en: "Which comfortable movement adjustment made the physical task more specific?",
      ar: "أي تعديل مريح في الحركة جعل المهمة الجسدية أكثر تحديدًا؟",
    },
  },
] as const;

export type RescueProblemId = (typeof RESCUE_PROBLEMS)[number]["id"];

export function rescueProblemById(id: string) {
  return RESCUE_PROBLEMS.find((problem) => problem.id === id) ?? null;
}

function meaningful(value: string) {
  return value.trim().length >= 8 && value.length <= 1200;
}

/** Written completeness only. Never an assessment of actor competence. */
export function canCompareRescue(input: RescueInput): boolean {
  return (
    rescueProblemById(input.problemId) !== null &&
    meaningful(input.firstAttempt) &&
    meaningful(input.secondAttempt) &&
    meaningful(input.difference) &&
    ["change", "no-change", "unsure"].includes(input.outcome)
  );
}

export function rescueOutcomeLabel(outcome: RescueOutcome): LocalizedText {
  switch (outcome) {
    case "change":
      return { en: "I noticed a specific difference", ar: "لاحظت فرقًا محددًا" };
    case "no-change":
      return { en: "I could not identify a difference", ar: "لم ألاحظ فرقًا واضحًا" };
    case "unsure":
      return { en: "I am not sure yet", ar: "لست متأكدًا بعد" };
  }
}

export function rescueNote(input: RescueInput, locale: "en" | "ar") {
  const problem = rescueProblemById(input.problemId);
  if (!problem || !canCompareRescue(input)) return "";
  const rows = locale === "ar"
    ? [
        "SLAMS · مكتب التعثر · ملاحظات تدريب خاصة",
        "اختار الممثل المشكلة بنفسه. لا يوجد تحليل أداء آلي أو تقييم أو اعتماد.",
        "المشكلة: " + problem.title.ar,
        "منظور التمرين: " + problem.lens.ar,
        "المحاولة الأولى: " + input.firstAttempt.trim(),
        "التعديل المقترح: " + problem.intervention.ar,
        "المحاولة الثانية: " + input.secondAttempt.trim(),
        "ما لاحظته: " + input.difference.trim(),
        "رأيي في الفرق: " + rescueOutcomeLabel(input.outcome).ar,
      ]
    : [
        "SLAMS · Stuck Desk · private rehearsal note",
        "Problem selected by actor. No automatic performance analysis, diagnosis, grade or credit.",
        "Problem: " + problem.title.en,
        "Technique lens: " + problem.lens.en,
        "First attempt: " + input.firstAttempt.trim(),
        "Suggested intervention: " + problem.intervention.en,
        "Second attempt: " + input.secondAttempt.trim(),
        "Observed difference: " + input.difference.trim(),
        "Learner judgment: " + rescueOutcomeLabel(input.outcome).en,
      ];
  return rows.join("\n");
}

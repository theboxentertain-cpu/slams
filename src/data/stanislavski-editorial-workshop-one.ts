/**
 * Original SLAMS Stanislavski school editorial draft — Year 1 / Term 1 / Workshop 01.
 * Alignment evidence:
 * 1. GITIS course overview (four-year actor training; attention, action, aims,
 *    communication, imagination, tempo/rhythm): https://www.gitis.net/en/courses/course-1/
 * 2. UNCG THR 231 Acting I, Fall 2026 (warm-up, action, reflective feedback,
 *    introductory monologue and scene practice):
 *    https://syllabus.uncg.edu/THR-231-Acting-I-03-Fall-2026
 * 3. RGISI Acting for Drama (Stanislavski with studio/ensemble disciplines):
 *    https://www.rgisi.ru/en/acting-for-drama2
 *
 * Public program descriptions do NOT publish an identical eight-term syllabus,
 * verified lesson ordering, minimum repetitions, or faculty rubrics.
 * This is SLAMS-authored study material; no institutional affiliation,
 * accreditation, teacher approval, automated mastery, or academic unlock.
 */

export type Bilingual = Readonly<{ en: string; ar: string }>;
export type StanMode = "solo" | "partner";
export type StanStage = "learn" | "check" | "setup" | "practice" | "reflect" | "review";
export type StanField = "circumstances" | "objective" | "action" | "obstacle" | "observation" | "adjustment";

export const STAN_EDITORIAL_ROUNDS = 3; // SLAMS trial design, NOT an official school requirement.
export const STAN_SOURCE_LINKS = [
  { label: "GITIS four-year Acting program", url: "https://www.gitis.net/en/courses/course-1/", evidence: "Published program competencies; not exact lesson chronology" },
  { label: "UNCG Acting I syllabus, Fall 2026", url: "https://syllabus.uncg.edu/THR-231-Acting-I-03-Fall-2026", evidence: "Introductory applied outcomes and assessment strands" },
  { label: "RGISI Acting for Drama", url: "https://www.rgisi.ru/en/acting-for-drama2", evidence: "Stanislavski-based ensemble and instrument training context" },
] as const;

export const STAN_TERM_ONE = {
  id: "stanislavski-y1-t1",
  school: "stanislavski",
  year: 1,
  term: 1,
  title: { en: "Foundations of playable action", ar: "أساسيات الفعل القابل للأداء" },
  declaredSchoolYears: 4,
  declaredSchoolTerms: 8,
  programMapIsProvisional: true,
  institutionallyApproved: false,
  publicationAuthorized: false,
  academicCreditAllowed: false,
  advancedPlacementEnabled: false,
  facultyAssessmentRequired: true,
  institutionalRepRequirement: null,
  passThreshold: null,
  workshops: [
    { id: "stanislavski-y1-t1-w01", status: "interactive-editorial-preview", title: { en: "Acting with a purpose", ar: "التمثيل بهدف واضح" } },
    { id: "stanislavski-y1-t1-w02", status: "outline-only", title: { en: "Attention, imagination and communication", ar: "الانتباه والخيال والتواصل" } },
    { id: "stanislavski-y1-t1-w03", status: "outline-only", title: { en: "Physical action, obstacles and scene application", ar: "الفعل الجسدي والعوائق وتطبيق المشهد" } },
  ],
} as const;

export const STAN_LESSONS = [
  {
    id: "stanislavski-y1-t1-w01-l01",
    title: { en: "Given circumstances and the creative if", ar: "الظروف المعطاة و«ماذا لو» الإبداعية" },
    outcome: { en: "Separate facts of a scene from inventions, and take a purposeful action inside the imagined situation.", ar: "ميّز بين حقائق المشهد وافتراضاتك، ثم افعل شيئًا ذا هدف داخل الظروف المتخيّلة." },
    why: { en: "The actor needs conditions that make behavior specific. A fact changes what is possible; a vague mood does not tell you what to do.", ar: "الممثل يحتاج ظروفًا تجعل السلوك محددًا. الحقيقة تغيّر الخيارات المتاحة، أما المزاج العام فلا يحدّد فعلًا." },
    how: { en: "Write who, where, when and the immediate event. Separate stated facts from plausible choices. Ask: if this were true, what would I try to achieve right now? Test the answer with a simple safe task.", ar: "اكتب مَن وأين ومتى والحدث المباشر. افصل الحقائق المذكورة عن اختياراتك المحتملة. اسأل: لو كان هذا صحيحًا، ماذا سأحاول تحقيقه الآن؟ اختبر الإجابة بفعل بسيط وآمن." },
    when: { en: "Use it before rehearsing a new scene and whenever behavior seems general rather than caused by the script.", ar: "استخدمه قبل بروفات أي مشهد جديد وعندما يبدو السلوك عامًا وغير نابع من النص." },
    notToDo: { en: "Do not invent facts that contradict the text, force personal emotional memories, or confuse the actor's private life with the character's history.", ar: "لا تخترع حقائق تناقض النص، ولا تجبر نفسك على استدعاء ذكريات مؤلمة، ولا تخلط بين حياتك الخاصة وماضي الشخصية." },
    pitfalls: [
      { en: "Playing an adjective such as 'sad' instead of attempting an action.", ar: "تمثيل صفة مثل «حزين» بدل محاولة فعل محدد." },
      { en: "Treating guesses as established script facts.", ar: "اعتبار التخمينات حقائق ثابتة في النص." },
    ],
    example: { en: "A character arrives to collect a borrowed book before a shop closes. The deadline changes the request; an imposed 'nervous look' is not an action.", ar: "شخصية جاءت لتسترد كتابًا قبل إغلاق المتجر. ضيق الوقت يغيّر الطلب؛ أما «نظرة القلق» المفروضة فليست فعلًا." },
    solo: { en: "Write three factual circumstances and two open possibilities. Attempt the book-request task twice, changing only the closing deadline.", ar: "اكتب ثلاث ظروف مؤكدة واحتمالين مفتوحين. جرّب طلب الكتاب مرتين مع تغيير موعد الإغلاق فقط." },
    partner: { en: "With a consenting partner, rehearse the same ordinary request twice. Let the partner choose a believable response; compare how you adapt.", ar: "مع شريك موافق، جرّبا الطلب اليومي نفسه مرتين. دعه يختار ردًا طبيعيًا ثم قارن كيف تتكيّف." },
    realWorld: { en: "Auditions: mark which facts come from the sides and which are your reversible choices.", ar: "في الاختبار: حدّد ما جاء صراحة في صفحات المشهد وما هو اختيار منك قابل للتعديل." },
    evidence: { en: "A clear fact/assumption distinction and a changed playable action.", ar: "تمييز واضح بين الحقيقة والافتراض وفعل قابل للتنفيذ تغيّر مع الظروف." },
  },
  {
    id: "stanislavski-y1-t1-w01-l02",
    title: { en: "Attention on the task, not on the image of acting", ar: "التركيز على المهمة لا على شكل التمثيل" },
    outcome: { en: "Sustain an ordinary task, notice a new detail, and respond without displaying concentration for an audience.", ar: "واصل مهمة عادية، وانتبه لتفصيل جديد، واستجب دون استعراض «التركيز» أمام المشاهد." },
    why: { en: "Specific external attention gives behavior something to respond to. Trying to look intense can displace actual observation.", ar: "الانتباه لتفصيل خارجي يمنح السلوك شيئًا يستجيب له. محاولة الظهور بمظهر الجدية قد تحجب الملاحظة الحقيقية." },
    how: { en: "Choose a neutral, safe task such as organizing three papers. Name the immediate aim. Work on it, observe one real change, and let that change alter the next action.", ar: "اختر مهمة عادية وآمنة كترتيب ثلاث ورقات. حدّد الهدف المباشر. نفّذه، ولاحظ تغييرًا حقيقيًا، واجعل هذا التغيير يؤثر في الفعل التالي." },
    when: { en: "Use when a scene feels posed, the body freezes, or the actor starts monitoring how convincing they appear.", ar: "استخدمه عندما يبدو المشهد متصنعًا، أو يتجمد الجسد، أو تنشغل بمراقبة مدى إقناع أدائك." },
    notToDo: { en: "Do not stare at an object to imitate concentration, ignore safety, or turn a neutral exercise into judging a partner's body or emotions.", ar: "لا تحدّق في شيء لتقلّد التركيز، ولا تتجاهل السلامة، ولا تحوّل التمرين إلى حكم على جسد شريكك أو مشاعره." },
    pitfalls: [
      { en: "Predetermining the reaction before anything changes.", ar: "تجهيز الاستجابة مسبقًا قبل حدوث أي تغيير." },
      { en: "Repeating a mechanical gesture after its practical purpose has ended.", ar: "تكرار حركة آلية بعد انتهاء سببها العملي." },
    ],
    example: { en: "While sorting pages, one page is missing. Search for it to finish the task; do not 'play frustration.'", ar: "أثناء ترتيب الصفحات تكتشف أن واحدة ناقصة. ابحث عنها لإنهاء المهمة، ولا «تمثّل الإحباط»." },
    solo: { en: "Complete a two-minute paper-sorting task. On a second take alter one harmless detail and write which action changed.", ar: "رتّب الأوراق لدقيقتين، ثم غيّر تفصيلًا بسيطًا في المحاولة الثانية واكتب الفعل الذي تغيّر." },
    partner: { en: "A partner quietly changes which paper they hand you. Receive the actual change, keep pursuing the task, and discuss what was observable.", ar: "يغيّر الشريك بهدوء الورقة التي يقدّمها. استقبل التغيير الحقيقي واستمر في المهمة، ثم ناقشا ما أمكن ملاحظته." },
    realWorld: { en: "On camera: connect each beat to a real sight, sound, object or partner response rather than a planned face.", ar: "أمام الكاميرا: اربط كل لحظة برؤية أو صوت أو شيء أو رد حقيقي، لا بتعبير وجه مُعدّ مسبقًا." },
    evidence: { en: "A named cue and a concrete action that changed as a result.", ar: "مؤثر محدد وفعل ملموس تغيّر استجابة له." },
  },
  {
    id: "stanislavski-y1-t1-w01-l03",
    title: { en: "Objective, obstacle and playable tactic", ar: "الهدف والعائق والتكتيك القابل للأداء" },
    outcome: { en: "State a specific objective directed toward another person and change tactics in response to a credible obstacle.", ar: "عبّر عن هدف واضح تجاه شخص آخر، ثم بدّل التكتيك استجابة لعائق منطقي." },
    why: { en: "An objective supplies direction. A playable verb lets the actor attempt something; an obstacle forces adjustment instead of repetition.", ar: "الهدف يمنح الفعل اتجاهًا. الفعل القابل للأداء يتيح محاولة حقيقية، والعائق يفرض التكيّف بدل التكرار." },
    how: { en: "Frame the objective as 'I want the other person to…'. Choose a verb such as ask, reassure, persuade or challenge. Name what stands in the way. Try a different tactic when the first fails.", ar: "صغ الهدف: «أريد من الطرف الآخر أن…». اختر فعلًا مثل أطلب أو أطمئن أو أقنع أو أتحدى. حدّد العائق، وجرّب تكتيكًا آخر إذا لم ينجح الأول." },
    when: { en: "Use when lines sound like recitation, when every beat is delivered the same way, or after a director gives an actionable note.", ar: "استخدمه عندما يبدو الحوار تسميعًا، أو تتكرر الطريقة نفسها في كل لحظة، أو تتلقى ملاحظة تنفيذية من المخرج." },
    notToDo: { en: "Do not equate an objective with controlling a real person; partners may refuse, pause or stop. Never treat harm or coercion as a rehearsal task.", ar: "لا تخلط بين هدف الشخصية والتحكم في إنسان حقيقي. للشريك حق الرفض أو التوقف. لا تجعل الأذى أو الإكراه مهمة تدريبية." },
    pitfalls: [
      { en: "Choosing an emotion ('be anxious') instead of a doable verb ('convince').", ar: "اختيار شعور («أقلق») بدل فعل قابل للتنفيذ («أقنع»)." },
      { en: "Raising volume instead of changing the tactic.", ar: "رفع الصوت بدل تغيير التكتيك." },
    ],
    example: { en: "You need a colleague to lend you a harmless prop. Begin by asking; when they hesitate, explain why it matters instead of simply asking louder.", ar: "تريد من زميل إعارتك غرضًا بسيطًا. ابدأ بالطلب، وإذا تردد فاشرح أهميته بدل تكرار الطلب بصوت أعلى." },
    solo: { en: "Rehearse both sides of a neutral scripted exchange, changing the playable verb after the imagined obstacle. This is preparation, not evidence of partner skill.", ar: "درّب طرفَي حوار يومي قصير، وغيّر الفعل بعد العائق المتخيّل. هذا إعداد منفرد، وليس دليلًا على مهارة التفاعل مع شريك." },
    partner: { en: "With a consenting actor, pursue a harmless request. Let them choose a non-threatening obstacle. Respond with a new tactic; switch roles.", ar: "مع ممثل موافق، اطلب شيئًا عاديًا. دعه يختار عائقًا غير مؤذٍ. استجب بتكتيك مختلف ثم بدّلا الأدوار." },
    realWorld: { en: "Scene breakdown: score each beat with objective, tactic, obstacle and observed partner response.", ar: "تحليل المشهد: سجّل هدف كل لحظة وتكتيكها وعائقها واستجابة الشريك الملحوظة." },
    evidence: { en: "An action verb, justified obstacle and specific adjustment prompted by the interaction.", ar: "فعل تنفيذي وعائق مبرر وتغيير محدد نابع من التفاعل." },
  },
] as const;

export const STAN_CHECKS = [
  {
    prompt: { en: "Which note is a given circumstance rather than an acting choice?", ar: "أي مما يلي ظرف معطى وليس اختيارًا تمثيليًا؟" },
    options: [
      { en: "The shop closes in five minutes.", ar: "المتجر سيغلق خلال خمس دقائق." },
      { en: "I should look worried.", ar: "ينبغي أن أبدو قلقًا." },
      { en: "I must feel angry.", ar: "يجب أن أشعر بالغضب." },
    ],
    answer: 0,
    explanation: { en: "A deadline is a condition that alters what the character can do. Expressions and emotions are not script facts.", ar: "الموعد النهائي ظرف يؤثر في خيارات الشخصية. تعبير الوجه والشعور ليسا حقيقة في النص." },
  },
  {
    prompt: { en: "Which response demonstrates attention to a real task?", ar: "أي تصرف يثبت الانتباه لمهمة حقيقية؟" },
    options: [
      { en: "Stare intensely at the papers.", ar: "التحديق في الأوراق بحدة." },
      { en: "Notice a missing page and search for it.", ar: "ملاحظة ورقة ناقصة والبحث عنها." },
      { en: "Plan a convincing frustrated expression.", ar: "التحضير لتعبير مقنع عن الإحباط." },
    ],
    answer: 1,
    explanation: { en: "An observable change prompted a practical adjustment. It is not merely an outward display of focus.", ar: "تغيير قابل للملاحظة دفع إلى تعديل عملي، لا مجرد استعراض للتركيز." },
  },
  {
    prompt: { en: "A partner declines your harmless request. What is playable?", ar: "رفض شريكك طلبًا عاديًا. ما الفعل الممكن أداؤه؟" },
    options: [
      { en: "Become more emotional on command.", ar: "أنفعل أكثر عند الطلب." },
      { en: "Ignore the refusal and repeat louder.", ar: "أتجاهل الرفض وأكرر بصوت أعلى." },
      { en: "Switch from asking to explaining the need.", ar: "أنتقل من الطلب إلى شرح الحاجة." },
    ],
    answer: 2,
    explanation: { en: "Changing the tactic responds to the obstacle without forcing the partner or manufacturing emotion.", ar: "تغيير التكتيك يستجيب للعائق دون الضغط على الشريك أو اختلاق الشعور." },
  },
] as const;

export const STAN_EXERCISES = [
  {
    id: "stanislavski-y1-t1-w01-e01",
    title: { en: "The changed deadline", ar: "الموعد الذي تغيّر" },
    why: { en: "Tests whether the given circumstances cause a visible change in the task.", ar: "يختبر هل يؤدي تغيير الظروف إلى تغيير فعلي في المهمة." },
    when: { en: "Before text work or when a scene's urgency feels unearned.", ar: "قبل العمل على النص أو عندما يبدو الإحساس بالوقت مفتعلًا." },
    setup: { en: "You need to return a borrowed book to its owner before the study room closes. No performance pressure or personal memory is required.", ar: "تحتاج إلى إعادة كتاب مستعار لصاحبه قبل إغلاق غرفة الدراسة. لا حاجة لضغط على الأداء أو ذكريات شخصية." },
    soloSteps: [
      { en: "Write three facts, then a single active objective.", ar: "اكتب ثلاث حقائق ثم هدفًا عمليًا واحدًا." },
      { en: "Attempt the ordinary task at an unhurried pace.", ar: "نفّذ المهمة العادية دون استعجال." },
      { en: "Change the closing time and observe what practical action changes.", ar: "غيّر وقت الإغلاق ولاحظ أي فعل عملي يتغيّر." },
    ],
    partnerSteps: [
      { en: "Agree that either person can stop or skip an exchange.", ar: "اتفقا على حق أي شخص في التوقف أو تجاوز تبادل ما." },
      { en: "Let your partner set one of two reasonable closing deadlines.", ar: "دَع الشريك يختار أحد موعدين منطقيين للإغلاق." },
      { en: "Pursue the same request, then note what the chosen deadline changed.", ar: "حاول تحقيق الطلب نفسه ثم دوّن أثر الموعد المختار." },
    ],
    avoid: { en: "Do not manufacture panic, run, or change the script's established facts.", ar: "لا تصطنع الذعر، ولا تجرِ، ولا تغيّر الحقائق الثابتة في النص." },
    pitfall: { en: "Claiming 'more urgency' without identifying a changed action.", ar: "القول «الاستعجال زاد» دون تحديد فعل تغيّر." },
    workplace: { en: "Use the same fact-versus-choice check when preparing audition sides.", ar: "استخدم التمييز نفسه بين الحقيقة والاختيار في صفحات الاختبار." },
  },
  {
    id: "stanislavski-y1-t1-w01-e02",
    title: { en: "Attention and the missing page", ar: "الانتباه والورقة الناقصة" },
    why: { en: "Connects physical behavior to an observed, ordinary change.", ar: "يربط السلوك الجسدي بتغيير عادي أمكن ملاحظته." },
    when: { en: "When concentration feels performed rather than useful.", ar: "عندما يصبح التركيز تمثيلًا شكليًا بدل أن يكون مفيدًا." },
    setup: { en: "Organize three harmless sheets in a chosen order. One is moved or temporarily absent.", ar: "رتّب ثلاث أوراق عادية في ترتيب تختاره. تغيّر مكان واحدة أو تغيب مؤقتًا." },
    soloSteps: [
      { en: "Choose a clear arrangement and begin sorting.", ar: "اختر ترتيبًا واضحًا وابدأ." },
      { en: "Alter the position of one sheet between attempts.", ar: "غيّر مكان ورقة واحدة بين المحاولات." },
      { en: "Record the visible cue and how the task changed.", ar: "سجّل العلامة المرئية وكيف تغيّرت المهمة." },
    ],
    partnerSteps: [
      { en: "Agree a simple paper-handling task with your partner.", ar: "اتفق على مهمة بسيطة لترتيب الأوراق مع الشريك." },
      { en: "Allow the partner to hand over a different sheet without surprise tricks.", ar: "دعه يسلّم ورقة مختلفة دون خدع مفاجئة." },
      { en: "Respond to the genuine change and then exchange observations.", ar: "استجب للتغيير الحقيقي ثم تبادلا الملاحظات." },
    ],
    avoid: { en: "Do not imitate an intense face or pressure a partner to supply a particular reaction.", ar: "لا تقلّد تعبيرًا متكلفًا ولا تضغط على شريكك ليقدّم ردًا معينًا." },
    pitfall: { en: "Repeating the same gesture after it has stopped helping the task.", ar: "تكرار الحركة نفسها بعد أن تتوقف عن خدمة المهمة." },
    workplace: { en: "Anchor camera work to a real visual or auditory cue.", ar: "اربط الأداء أمام الكاميرا بعلامة بصرية أو سمعية حقيقية." },
  },
  {
    id: "stanislavski-y1-t1-w01-e03",
    title: { en: "Change the tactic, not the volume", ar: "غيّر التكتيك لا مستوى الصوت" },
    why: { en: "Distinguishes an objective from a surface emotional effect and trains adjustment to an obstacle.", ar: "يميّز الهدف عن الأثر الانفعالي الظاهري ويدرّب التكيّف مع العائق." },
    when: { en: "When a request, scene beat, or audition note stalls.", ar: "عندما يتعطل الطلب أو لحظة في مشهد أو ملاحظة في اختبار." },
    setup: { en: "You want a colleague to lend you a safe, ordinary notebook. They are allowed to decline.", ar: "تريد استعارة دفتر عادي من زميل، وله الحق أن يرفض." },
    soloSteps: [
      { en: "Speak both parts of a neutral exchange, without pretending a second actor is present.", ar: "قل طرفَي حوار عادي دون ادعاء وجود شريك حقيقي." },
      { en: "Write the objective as a verb directed toward the other person.", ar: "صغ الهدف بفعل موجّه إلى الشخص الآخر." },
      { en: "Try explaining after asking fails; compare the two specific actions.", ar: "جرّب الشرح بعد فشل الطلب وقارن الفعلين المحددين." },
    ],
    partnerSteps: [
      { en: "Secure explicit, voluntary agreement and decide a stop signal.", ar: "احصل على موافقة واضحة وطوعية واتفقا على إشارة للتوقف." },
      { en: "Make the harmless request and allow a natural refusal.", ar: "قدّم الطلب العادي واترك المجال لرفض طبيعي." },
      { en: "Switch to an alternative respectful tactic; discuss the actual response.", ar: "انتقل إلى تكتيك بديل محترم وناقشا الرد الفعلي." },
    ],
    avoid: { en: "Do not try to win real consent by pressure or escalate the exercise into conflict.", ar: "لا تحاول انتزاع الموافقة الفعلية بالضغط، ولا تحوّل التمرين إلى خصام." },
    pitfall: { en: "Calling louder delivery a new tactic.", ar: "اعتبار رفع الصوت تكتيكًا جديدًا." },
    workplace: { en: "Annotate a scene with objective, action, obstacle, response and new action.", ar: "علّق على المشهد بالهدف والفعل والعائق والاستجابة والفعل الجديد." },
  },
] as const;

export type StanRoundInput = Record<StanField, string>;
export type StanRound = Readonly<{
  exerciseId: string;
  mode: StanMode;
  fields: StanRoundInput;
  fingerprint: string;
}>;

export function blankStanRound(): StanRoundInput {
  return { circumstances: "", objective: "", action: "", obstacle: "", observation: "", adjustment: "" };
}
export function normalizeStanEvidence(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
export function fingerprintStanEvidence(input: StanRoundInput) {
  return (Object.keys(blankStanRound()) as StanField[]).map((key) => normalizeStanEvidence(input[key])).join("|");
}
export function canLogStanRound(exerciseId: string, mode: StanMode, input: StanRoundInput, history: StanRound[]) {
  if (!STAN_EXERCISES.some((exercise) => exercise.id === exerciseId)) return false;
  if (Object.values(input).some((value) => !value.trim())) return false;
  if (Object.values(input).some((value) => value.length > 900)) return false;
  const previous = history.filter((round) => round.exerciseId === exerciseId && round.mode === mode);
  if (previous.length >= STAN_EDITORIAL_ROUNDS) return false;
  return !previous.some((round) => round.fingerprint === fingerprintStanEvidence(input));
}
export function recordStanRound(exerciseId: string, mode: StanMode, input: StanRoundInput, history: StanRound[]) {
  if (!canLogStanRound(exerciseId, mode, input, history)) return history;
  return [...history, {
    exerciseId, mode,
    fields: { ...input },
    fingerprint: fingerprintStanEvidence(input),
  }];
}
export function countStanRounds(exerciseId: string, mode: StanMode, history: StanRound[]) {
  return history.filter((round) => round.exerciseId === exerciseId && round.mode === mode).length;
}
export function canAdvanceStanExercise(exerciseId: string, mode: StanMode, history: StanRound[]) {
  return countStanRounds(exerciseId, mode, history) >= STAN_EDITORIAL_ROUNDS;
}
export function canStartStanPartner(mode: StanMode, consent: boolean, boundaries: boolean) {
  return mode === "solo" || (consent && boundaries);
}
export function stanPracticeSummary(mode: StanMode, history: StanRound[], reflection: string, next: string) {
  const rows = [
    "SLAMS · Stanislavski workshop 01 · independent editorial preview",
    "Private learner self-report. NO ASSESSED MASTERY / CERTIFICATION / TERM CREDIT.",
    `Mode: ${mode === "solo" ? "solo preparation" : "partner practice (self-reported consent only)"}`,
  ];
  for (const exercise of STAN_EXERCISES) {
    const reps = history.filter((round) => round.exerciseId === exercise.id && round.mode === mode);
    reps.forEach((rep, index) => {
      rows.push(`Exercise ${exercise.id}, round ${index + 1}`);
      for (const key of Object.keys(blankStanRound()) as StanField[]) rows.push(`  ${key}: ${rep.fields[key]}`);
    });
  }
  return [...rows, "Reflection: " + reflection.trim(), "Next attempt: " + next.trim(),
    "This note is not saved to Passport, cloud or academic records."].join("\n");
}

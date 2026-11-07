/**
 * Original SLAMS editorial micro-experiments.
 * These are not institutional syllabi, diagnosis, AI performance evaluations or accredited progression.
 * Every protocol remains draft pending qualified acting-educator review.
 */
export const STUCK_GUIDES = {
  planning: {
    arQuestion: "بفكر في الجملة الجاية بدل ما أسمع",
    arFix: "انقل انتباهك لتصرف محدد من شريكك، وبعدها استجب له بدل ما تستبق الحوار.",
    en: {
      why: "Anticipating a line competes with listening. An observable cue gives your next action a real starting point.",
      when: "You notice yourself waiting to deliver the next line instead of responding.",
      solo: "Read a short exchange. Pause at the reply, note one observable cue in the text, then try a different playable response. This is preparation, not equivalent to a live Meisner partner exercise.",
      partner:
        "With a willing partner, notice one specific thing they do or say, pause, then respond toward your scene objective. Agree on an immediate stop signal before beginning.",
      avoid:
        "Do not guess your partner's thoughts or mechanically parrot them; keep your own objective alive.",
      notice: "What specific cue changed the timing or intention of your answer?",
    },
    ar: {
      why: "توقع الجملة التالية بيشغلك عن الاستماع. ملاحظة شيء حقيقي بتدي ردك نقطة انطلاق.",
      when: "لما تلاقي نفسك مستني دورك في الكلام بدل ما تستجيب.",
      solo: "اقرأ حوار قصير. قف عند رد الطرف الآخر، لاحظ إشارة واضحة في النص، وجرب فعل مختلف. ده تحضير فردي، مش بديل لتدريب مايزنر مع شريك حقيقي.",
      partner:
        "مع شريك موافق، لاحظ فعل أو كلمة محددة، خد لحظة، وبعدها استجب بهدف شخصيتك. اتفقوا على إشارة توقف قبل البداية.",
      avoid: "ما تفترضش أنت عارف أفكار شريكك، وما تحولش الملاحظة لترديد آلي.",
      notice: "إيه الإشارة المحددة اللي غيرت توقيت أو هدف ردك؟",
    },
  },
  general: {
    arQuestion: "المشهد مسطح ومش محدد",
    arFix: "بدل وصف الشعور، اختار فعل واضح تجاه الطرف الآخر: أطمنه، أضغط عليه، أو أقنعه.",
    en: {
      why: "A named emotion is difficult to play as an action. A verb directed at another person gives you something to do.",
      when: "Every line sounds similar even though your character is pursuing something.",
      solo: "Write your objective as a verb with a target, then mark one line where you change tactic. Speak the lines twice with two different actions.",
      partner:
        "Ask a consenting partner to read opposite you. Play one tactic, notice their actual response, and change tactic only if the response warrants it.",
      avoid:
        "Do not force an emotion, confuse volume with action, or change the script's established circumstances.",
      notice: "Which action was more precise, and what response did it create?",
    },
    ar: {
      why: "تسمية الإحساس مش فعل قابل للتمثيل. الفعل الموجه لشخص تاني بيديك حاجة تعملها.",
      when: "لما كل الجمل تبقى بنفس النبرة رغم إن الشخصية بتحاول تحقق هدف.",
      solo: "اكتب هدفك كفعل موجه لشخص، وحدد جملة تغير عندها التكتيك. جرب الحوار مرتين بفعلين مختلفين.",
      partner:
        "اطلب من شريك موافق يقرأ معاك. جرب تكتيك، لاحظ استجابته الحقيقية، وغيّره فقط لو الاستجابة تستدعي ده.",
      avoid: "ما تجبرش نفسك تحس بحاجة، وما تعتبرش الصوت العالي فعل، وما تغيرش حقائق النص.",
      notice: "أنهي فعل كان أدق، وخلق استجابة إزاي؟",
    },
  },
  stakes: {
    arQuestion: "مش حاسس إن فيه حاجة على المحك",
    arFix: "حدد نتيجة ملموسة لو الشخصية فشلت، وتأكد إنها منطقية ومتوافقة مع معطيات النص.",
    en: {
      why: "A concrete, script-consistent consequence can make the objective actionable without manufacturing emotion.",
      when: "The character's goal is clear, but you cannot explain what changes if it fails.",
      solo: "Write one established fact, one plausible consequence, and the immediate action the character takes to prevent it.",
      partner:
        "Tell your partner only the scene facts, not an instruction to feel. Play the action and see whether the stakes alter your behavior.",
      avoid:
        "Do not invent trauma or a backstory that contradicts the text. Do not force personal memories.",
      notice:
        "Did a script-supported consequence change what you did rather than how intensely you felt?",
    },
    ar: {
      why: "النتيجة المحددة والمتسقة مع النص بتخلي الهدف قابل للفعل من غير افتعال إحساس.",
      when: "لما تكون عارف الشخصية عايزة إيه، لكن مش عارف إيه اللي هيحصل لو فشلت.",
      solo: "اكتب حقيقة مؤكدة من النص، ونتيجة محتملة، والفعل الفوري اللي الشخصية هتعمله علشان تمنعها.",
      partner:
        "شارك مع شريكك حقائق المشهد فقط من غير ما تطلب منه إحساس معين. جرب الفعل وراقب تأثير الرهان على السلوك.",
      avoid: "ما تخترعش صدمة أو ماضي بيناقض النص، وما تجبرش نفسك تستدعي ذكريات شخصية.",
      notice: "هل النتيجة المبنية على النص غيرت سلوكك بدل ما تزود شدة الإحساس فقط؟",
    },
  },
  stiff: {
    arQuestion: "جسمي مش مرتاح وحركتي متصلبة",
    arFix: "جرب تغيير بسيط ومريح في وزن وسرعة الحركة، واختار اللي يخدم فعل الشخصية.",
    en: {
      why: "A deliberate change in movement quality can reveal options, but it is not proof of a better performance.",
      when: "Your physical choice is repetitive or disconnected from the action.",
      solo: "Within a comfortable range, try one short seated or standing action slowly and lightly, then with a different safe rhythm. Observe the distinction.",
      partner:
        "Agree on a simple, comfortable task in the scene. Vary movement quality without touching or pushing your partner.",
      avoid:
        "Do not push through pain, use strenuous movement, or treat one movement quality as a universal solution.",
      notice: "Which comfortable movement choice supported the scene action, if any?",
    },
    ar: {
      why: "تغيير نوعية الحركة بشكل مقصود ممكن يفتح اختيارات جديدة، لكنه مش دليل إن الأداء اتحسن.",
      when: "لما تلاقي الحركة متكررة أو منفصلة عن فعل الشخصية.",
      solo: "في حدود راحتك، جرب فعل بسيط وأنت قاعد أو واقف بحركة خفيفة وبطيئة، ثم بإيقاع مريح مختلف. لاحظ الفرق.",
      partner: "اتفق مع شريكك على مهمة بسيطة ومريحة في المشهد. غيّر جودة الحركة من غير لمس أو دفع.",
      avoid: "ما تتجاهلش الألم، وما تعملش حركة عنيفة، وما تعتبرش نوع حركة واحد حل لكل المشاهد.",
      notice: "أنهي اختيار حركة مريح ساعد فعل الشخصية، لو فيه؟",
    },
  },
} as const;

export type StuckGuideId = keyof typeof STUCK_GUIDES;

export function formatStuckSession(
  question: string,
  school: string,
  before: string,
  after: string,
  locale: "en" | "ar" = "en",
): string {
  if (locale === "ar") {
    return [
      "SLAMS — مكتب حل مشاكل الأداء (ملاحظة شخصية، بدون تقييم)",
      "المشكلة: " + question,
      "التقنية المقترحة (محتوى تجريبي): " + school,
      "قبل التجربة: " + before.trim(),
      "بعد التجربة: " + after.trim(),
      "هذه ملاحظات كتبها الممثل بنفسه. لم يتم تسجيل الأداء أو تحليله أو تقييمه أو حفظه.",
    ].join("\n");
  }
  return [
    "SLAMS — Stuck Desk (self-reported practice note; no assessment)",
    "Issue: " + question,
    "Draft technique lens: " + school,
    "Before: " + before.trim(),
    "After experiment: " + after.trim(),
    "These observations were written by the actor. No performance was recorded, analysed, graded, or saved by this tool.",
  ].join("\n");
}

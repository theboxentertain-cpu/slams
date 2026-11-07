import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { useAuditionPrep } from "@/lib/store";
import {
  auditionCopyCandidates,
  copyAuditionFields,
  type LegacyAuditionCopyKey,
} from "@/lib/actor-audition-copy";
import { PROJECT_NOTE_FIELDS, type ProjectDraft } from "@/lib/actor-project-model";

const UI = {
  en: {
    title: "Copy from existing audition notes",
    about:
      "This is a one-time copy into the current editor, not a live link. Original audition notes stay unchanged. Nothing enters this project until you explicitly save it.",
    loading: "Loading existing audition notes…",
    unavailable: "Existing audition notes could not be read. Nothing was copied.",
    noContent: "There are no eligible notes to copy into empty project fields.",
    occupied: "Project field already contains notes. It will not be overwritten.",
    choose: "Select fields to stage",
    preview: "Preview source notes",
    stage: "Copy selected notes into this unsaved editor",
    source: "Existing audition notes",
    staged: "Notes staged in this project editor. Press Save to persist them.",
    legacy: "Edit original audition notes",
    failed: "Could not stage the selected fields.",
  },
  ar: {
    title: "انسخ من ملاحظات الأوديشن القديمة",
    about:
      "ده نسخ لمرة واحدة في المحرر الحالي، مش ربط متزامن. الملاحظات الأصلية هتفضل زي ما هي. مش هيتحفظ شيء في المشروع إلا لما تضغط حفظ.",
    loading: "جاري تحميل ملاحظات الأوديشن…",
    unavailable: "تعذر قراءة ملاحظات الأوديشن. ما اتنسخش أي شيء.",
    noContent: "مفيش ملاحظات قابلة للنسخ في حقول المشروع الفاضية.",
    occupied: "الحقل فيه ملاحظات بالفعل ومش هيتم استبدالها.",
    choose: "اختار الحقول اللي عايز تنسخها",
    preview: "راجع ملاحظات المصدر",
    stage: "انسخ الحقول المختارة للمحرر من غير حفظ",
    source: "ملاحظات الأوديشن القديمة",
    staged: "اتحطت الملاحظات في المحرر. اضغط حفظ علشان تتسجل.",
    legacy: "عدل ملاحظات الأوديشن الأصلية",
    failed: "تعذر تجهيز الحقول المختارة.",
  },
} as const;

export function AuditionCopyPanel({
  draft,
  onStage,
}: {
  draft: ProjectDraft;
  onStage: (next: ProjectDraft) => void;
}) {
  const { locale } = useLanguage();
  const ui = UI[locale];
  const prep = useAuditionPrep();
  const [chosen, setChosen] = useState<LegacyAuditionCopyKey[]>([]);
  const [notice, setNotice] = useState("");
  const candidates = auditionCopyCandidates(prep.data, draft);
  const ready = prep.loaded && !prep.error && candidates.some((candidate) => candidate.eligible);

  function stage() {
    const result = copyAuditionFields(prep.data, draft, chosen);
    if (result.draft) {
      onStage(result.draft);
      setNotice(ui.staged);
      setChosen([]);
    } else {
      setNotice(result.error ?? ui.failed);
    }
  }
  return (
    <section className="foundation-stack panel p-4" aria-label={ui.title}>
      <h3 className="font-semibold">{ui.title}</h3>
      <p className="text-sm text-muted-foreground">{ui.about}</p>
      {!prep.loaded && <p role="status">{ui.loading}</p>}
      {prep.error && <p role="alert">{ui.unavailable}</p>}
      {prep.loaded && !prep.error && !ready && <p>{ui.noContent}</p>}
      {ready && (
        <>
          <fieldset className="foundation-stack">
            <legend className="font-semibold">{ui.choose}</legend>
            {candidates
              .filter((candidate) => !!candidate.value.trim())
              .map((candidate) => {
                const field = PROJECT_NOTE_FIELDS.find(({ key }) => key === candidate.key)!;
                return (
                  <label className="panel p-3 grid gap-2 text-sm" key={candidate.key}>
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={!candidate.eligible}
                        checked={chosen.includes(candidate.key)}
                        onChange={(event) => {
                          setNotice("");
                          setChosen((current) =>
                            event.target.checked
                              ? [...current, candidate.key]
                              : current.filter((key) => key !== candidate.key),
                          );
                        }}
                      />
                      {locale === "ar" ? field.ar : field.label}
                    </span>
                    {candidate.occupied && (
                      <span className="text-muted-foreground">{ui.occupied}</span>
                    )}
                    <details>
                      <summary>{ui.preview}</summary>
                      <p className="whitespace-pre-wrap break-words">{candidate.value}</p>
                    </details>
                  </label>
                );
              })}
          </fieldset>
          <button
            type="button"
            className={btnPrimary}
            disabled={chosen.length === 0}
            onClick={stage}
          >
            {ui.stage}
          </button>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      <Link to="/work/audition" search={{ tab: "preparation" }} className={btnSecondary}>
        {ui.legacy}
      </Link>
    </section>
  );
}

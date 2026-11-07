import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { useUnsavedWork } from "@/lib/unsaved-work";
import {
  AUDITION_FIELDS,
  AUDITION_STATUSES,
  blankAuditionDraft,
  validateAuditionDraft,
  type AuditionDraft,
} from "@/lib/actor-audition-model";
import { useActorAuditions, type ActorAudition } from "@/lib/use-actor-auditions";
import { useActorProjects } from "@/lib/use-actor-projects";

const COPY = {
  en: {
    heading: "My auditions",
    intro:
      "One private preparation file per audition. Link a project only when you choose. Your original audition notes remain separate.",
    guest: "Sign in to create individual, account-saved audition files.",
    login: "Sign in",
    loading: "Loading audition records…",
    missing: "Separate audition storage is unavailable. No records were saved.",
    retry: "Retry",
    new: "New audition",
    cancel: "Close editor",
    empty: "No separate audition files yet.",
    title: "Audition / opportunity",
    role: "Role",
    project: "Associated project",
    none: "No project linked",
    projectUnavailable: "Projects could not be loaded; linked-project changes are unavailable.",
    date: "Due date (optional)",
    status: "Audition status",
    preparing: "Preparing",
    ready: "Ready",
    submitted: "Submitted",
    closed: "Closed",
    save: "Save audition",
    create: "Create audition",
    saving: "Saving…",
    saved: "Audition saved to your account as a new revision.",
    created: "Separate audition file created in your account.",
    revision: "Revision",
    editLegacy: "Open original audition-preparation notes",
    legacy: "The original single audition-preparation record is not moved, overwritten or deleted.",
    sides: "Open script sides for your auditions",
    rehearse: "Rehearse this audition",
    unsaved: "Unsaved edits disappear when you switch records or leave this screen.",
    noProject: "Create a project in Actor at Work to associate it with an audition.",
  },
  ar: {
    heading: "الأوديشنات بتاعتي",
    intro: "ملف تحضير مستقل لكل أوديشن. ربطه بمشروع اختياري. ملاحظات الأوديشن القديمة منفصلة.",
    guest: "سجّل دخول علشان تعمل ملفات أوديشن منفصلة محفوظة في حسابك.",
    login: "تسجيل الدخول",
    loading: "جاري تحميل ملفات الأوديشن…",
    missing: "تعذر الوصول لقاعدة بيانات الأوديشنات. مفيش ملفات اتحفظت.",
    retry: "حاول تاني",
    new: "أوديشن جديد",
    cancel: "اقفل المحرر",
    empty: "لسه مفيش ملفات أوديشن منفصلة.",
    title: "الأوديشن أو الفرصة",
    role: "الدور",
    project: "المشروع المرتبط",
    none: "من غير مشروع",
    projectUnavailable: "تعذر تحميل المشاريع. مش ممكن تغير ربط المشروع دلوقتي.",
    date: "آخر موعد (اختياري)",
    status: "حالة الأوديشن",
    preparing: "بجهّز",
    ready: "جاهز",
    submitted: "اتقدّم",
    closed: "مغلق",
    save: "احفظ الأوديشن",
    create: "أنشئ الأوديشن",
    saving: "جاري الحفظ…",
    saved: "اتحفظت التعديلات في حسابك كنسخة جديدة.",
    created: "اتعمل ملف أوديشن مستقل في حسابك.",
    revision: "نسخة",
    editLegacy: "افتح ملاحظات الأوديشن الأصلية",
    legacy: "ملاحظات الأوديشن القديمة مش هتتنقل أو تتمسح أو تتغير.",
    sides: "افتح نصوص الأوديشنات",
    rehearse: "اتمرن على الأوديشن ده",
    unsaved: "التعديلات اللي متحفظتش بتضيع لو غيرت الملف أو خرجت من الصفحة.",
    noProject: "اعمل مشروع من قسم شغل الممثل علشان تربطه بالأوديشن.",
  },
} as const;
function asDraft(record: ActorAudition): AuditionDraft {
  return {
    title: record.title,
    roleName: record.roleName,
    projectId: record.projectId,
    dueDate: record.dueDate,
    status: record.status,
    notes: { ...record.notes },
  };
}

/** Multi-file professional preparation. Legacy notes retain their own storage and UI. */
export function AuditionFiles({ auditionId }: { auditionId?: string | undefined } = {}) {
  const { locale } = useLanguage();
  const ui = COPY[locale];
  const auditions = useActorAuditions();
  const projects = useActorProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<AuditionDraft>(blankAuditionDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const accountRef = useRef(auditions.userId);
  const openedRoute = useRef("");
  accountRef.current = auditions.userId;
  const selected = auditions.records.find((record) => record.id === selectedId) ?? null;
  const baseline = selected ? asDraft(selected) : blankAuditionDraft();
  const dirty =
    auditions.signedIn &&
    (creating || !!selected) &&
    JSON.stringify(draft) !== JSON.stringify(baseline);
  const markSaved = useUnsavedWork(dirty);
  function mayDiscard() {
    return (
      !dirty ||
      window.confirm(
        locale === "ar"
          ? "عندك تعديلات غير محفوظة. لو خرجت هتضيع. تخرج من غير حفظ؟"
          : "You have unsaved changes. Leaving will discard them. Leave without saving?",
      )
    );
  }
  const ownedProjectIds = projects.projects.map((project) => project.id);
  const validation = validateAuditionDraft(draft, ownedProjectIds);
  const canSave = auditions.loaded && !auditions.error && (creating || !!selected);
  const projectReady = projects.loaded && !projects.error;
  useEffect(() => {
    openedRoute.current = "";
    setSelectedId(null);
    setCreating(false);
    setDraft(blankAuditionDraft());
    setBusy(false);
    setMessage("");
  }, [auditions.userId]);

  useEffect(() => {
    const key = `${auditions.userId ?? ""}:${auditionId ?? ""}`;
    if (!auditionId || !auditions.loaded || openedRoute.current === key) return;
    openedRoute.current = key;
    const record = auditions.records.find((item) => item.id === auditionId);
    if (record) {
      setSelectedId(record.id);
      setCreating(false);
      setDraft(asDraft(record));
      setMessage("");
    }
  }, [auditionId, auditions.userId, auditions.loaded, auditions.records]);

  function open(record: ActorAudition, confirmedSave = false) {
    if (!confirmedSave && !mayDiscard()) return;
    setSelectedId(record.id);
    setCreating(false);
    setDraft(asDraft(record));
    setMessage("");
  }
  function newFile() {
    if (!mayDiscard()) return;
    setSelectedId(null);
    setCreating(true);
    setDraft(blankAuditionDraft());
    setMessage("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || validation || busy || (draft.projectId && !projectReady)) return;
    const owner = accountRef.current;
    setBusy(true);
    setMessage("");
    try {
      const result = creating
        ? await auditions.create(draft, ownedProjectIds)
        : await auditions.update(selected!, draft, ownedProjectIds);
      if (accountRef.current !== owner) return;
      if (result.value) {
        markSaved();
        open(result.value, true);
        setMessage(creating ? ui.created : ui.saved);
      } else {
        setMessage(result.error ?? "Save not confirmed. Your edits were not discarded.");
      }
    } finally {
      if (accountRef.current === owner) setBusy(false);
    }
  }
  const stageLabel = (status: ActorAudition["status"]) => ui[status];
  return (
    <section className="foundation-stack" aria-label={ui.heading}>
      <h2>{ui.heading}</h2>
      <p className="text-sm text-muted-foreground">{ui.intro}</p>
      {!auditions.signedIn ? (
        <p>
          {ui.guest}{" "}
          <Link to="/auth" className="underline">
            {ui.login}
          </Link>
        </p>
      ) : (
        <>
          {!auditions.loaded && <p role="status">{ui.loading}</p>}
          {auditions.error && (
            <div className="panel p-4 foundation-stack" role="alert">
              <p>{ui.missing}</p>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => void auditions.reload()}
              >
                {ui.retry}
              </button>
            </div>
          )}
          {auditions.loaded && !auditions.error && (
            <>
              <button type="button" className={btnPrimary} disabled={busy} onClick={newFile}>
                {ui.new}
              </button>
              {auditions.records.length === 0 && <p>{ui.empty}</p>}
              <ul className="grid gap-2">
                {auditions.records.map((record) => (
                  <li key={record.id}>
                    <button
                      className={`${btnSecondary} w-full flex-wrap justify-between gap-2 text-start`}
                      type="button"
                      disabled={busy}
                      aria-pressed={selectedId === record.id}
                      onClick={() => open(record)}
                    >
                      <span className="min-w-0 break-words">
                        {record.title} · {record.roleName || "—"}
                      </span>
                      <span className="text-xs">
                        {stageLabel(record.status)} · {record.dueDate ?? "—"} · {ui.revision}{" "}
                        {record.revision}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {(creating || selected) && (
                <section
                  className="panel p-4 foundation-stack"
                  aria-label={creating ? ui.new : ui.heading}
                >
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={busy}
                    onClick={() => {
                      if (!mayDiscard()) return;
                      setCreating(false);
                      setSelectedId(null);
                      setMessage("");
                    }}
                  >
                    {ui.cancel}
                  </button>
                  <form onSubmit={(event) => void submit(event)} className="grid gap-4">
                    <label className="grid gap-1">
                      {ui.title}
                      <input
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        value={draft.title}
                        disabled={busy}
                        maxLength={120}
                        required
                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-1">
                      {ui.role}
                      <input
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        value={draft.roleName}
                        disabled={busy}
                        maxLength={120}
                        onChange={(event) => setDraft({ ...draft, roleName: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-1">
                      {ui.project}
                      <select
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        value={draft.projectId ?? ""}
                        disabled={busy || !projectReady}
                        onChange={(event) =>
                          setDraft({ ...draft, projectId: event.target.value || null })
                        }
                      >
                        <option value="">{ui.none}</option>
                        {projects.projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title} — {project.roleName || "—"}
                          </option>
                        ))}
                      </select>
                      {!projectReady && <span role="status">{ui.projectUnavailable}</span>}
                      {projectReady && projects.projects.length === 0 && (
                        <span className="text-xs text-muted-foreground">{ui.noProject}</span>
                      )}
                    </label>
                    <label className="grid gap-1">
                      {ui.date}
                      <input
                        type="date"
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        value={draft.dueDate ?? ""}
                        disabled={busy}
                        onChange={(event) =>
                          setDraft({ ...draft, dueDate: event.target.value || null })
                        }
                      />
                    </label>
                    <label className="grid gap-1">
                      {ui.status}
                      <select
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        value={draft.status}
                        disabled={busy}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            status: event.target.value as AuditionDraft["status"],
                          })
                        }
                      >
                        {AUDITION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {ui[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {AUDITION_FIELDS.map((field) => (
                      <label key={field.key} className="grid gap-1">
                        {locale === "ar" ? field.ar : field.en}
                        <textarea
                          className="w-full rounded border border-input bg-background p-3"
                          rows={3}
                          maxLength={1500}
                          disabled={busy}
                          value={draft.notes[field.key]}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              notes: { ...draft.notes, [field.key]: event.target.value },
                            })
                          }
                        />
                      </label>
                    ))}
                    {validation && (
                      <p role="status" className="text-sm text-amber">
                        {validation}
                      </p>
                    )}
                    <button
                      type="submit"
                      className={btnPrimary}
                      disabled={busy || !!validation || (!!draft.projectId && !projectReady)}
                    >
                      {busy ? ui.saving : creating ? ui.create : ui.save}
                    </button>
                  </form>
                  <p className="text-xs text-muted-foreground">{ui.unsaved}</p>
                  {selected && (
                    <Link
                      to="/rehearsal"
                      search={{ auditionId: selected.id, returnTo: "audition" }}
                      className={btnSecondary}
                    >
                      {ui.rehearse}
                    </Link>
                  )}
                </section>
              )}
            </>
          )}
          {message && (
            <p role="status" className="text-sm text-amber">
              {message}
            </p>
          )}
        </>
      )}
      <Link to="/work/sides" className="underline">
        {ui.sides}
      </Link>
      <p className="text-sm text-muted-foreground">{ui.legacy}</p>
      <Link to="/work/audition" search={{ tab: "preparation" }} className="underline">
        {ui.editLegacy}
      </Link>
    </section>
  );
}

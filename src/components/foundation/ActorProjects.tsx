import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import {
  PROJECT_NOTE_FIELDS,
  blankProjectDraft,
  validateProjectDraft,
  type ProjectDraft,
  type ProjectStatus,
} from "@/lib/actor-project-model";
import { useActorProjects, type ActorProject, type ActorProjectRevision } from "@/lib/use-actor-projects";

const LABELS = {
  en: {
    title: "Your project files",
    intro: "Separate character preparation and scene breakdowns for each role. Your existing single audition-preparation record remains separate and untouched.",
    signIn: "Sign in to create private, cloud-saved project files. Guest audition notes still work as before.",
    signInLink: "Sign in",
    loading: "Loading your projects…",
    empty: "No project files yet. Create one for your next role.",
    new: "New project",
    close: "Close editor",
    showArchive: "Show archived files",
    current: "Active projects",
    archived: "Archived projects",
    projectName: "Project / production title",
    role: "Role / character",
    character: "Character file",
    breakdown: "Scene breakdown",
    save: "Save project",
    create: "Create project",
    saving: "Saving…",
    archive: "Archive project",
    restore: "Restore project",
    history: "View version history",
    revision: "Version",
    copyFromHistory: "Load this version into the editor (not saved)",
    copyLoaded: "Earlier version loaded into the editor. Save it to create a new revision.",
    none: "No revision records returned.",
    versionUnavailable: "Could not retrieve version history.",
    saved: "Project saved to your account.",
    created: "Project created in your account.",
    changed: "Archive status updated.",
    retry: "Retry loading",
    legacy: "Open existing audition notes",
    temporary: "Unsaved edits are not backed up. Leaving or changing files discards those edits.",
    disabled: "Project files require secure database installation. No project was saved.",
  },
  ar: {
    title: "ملفات شغلك",
    intro: "تحضير مستقل للشخصية وتحليل المشاهد لكل دور. ملاحظات الأوديشن القديمة منفصلة ومش هتتغير.",
    signIn: "سجل دخول علشان تنشئ ملفات خاصة محفوظة في حسابك. ملاحظات الأوديشن للزائر لسه شغالة.",
    signInLink: "تسجيل الدخول",
    loading: "جاري تحميل الملفات…",
    empty: "لسه مفيش ملفات مشاريع. أنشئ ملف لأول دور.",
    new: "مشروع جديد",
    close: "اقفل المحرر",
    showArchive: "عرض الملفات المؤرشفة",
    current: "المشاريع النشطة",
    archived: "المشاريع المؤرشفة",
    projectName: "اسم المشروع أو العمل",
    role: "الدور أو الشخصية",
    character: "ملف الشخصية",
    breakdown: "تحليل المشهد",
    save: "احفظ الملف",
    create: "إنشاء الملف",
    saving: "جاري الحفظ…",
    archive: "أرشفة الملف",
    restore: "استعادة الملف",
    history: "عرض النسخ السابقة",
    revision: "نسخة",
    copyFromHistory: "حمّل النسخة دي في المحرر (من غير حفظ)",
    copyLoaded: "النسخة القديمة ظهرت في المحرر. احفظ علشان تنشئ نسخة جديدة.",
    none: "مفيش نسخ سابقة ظاهرة.",
    versionUnavailable: "تعذر تحميل تاريخ النسخ.",
    saved: "تم حفظ الملف في حسابك.",
    created: "تم إنشاء الملف في حسابك.",
    changed: "تم تحديث حالة الأرشفة.",
    retry: "أعد التحميل",
    legacy: "افتح ملاحظات الأوديشن الحالية",
    temporary: "التعديلات غير المحفوظة مش متخزنة. تغيير الملف بيمسح أي تعديل لسه متحفظش.",
    disabled: "الملفات محتاجة قاعدة بيانات مؤمنة ومفعلة. لم يتم حفظ أي ملف.",
  },
} as const;

function projectDraft(project: ActorProject): ProjectDraft {
  return { title: project.title, roleName: project.roleName, notes: { ...project.notes } };
}

export function ActorProjects() {
  const { locale } = useLanguage();
  const ui = LABELS[locale];
  const store = useActorProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(blankProjectDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ActorProjectRevision[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;
  const selected = store.projects.find((project) => project.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedId(null);
    setCreating(false);
    setDraft(blankProjectDraft());
    setHistory(null);
    setHistoryLoading(false);
    setMessage("");
  }, [store.userId]);

  function openProject(project: ActorProject) {
    setSelectedId(project.id);
    setCreating(false);
    setDraft(projectDraft(project));
    setHistory(null);
    setHistoryLoading(false);
    setMessage("");
  }
  function newProject() {
    setSelectedId(null);
    setCreating(true);
    setDraft(blankProjectDraft());
    setHistory(null);
    setHistoryLoading(false);
    setMessage("");
  }
  function closeProject() {
    setSelectedId(null);
    setCreating(false);
    setHistory(null);
    setHistoryLoading(false);
    setMessage("");
  }
  const editing = creating || selected !== null;
  const invalid = validateProjectDraft(draft);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalid || busy || !editing) return;
    setBusy(true);
    setMessage("");
    try {
      const result = creating ? await store.create(draft) : await store.update(selected!, draft);
      if (result.error) {
        setMessage(result.error);
      } else {
        openProject(result.value);
        setMessage(creating ? ui.created : ui.saved);
      }
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(next: ProjectStatus) {
    if (!selected || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await store.update(selected, projectDraft(selected), next);
      if (result.error) setMessage(result.error);
      else {
        openProject(result.value);
        setMessage(ui.changed);
      }
    } finally {
      setBusy(false);
    }
  }

  async function showHistory() {
    if (!selected || busy) return;
    const expectedId = selected.id;
    setHistoryLoading(true);
    setMessage("");
    const result = await store.loadHistory(selected);
    if (selectedRef.current === expectedId) {
      setHistory(result.error ? null : result.value);
      if (result.error) setMessage(result.error || ui.versionUnavailable);
      setHistoryLoading(false);
    }
  }

  const visible = store.projects.filter((project) => showArchived || project.status === "active");
  return (
    <section className="foundation-stack" aria-label={ui.title}>
      <h2>{ui.title}</h2>
      <p className="text-sm text-muted-foreground">{ui.intro}</p>
      {!store.signedIn ? (
        <section className="panel p-4">
          <p>{ui.signIn}</p>
          <Link className={btnPrimary} to="/auth">{ui.signInLink}</Link>
          <Link className="block mt-3 underline" to="/work/audition" search={{ tab: "preparation" }}>
            {ui.legacy}
          </Link>
        </section>
      ) : (
        <>
          {!store.loaded && <p role="status">{ui.loading}</p>}
          {store.error && (
            <div className="panel p-4" role="alert">
              <p>{store.error}</p>
              <p>{ui.disabled}</p>
              <button type="button" className={btnSecondary} onClick={() => void store.reload()}>
                {ui.retry}
              </button>
            </div>
          )}
          {store.loaded && !store.error && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={btnPrimary} disabled={busy} onClick={newProject}>
                  {ui.new}
                </button>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(event) => setShowArchived(event.target.checked)}
                  />
                  {ui.showArchive}
                </label>
              </div>
              <div className="foundation-stack">
                <h3 className="font-semibold">{showArchived ? ui.archived : ui.current}</h3>
                {visible.length === 0 && <p>{ui.empty}</p>}
                <ul className="grid gap-2">
                  {visible.map((project) => (
                    <li key={project.id}>
                      <button
                        type="button"
                        className={`${btnSecondary} w-full justify-between gap-3 text-start`}
                        aria-pressed={selectedId === project.id}
                        disabled={busy}
                        onClick={() => openProject(project)}
                      >
                        <span className="min-w-0 break-words">{project.title} · {project.roleName || "—"}</span>
                        <span className="shrink-0 text-xs">{ui.revision} {project.revision}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {editing && (
                <section className="panel p-4 foundation-stack" aria-label={creating ? ui.new : ui.title}>
                  <div className="flex flex-wrap justify-end">
                    <button type="button" className={btnSecondary} disabled={busy} onClick={closeProject}>
                      {ui.close}
                    </button>
                  </div>
                  <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
                    <label className="grid gap-1">
                      {ui.projectName}
                      <input
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        required
                        maxLength={120}
                        disabled={busy}
                        value={draft.title}
                        onChange={(event) => {
                          setDraft({ ...draft, title: event.target.value });
                          setMessage("");
                        }}
                      />
                    </label>
                    <label className="grid gap-1">
                      {ui.role}
                      <input
                        className="w-full min-h-12 rounded border border-input bg-background p-3"
                        maxLength={120}
                        disabled={busy}
                        value={draft.roleName}
                        onChange={(event) => {
                          setDraft({ ...draft, roleName: event.target.value });
                          setMessage("");
                        }}
                      />
                    </label>
                    {(["Character", "Breakdown"] as const).map((group) => (
                      <details key={group} className="planned-tools">
                        <summary>{group === "Character" ? ui.character : ui.breakdown}</summary>
                        <div className="grid gap-3">
                          {PROJECT_NOTE_FIELDS.filter((field) => field.group === group).map((field) => (
                            <label className="grid gap-1 text-sm" key={field.key}>
                              {locale === "ar" ? field.ar : field.label}
                              <textarea
                                className="w-full rounded border border-input bg-background p-3"
                                rows={3}
                                maxLength={900}
                                disabled={busy}
                                value={draft.notes[field.key]}
                                onChange={(event) => {
                                  setDraft({
                                    ...draft,
                                    notes: { ...draft.notes, [field.key]: event.target.value },
                                  });
                                  setMessage("");
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      </details>
                    ))}
                    {invalid && <p className="text-sm text-amber" role="status">{invalid}</p>}
                    <button type="submit" className={btnPrimary} disabled={busy || !!invalid}>
                      {busy ? ui.saving : creating ? ui.create : ui.save}
                    </button>
                  </form>
                  {selected && !creating && (
                    <div className="foundation-stack border-t border-amber/30 pt-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={btnSecondary} disabled={busy} onClick={() => void showHistory()}>
                          {ui.history}
                        </button>
                        <button
                          type="button"
                          className={btnSecondary}
                          disabled={busy}
                          onClick={() => void changeStatus(selected.status === "active" ? "archived" : "active")}
                        >
                          {selected.status === "active" ? ui.archive : ui.restore}
                        </button>
                      </div>
                      {historyLoading && <p role="status">{ui.loading}</p>}
                      {history && (
                        <div className="grid gap-3" aria-label={ui.history}>
                          {history.length === 0 && <p>{ui.none}</p>}
                          {history.map((revision) => (
                            <details className="planned-tools" key={revision.revision}>
                              <summary>
                                {ui.revision} {revision.revision} · {new Date(revision.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                              </summary>
                              <p className="break-words">{revision.title} — {revision.roleName}</p>
                              <dl className="saved-choices">
                                {PROJECT_NOTE_FIELDS.filter((field) => revision.notes[field.key]).map((field) => (
                                  <div key={field.key}>
                                    <dt>{locale === "ar" ? field.ar : field.label}</dt>
                                    <dd>{revision.notes[field.key]}</dd>
                                  </div>
                                ))}
                              </dl>
                              <button
                                type="button"
                                className={btnSecondary}
                                onClick={() => {
                                  setDraft({ title: revision.title, roleName: revision.roleName, notes: { ...revision.notes } });
                                  setMessage(ui.copyLoaded);
                                }}
                              >
                                {ui.copyFromHistory}
                              </button>
                            </details>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{ui.temporary}</p>
                </section>
              )}
            </>
          )}
          {message && <p role="status" className="text-sm text-amber">{message}</p>}
          <Link className="underline" to="/work/audition" search={{ tab: "preparation" }}>
            {ui.legacy}
          </Link>
        </>
      )}
    </section>
  );
}

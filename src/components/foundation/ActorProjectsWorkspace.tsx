import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";
import { btnPrimary, btnSecondary } from "@/components/slams";
import {
  draftEquals, emptyProjectDraft, projectDraft, validateProject,
  PROJECT_FIELD_LIMITS, type ActorProject, type ProjectDraft, type ProjectKind,
} from "@/lib/actor-project-model";
import { useActorProjects } from "@/lib/use-actor-projects";

type EditMode = "list" | "new" | "edit";
type EditField = keyof ProjectDraft;
const KIND: ProjectKind[] = ["audition", "role", "production", "personal"];

export function ActorProjectsWorkspace() {
  const { user, loading } = useSession();
  const { locale } = useLanguage();
  if (loading) return <p role="status">{locale === "ar" ? "جارٍ تحميل ملفّات المشاريع…" : "Loading project files…"}</p>;
  return <ActorProjectsSession key={user?.id ?? "guest"} />;
}

function ActorProjectsSession() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const text = (en: string, arabic: string) => ar ? arabic : en;
  const projects = useActorProjects();
  const [mode, setMode] = useState<EditMode>("list");
  const [selected, setSelected] = useState<ActorProject | null>(null);
  const [draft, setDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [baseline, setBaseline] = useState<ProjectDraft>(emptyProjectDraft);
  const [archivedVisible, setArchivedVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const hasChanges = !draftEquals(draft, baseline);
  const visible = projects.items.filter((item) => item.status === (archivedVisible ? "archived" : "active"));
  const current = selected ? projects.items.find((item) => item.id === selected.id) ?? null : null;

  function choose(item: ActorProject) {
    if (hasChanges && mode !== "list") {
      setNotice(text("Save or discard changes before changing project.", "احفظ التغييرات أو ألغها قبل الانتقال إلى مشروع آخر."));
      return;
    }
    const next = projectDraft(item);
    setDraft(next);
    setBaseline(next);
    setSelected(item);
    setMode("edit");
    setPendingDelete(false);
    setNotice("");
    setSaveError("");
  }
  function beginNew() {
    if (hasChanges && mode !== "list") {
      setNotice(text("Save or discard changes first.", "احفظ التغييرات أو ألغها أولًا."));
      return;
    }
    setSelected(null);
    setDraft(emptyProjectDraft());
    setBaseline(emptyProjectDraft());
    setMode("new");
    setPendingDelete(false);
    setSaveError("");
    setNotice("");
  }
  function discard() {
    setDraft(emptyProjectDraft());
    setBaseline(emptyProjectDraft());
    setSelected(null);
    setMode("list");
    setPendingDelete(false);
    setSaveError("");
    setNotice("");
  }
  function edit<K extends EditField>(field: K, value: ProjectDraft[K]) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setNotice("");
    setSaveError("");
    setPendingDelete(false);
  }
  async function save() {
    if (busy) return;
    const invalid = validateProject(draft);
    if (invalid) { setSaveError(invalid); return; }
    setBusy(true);
    setSaveError("");
    const result = mode === "edit" && selected
      ? await projects.update(selected.id, selected.version, draft)
      : await projects.create(draft);
    setBusy(false);
    if (result.error || !result.project) {
      setSaveError(result.error ?? text("Project save could not be confirmed.", "تعذّر تأكيد حفظ المشروع."));
      return;
    }
    const next = projectDraft(result.project);
    setSelected(result.project);
    setDraft(next);
    setBaseline(next);
    setMode("edit");
    setNotice(text("File saved. No other project was changed.", "تم حفظ الملف. لم تتغير أي مشاريع أخرى."));
  }
  async function remove() {
    if (!selected || busy || !pendingDelete) return;
    setBusy(true);
    const result = await projects.remove(selected.id);
    setBusy(false);
    if (result.error) { setSaveError(result.error); return; }
    discard();
    setNotice(text("Project deleted.", "تم حذف المشروع."));
  }

  const short = (value: string, max = 90) => value.length > max ? value.slice(0, max) + "…" : value;
  const field = (name: Exclude<EditField, "kind" | "status" | "due_date">, en: string, arabic: string, rows = 3) => (
    <label key={name} className="grid gap-2 text-sm">
      <span className="font-semibold">{text(en, arabic)}</span>
      {name === "title" || name === "role_name" ? (
        <input
          type="text"
          className="min-h-11 w-full rounded border border-border bg-background p-3 text-foreground"
          required={name === "title"}
          maxLength={PROJECT_FIELD_LIMITS[name]}
          value={draft[name]}
          disabled={busy}
          onChange={(event) => edit(name, event.target.value)}
        />
      ) : (
        <textarea
          className="w-full rounded border border-border bg-background p-3 text-foreground"
          rows={rows}
          maxLength={PROJECT_FIELD_LIMITS[name]}
          value={draft[name]}
          disabled={busy}
          onChange={(event) => edit(name, event.target.value)}
        />
      )}
      <small className="text-muted-foreground">
        {draft[name].length} / {PROJECT_FIELD_LIMITS[name]}
      </small>
    </label>
  );

  return (
    <section className="foundation-stack actor-projects" aria-label={text("Project files", "ملفات المشاريع")}>
      <div className="availability-note">
        <span className="office-kicker">{text("ACTOR AT WORK · PRIVATE PROJECT DESK", "الممثل في العمل · مكتب المشاريع الخاصة")}</span>
        <p className="mt-2">
          {text(
            "Create separate audition and role files. Your legacy audition preparation remains unchanged and is not automatically imported.",
            "أنشئ ملفات منفصلة للاختبارات والأدوار. ملاحظات الاختبار القديمة لا تتغير ولا تُنقل تلقائيًا."
          )}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {projects.signedIn
            ? text(
                "Signed-in files require the actor_projects database migration and verified account permissions. No guest drafts are silently uploaded.",
                "ملفات الحساب تحتاج إلى تفعيل تحديث قاعدة البيانات واختبار الصلاحيات. لن تُرفع ملاحظات الضيف تلقائيًا."
              )
            : text(
                "Guest files remain only in this browser. Clearing its data will erase them. Signing in does not silently transfer them.",
                "ملفات الضيف موجودة في هذا المتصفح فقط. مسح بياناته يمسحها، وتسجيل الدخول لا ينقلها تلقائيًا."
              )}
        </p>
      </div>
      <p className="text-sm">
        <Link to="/work/audition" search={{ tab: "preparation" }} className="underline underline-offset-4">
          {text("Open existing audition preparation", "افتح تحضير الاختبار الموجود")}
        </Link>
      </p>
      {!projects.loaded ? (
        <p role="status">{text("Checking project files…", "جارٍ فحص ملفات المشاريع…")}</p>
      ) : projects.error ? (
        <div className="availability-note" role="alert">
          <p>{projects.error}</p>
          <p className="mt-2">{text("Your existing audition preparation has not been modified.", "لم تتغير ملاحظات الاختبار الحالية.")}</p>
          <button type="button" className={btnSecondary} onClick={projects.reload}>
            {text("Retry project files", "أعد المحاولة")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnPrimary} onClick={beginNew} disabled={busy}>
              {text("+ New project file", "+ ملف مشروع جديد")}
            </button>
            <button type="button" className={btnSecondary} onClick={() => {
              if (hasChanges && mode !== "list") { setNotice(text("Save or discard changes before changing the list.", "احفظ التغييرات أو ألغها قبل تغيير القائمة.")); return; }
              setArchivedVisible((previous) => !previous);
              discard();
            }} disabled={busy} aria-pressed={archivedVisible}>
              {archivedVisible ? text("Show active", "اعرض النشط") : text("Show archived", "اعرض الأرشيف")}
              {" "}({projects.items.filter((item) => item.status === (archivedVisible ? "active" : "archived")).length})
            </button>
          </div>
          {notice && <p className="text-sm text-amber" role="status">{notice}</p>}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <section className="panel min-w-0 p-4" aria-label={text("Saved project index", "فهرس المشاريع المحفوظة")}>
              <h3 className="font-bold">{archivedVisible ? text("Archived project files", "ملفات المشاريع المؤرشفة") : text("Active project files", "ملفات المشاريع النشطة")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {visible.length} {text("files in this view", "ملفات في هذه القائمة")}
              </p>
              {visible.length === 0 ? (
                <p className="mt-4 text-sm">{text("No files here. Create one, or switch between active and archived.", "لا توجد ملفات هنا. أنشئ ملفًا أو غيّر القائمة.")}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {visible.map((item) => (
                    <li key={item.id}>
                      <button type="button" className="w-full rounded border border-border bg-secondary p-3 text-start hover:border-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
                        aria-pressed={selected?.id === item.id}
                        onClick={() => choose(item)}>
                        <strong className="block break-words">{short(item.title)}</strong>
                        <span className="mt-1 block text-xs text-muted-foreground">{item.kind} · {item.role_name || text("Role unspecified", "دور غير محدد")}</span>
                        {item.due_date && <span className="mt-1 block text-xs text-muted-foreground">{text("Deadline", "الموعد")} · {item.due_date}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel min-w-0 p-4" aria-label={text("Project editor", "محرر المشروع")}>
              {mode === "list" ? (
                <>
                  <h3 className="text-lg font-semibold">{text("Choose a project or create a new file", "اختر مشروعًا أو أنشئ ملفًا جديدًا")}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {text("Project files contain role information, given circumstances, objectives, obstacles, playable actions, and rehearsal notes. They do not record or assess performance.", "تضم الملفات الدور والظروف والأهداف والعوائق والأفعال وملاحظات البروفة. لا تُسجل أداءك ولا تقيّمه.")}
                  </p>
                </>
              ) : (
                <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
                  <h3 className="text-lg font-bold">{mode === "new" ? text("New project file", "ملف مشروع جديد") : text("Edit project file", "تعديل ملف المشروع")}</h3>
                  {mode === "edit" && !current && (
                    <p role="alert">{text("This project is no longer in the visible account index. Discard and reload before editing.", "هذا المشروع لم يعد موجودًا في القائمة الحالية. ألغ التعديلات وأعد التحميل.")}</p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field("title", "Project title (required)", "اسم المشروع (مطلوب)", 1)}
                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold">{text("Project type", "نوع المشروع")}</span>
                      <select className="min-h-11 rounded border border-border bg-background p-3 text-foreground" value={draft.kind} disabled={busy} onChange={(event) => edit("kind", event.target.value as ProjectKind)}>
                        {KIND.map((item) => <option value={item} key={item}>{item}</option>)}
                      </select>
                    </label>
                    {field("role_name", "Role / character", "الدور / الشخصية", 1)}
                    <label className="grid gap-2 text-sm">
                      <span className="font-semibold">{text("Audition or work deadline (optional)", "موعد الاختبار أو العمل (اختياري)")}</span>
                      <input className="min-h-11 rounded border border-border bg-background p-3 text-foreground" type="date"
                        value={draft.due_date ?? ""} disabled={busy}
                        onChange={(event) => edit("due_date", event.target.value || null)} />
                    </label>
                  </div>
                  {field("given_circumstances", "Given circumstances — facts, not guesses", "الظروف المعطاة — الحقائق دون تخمين")}
                  {field("objective", "Playable objective", "هدف قابل للأداء")}
                  {field("obstacle", "Obstacle", "العائق")}
                  {field("playable_action", "Action / tactic to try", "الفعل / التكتيك الذي ستجربه")}
                  {field("rehearsal_notes", "Rehearsal notes and next attempt", "ملاحظات البروفة والمحاولة التالية", 5)}
                  {mode === "edit" && (
                    <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input type="checkbox" checked={draft.status === "archived"} disabled={busy}
                        onChange={(event) => edit("status", event.target.checked ? "archived" : "active")} />
                      {text("Archive this project (reversible)", "أرشف هذا المشروع (يمكن استرجاعه)")}
                    </label>
                  )}
                  {saveError && <p role="alert" className="text-destructive">{saveError}</p>}
                  <p className="text-xs text-muted-foreground">{hasChanges ? text("Unsaved changes", "تعديلات غير محفوظة") : text("No unsaved changes", "لا توجد تعديلات غير محفوظة")}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={btnPrimary} disabled={busy || !draft.title.trim() || (mode === "edit" && (!hasChanges || !current))}>
                      {busy ? text("Saving…", "جارٍ الحفظ…") : mode === "new" ? text("Create project", "أنشئ المشروع") : text("Save changes", "احفظ التعديلات")}
                    </button>
                    <button type="button" className={btnSecondary} disabled={busy} onClick={discard}>
                      {text("Discard and return", "إلغاء والعودة")}
                    </button>
                    {mode === "edit" && current && !hasChanges && (
                      <button type="button" className={btnSecondary} disabled={busy} onClick={() => setPendingDelete(true)}>
                        {text("Delete project…", "احذف المشروع…")}
                      </button>
                    )}
                  </div>
                  {pendingDelete && mode === "edit" && selected && !hasChanges && (
                    <div className="rounded border border-destructive p-3" role="group" aria-label={text("Confirm permanent deletion", "تأكيد الحذف النهائي")}>
                      <p className="font-semibold">{text("Permanently delete this project file? This cannot be undone.", "حذف ملف المشروع نهائيًا؟ لا يمكن التراجع.")}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className={btnPrimary} disabled={busy} onClick={() => void remove()}>{text("Yes, delete permanently", "نعم، احذف نهائيًا")}</button>
                        <button type="button" className={btnSecondary} disabled={busy} onClick={() => setPendingDelete(false)}>{text("Keep project", "احتفظ بالمشروع")}</button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

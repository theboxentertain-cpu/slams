import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import {
  PROJECT_NOTE_FIELDS,
  blankProjectDraft,
  validateProjectDraft,
  type ProjectDraft,
} from "@/lib/actor-project-model";
import { useActorProjects, type ActorProject } from "@/lib/use-actor-projects";
import { AuditionCopyPanel } from "./AuditionCopyPanel";

export type WorkFileKind = "character" | "breakdown";
const STRINGS = {
  en: {
    character: "Character File",
    breakdown: "Scene Breakdown",
    choose: "Choose a project",
    intro: "Select one of your own project files to edit. Each project has independent notes.",
    noProjects: "No projects exist yet. Create a project in Actor at Work.",
    noProject: "This project is not available in the signed-in account.",
    loading: "Loading private project files…",
    signIn: "Sign in to work on your private projects.",
    signInLink: "Sign in",
    projects: "Open Projects",
    file: "Project",
    archived: "Archived project",
    saved: "Your changes were saved as a new project revision.",
    failed: "Save failed. Your unsaved notes remain in this editor.",
    loadError: "Could not load your project files. Check the database and try again.",
    retry: "Retry loading",
    save: "Save this file",
    saving: "Saving…",
    noChanges: "No unsaved changes.",
    notSaved: "Unsaved edits are not backed up. Leaving this page discards them.",
    audition: "Bring in existing audition preparation",
    auditionDisclosure:
      "An explicit copy stages fields in this editor only. It never changes or deletes your audition notes.",
    staged: "Source notes staged. Check the text and select Save to create a project revision.",
    toCharacter: "Open Character File",
    toBreakdown: "Open Scene Breakdown",
  },
  ar: {
    character: "ملف الشخصية",
    breakdown: "تحليل المشهد",
    choose: "اختار مشروع",
    intro: "اختار ملف من مشاريعك لتعديله. كل مشروع له ملاحظاته المستقلة.",
    noProjects: "لسه مفيش مشاريع. أنشئ مشروع من قسم شغل الممثل.",
    noProject: "المشروع ده مش متاح في الحساب الحالي.",
    loading: "جاري تحميل ملفات مشاريعك الخاصة…",
    signIn: "سجل دخول علشان تشتغل على ملفاتك الخاصة.",
    signInLink: "تسجيل الدخول",
    projects: "افتح المشاريع",
    file: "مشروع",
    archived: "مشروع مؤرشف",
    saved: "تم حفظ تعديلاتك كنسخة جديدة من المشروع.",
    failed: "فشل الحفظ. ملاحظاتك اللي لسه متحفظتش موجودة في المحرر.",
    loadError: "تعذر تحميل ملفات مشاريعك. راجع قاعدة البيانات وجرب تاني.",
    retry: "حاول التحميل تاني",
    save: "احفظ الملف",
    saving: "جاري الحفظ…",
    noChanges: "مفيش تعديلات غير محفوظة.",
    notSaved: "التعديلات غير المحفوظة مش متخزنة. الخروج من الصفحة هيمسحها.",
    audition: "استورد نسخة من ملاحظات الأوديشن القديمة",
    auditionDisclosure:
      "النسخ الاختياري بيحط الكلام في المحرر بس. مش بيغير أو يمسح ملاحظات الأوديشن الأصلية.",
    staged: "جهزنا الملاحظات في المحرر. راجعها واضغط حفظ علشان تعمل نسخة جديدة.",
    toCharacter: "افتح ملف الشخصية",
    toBreakdown: "افتح تحليل المشهد",
  },
} as const;

function asDraft(p: ActorProject): ProjectDraft {
  return { title: p.title, roleName: p.roleName, notes: { ...p.notes } };
}

/** A concrete workspace, not an automated performance evaluation. */
export function ActorProjectDetail({
  kind,
  projectId,
}: {
  kind: WorkFileKind;
  projectId?: string | undefined;
}) {
  const { locale } = useLanguage();
  const ui = STRINGS[locale];
  const store = useActorProjects();
  const [draft, setDraft] = useState<ProjectDraft>(blankProjectDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const activeKey = `${store.userId ?? ""}:${projectId ?? ""}`;
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;

  const project = store.projects.find((p) => p.id === projectId) ?? null;
  const fields = PROJECT_NOTE_FIELDS.filter((f) => f.group ===
    (kind === "character" ? "Character" : "Breakdown"));
  const changed = !!project && fields.some((field) => draft.notes[field.key] !== project.notes[field.key]);
  const validation = validateProjectDraft(draft);

  useEffect(() => {
    setDraft(project ? asDraft(project) : blankProjectDraft());
    setMessage("");
    setCopyOpen(false);
    setSaving(false);
  }, [store.userId, project?.id, project?.revision]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !changed || validation || saving) return;
    const saveKey = activeKeyRef.current;
    setSaving(true);
    setMessage("");
    const next = asDraft(project);
    for (const field of fields) next.notes[field.key] = draft.notes[field.key];
    try {
      const result = await store.update(project, next);
      if (activeKeyRef.current !== saveKey) return;
      if (result.value) {
        setDraft(asDraft(result.value));
        setMessage(ui.saved);
      } else {
        setMessage(result.error ?? ui.failed);
      }
    } finally {
      if (activeKeyRef.current === saveKey) setSaving(false);
    }
  }

  const destination = kind === "character" ? "/work/character" : "/work/breakdown";
  return (
    <Page
      title={kind === "character" ? ui.character : ui.breakdown}
      eyebrow="Actor at Work"
      backTo="/work"
      world="work"
    >
      <section className="foundation-stack">
        {!store.signedIn ? (
          <div className="panel p-4 foundation-stack">
            <p>{ui.signIn}</p>
            <Link to="/auth" className={btnPrimary}>{ui.signInLink}</Link>
          </div>
        ) : (
          <>
            {!store.loaded && <p role="status">{ui.loading}</p>}
            {store.error && (
              <div role="alert" className="panel p-4 foundation-stack">
                <p>{ui.loadError}</p>
                <button type="button" className={btnSecondary} onClick={() => void store.reload()}>
                  {ui.retry}
                </button>
              </div>
            )}
            {store.loaded && !store.error && !project && (
              <section className="foundation-stack">
                {projectId && <p role="alert">{ui.noProject}</p>}
                <h2>{ui.choose}</h2>
                <p>{ui.intro}</p>
                {store.projects.length === 0 && <p>{ui.noProjects}</p>}
                <ul className="grid gap-2">
                  {store.projects.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={destination}
                        search={{ projectId: item.id }}
                        className={`${btnSecondary} w-full justify-start`}
                      >
                        {item.title} — {item.roleName || "—"}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/work" search={{ tab: "projects" }} className={btnSecondary}>
                  {ui.projects}
                </Link>
              </section>
            )}
            {store.loaded && !store.error && project && (
              <section className="foundation-stack">
                <div className="panel p-4">
                  <h2>{ui.file}: {project.title}</h2>
                  <p>{project.roleName || "—"}</p>
                  {project.status === "archived" && <p>{ui.archived}</p>}
                  <div className="flex flex-wrap gap-3 mt-3">
                    <Link
                      to="/work/character"
                      search={{ projectId: project.id }}
                      className={btnSecondary}
                    >
                      {ui.toCharacter}
                    </Link>
                    <Link
                      to="/work/breakdown"
                      search={{ projectId: project.id }}
                      className={btnSecondary}
                    >
                      {ui.toBreakdown}
                    </Link>
                  </div>
                </div>
                <form className="foundation-stack" onSubmit={(event) => void save(event)}>
                  {fields.map((field) => (
                    <label key={field.key} className="grid gap-2">
                      <span className="font-semibold">{locale === "ar" ? field.ar : field.label}</span>
                      <textarea
                        className="w-full rounded border border-input bg-background p-3"
                        rows={4}
                        maxLength={900}
                        disabled={saving}
                        value={draft.notes[field.key]}
                        onChange={(event) => {
                          setDraft((current) => ({
                            ...current,
                            notes: { ...current.notes, [field.key]: event.target.value },
                          }));
                          setMessage("");
                        }}
                      />
                    </label>
                  ))}
                  <button
                    type="submit"
                    className={btnPrimary}
                    disabled={!changed || !!validation || saving}
                  >
                    {saving ? ui.saving : ui.save}
                  </button>
                  {!changed && <p className="text-sm text-muted-foreground">{ui.noChanges}</p>}
                  {validation && <p role="alert">{validation}</p>}
                </form>
                {kind === "character" && (
                  <section className="foundation-stack">
                    <button
                      type="button"
                      className={btnSecondary}
                      aria-expanded={copyOpen}
                      onClick={() => setCopyOpen(!copyOpen)}
                    >
                      {ui.audition}
                    </button>
                    <p className="text-sm text-muted-foreground">{ui.auditionDisclosure}</p>
                    {copyOpen && (
                      <AuditionCopyPanel
                        draft={draft}
                        onStage={(next) => {
                          setDraft(next);
                          setMessage(ui.staged);
                          setCopyOpen(false);
                        }}
                      />
                    )}
                  </section>
                )}
                {message && <p role="status">{message}</p>}
                <p className="text-sm text-muted-foreground">{ui.notSaved}</p>
                <Link to="/work" search={{ tab: "projects" }} className={btnSecondary}>
                  {ui.projects}
                </Link>
              </section>
            )}
          </>
        )}
      </section>
    </Page>
  );
}

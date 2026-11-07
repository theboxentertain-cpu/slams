import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { useActorProjects } from "@/lib/use-actor-projects";
import { useUnsavedWork } from "@/lib/unsaved-work";
import {
  useActorJournal,
  type ActorJournalEntry,
  type ActorJournalRevision,
} from "@/lib/use-actor-journal";
import {
  blankJournalDraft,
  validateJournalDraft,
  type JournalContext,
  type JournalDraft,
} from "@/lib/actor-journal-model";

const COPY = {
  en: {
    title: "Project Journal",
    choose: "Choose a project",
    intro: "Private notes for each production, audition and rehearsal.",
    signIn: "Sign in to use your private project journal.",
    login: "Sign in",
    projects: "Open Projects",
    loading: "Loading private journal…",
    unavailable: "This project is not available in your account.",
    noProjects: "Create a project before starting its journal.",
    loadError:
      "Private journal storage could not be loaded. Check the database deployment and retry.",
    retry: "Reload saved entries",
    scenes: "Scenes",
    notes: "Notes",
    history: "History",
    empty: "No journal entries yet.",
    new: "New journal entry",
    titleLabel: "Entry title",
    body: "Journal notes",
    save: "Save entry",
    create: "Create entry",
    saving: "Saving…",
    dirty: "Unsaved edits are not backed up. Save before leaving this page.",
    clean: "No unsaved changes.",
    discard: "Discard unsaved changes",
    saved: "Journal entry saved as a new revision.",
    failed:
      "Save was not confirmed. Your draft is still here. Reload saved entries to check for a newer version before retrying.",
    invalid: "Add a title of 120 characters or less and keep notes within 20,000 characters.",
    archived: "Archived",
    archive: "Archive entry",
    restore: "Restore entry",
    historyLoad: "View version history",
    historyFail: "Version history could not be loaded. Your editor has not changed.",
    noHistory: "No saved versions were returned.",
    version: "Version",
    stage: "Load this version into the editor (not saved)",
    staged: "Version loaded into your draft. Save it to create a new revision.",
    historyHelp:
      "History is read only. Loading a version changes your draft; only Save writes a new revision.",
    chooseEntry: "Choose an entry to view its history.",
    project: "Project",
    audition: "Open linked audition",
    rehearsal: "Open linked rehearsal",
    sides: "Open script sides",
    context:
      "This new entry will keep the audition and rehearsal context from this link. The database verifies that they belong to this project and account.",
    latest: "Use latest saved revision; keep my draft",
    latestLoaded: "Latest saved revision selected. Your draft remains; review it before saving.",
    archivedProject: "Archived project",
    selectionHelp: "Save or discard your current edits before choosing another entry.",
  },
  ar: {
    title: "دفتر المشروع",
    choose: "اختار مشروع",
    intro: "ملاحظاتك الخاصة لكل إنتاج وأوديشن وبروفة.",
    signIn: "سجل دخول علشان تستخدم دفتر مشروعك الخاص.",
    login: "تسجيل الدخول",
    projects: "افتح المشاريع",
    loading: "جاري تحميل دفتر المشروع الخاص…",
    unavailable: "المشروع ده مش متاح في حسابك.",
    noProjects: "أنشئ مشروع قبل ما تبدأ دفتره.",
    loadError: "تعذر تحميل دفتر المشروع الخاص. راجع قاعدة البيانات وحاول تاني.",
    retry: "حمّل الملاحظات المحفوظة تاني",
    scenes: "المشاهد",
    notes: "الملاحظات",
    history: "النسخ السابقة",
    empty: "لسه مفيش ملاحظات في الدفتر.",
    new: "ملاحظة جديدة",
    titleLabel: "عنوان الملاحظة",
    body: "ملاحظات الدفتر",
    save: "احفظ الملاحظة",
    create: "أنشئ الملاحظة",
    saving: "جاري الحفظ…",
    dirty: "تعديلاتك غير المحفوظة مش متخزنة. احفظ قبل ما تخرج من الصفحة.",
    clean: "مفيش تعديلات غير محفوظة.",
    discard: "تجاهل التعديلات غير المحفوظة",
    saved: "تم حفظ الملاحظة كنسخة جديدة.",
    failed:
      "الحفظ متأكدش. مسودتك لسه موجودة. حمّل الملاحظات المحفوظة تاني وراجع أحدث نسخة قبل المحاولة.",
    invalid: "اكتب عنوان لا يزيد عن ١٢٠ حرف، وخلي الملاحظات في حدود ٢٠٬٠٠٠ حرف.",
    archived: "مؤرشف",
    archive: "أرشف الملاحظة",
    restore: "استرجع الملاحظة",
    historyLoad: "اعرض النسخ السابقة",
    historyFail: "تعذر تحميل النسخ السابقة. المحرر متغيرش.",
    noHistory: "مفيش نسخ محفوظة ظهرت.",
    version: "نسخة",
    stage: "حمّل النسخة في المحرر (من غير حفظ)",
    staged: "تم تحميل النسخة في المسودة. احفظها علشان تعمل نسخة جديدة.",
    historyHelp:
      "النسخ السابقة للقراءة فقط. تحميل نسخة بيغير المسودة؛ زر الحفظ بس هو اللي بيحفظ نسخة جديدة.",
    chooseEntry: "اختار ملاحظة علشان تعرض نسخها السابقة.",
    project: "المشروع",
    audition: "افتح الأوديشن المرتبط",
    rehearsal: "افتح البروفة المرتبطة",
    sides: "افتح نص المشهد",
    context:
      "الملاحظة الجديدة هتحتفظ بالأوديشن والبروفة من الرابط. قاعدة البيانات بتتأكد إنهم تابعين للمشروع والحساب.",
    latest: "استخدم أحدث نسخة محفوظة واحتفظ بمسودتي",
    latestLoaded: "تم اختيار أحدث نسخة محفوظة. مسودتك موجودة؛ راجعها قبل الحفظ.",
    archivedProject: "مشروع مؤرشف",
    selectionHelp: "احفظ تعديلاتك أو تجاهلها قبل اختيار ملاحظة تانية.",
  },
} as const;
type Props = JournalContext & {
  projectId?: string | undefined;
  tab?: string | undefined;
  onTabChange?: ((tab: string) => void) | undefined;
};
type JournalStore = ReturnType<typeof useActorJournal>;
const draftOf = (entry: ActorJournalEntry): JournalDraft => ({
  title: entry.title,
  body: entry.body,
});

export function ActorJournal({ projectId, ...props }: Props) {
  const { locale } = useLanguage();
  const ui = COPY[locale];
  const projects = useActorProjects();
  const journal = useActorJournal(projectId);
  const project = projects.projects.find((item) => item.id === projectId);
  return (
    <Page title={ui.title} backTo="/work">
      <p className="mb-4 text-muted-foreground">{ui.intro}</p>
      {!projects.loaded ? (
        <p role="status">{ui.loading}</p>
      ) : !projects.signedIn ? (
        <p>
          {ui.signIn}{" "}
          <Link to="/auth" className="underline">
            {ui.login}
          </Link>
        </p>
      ) : !projectId ? (
        <section className="space-y-3">
          <h2 className="font-semibold">{ui.choose}</h2>
          {projects.error && <p role="alert">{ui.loadError}</p>}
          {!projects.error && !projects.projects.length && <p>{ui.noProjects}</p>}
          {projects.error && (
            <button type="button" className={btnSecondary} onClick={() => void projects.reload()}>
              {ui.retry}
            </button>
          )}
          {projects.projects.map((item) => (
            <Link
              key={item.id}
              to="/work/journal"
              search={{ tab: "notes", projectId: item.id }}
              className={`${btnSecondary} me-2 mb-2`}
            >
              <span dir="auto">{item.title}</span>
              {item.status === "archived" && ` · ${ui.archivedProject}`}
            </Link>
          ))}
          <Link to="/work" search={{ tab: "projects" }} className={btnSecondary}>
            {ui.projects}
          </Link>
        </section>
      ) : !project ? (
        <p role="alert">
          {projects.error ? ui.loadError : ui.unavailable}{" "}
          <Link to="/work" search={{ tab: "projects" }} className="underline">
            {ui.projects}
          </Link>
        </p>
      ) : (
        <JournalWorkspace
          key={`${journal.userId}:${projectId}:${props.auditionId ?? ""}:${props.rehearsalId ?? ""}`}
          {...props}
          projectId={projectId}
          projectTitle={project.title}
          store={journal}
        />
      )}
    </Page>
  );
}

function JournalWorkspace({
  projectId,
  projectTitle,
  tab = "notes",
  onTabChange,
  auditionId,
  rehearsalId,
  store,
}: Props & { projectId: string; projectTitle: string; store: JournalStore }) {
  const { locale } = useLanguage();
  const ui = COPY[locale];
  const [currentTab, setTab] = useState(tab);
  const [selected, setSelected] = useState<ActorJournalEntry | null>(null);
  const [draft, setDraft] = useState<JournalDraft>(blankJournalDraft);
  const [history, setHistory] = useState<ActorJournalRevision[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const creationId = useRef(crypto.randomUUID());
  const mounted = useRef(true);
  useEffect(() => {
    setTab(tab);
  }, [tab]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const dirty = draft.title !== (selected?.title ?? "") || draft.body !== (selected?.body ?? "");
  useUnsavedWork(dirty);
  const invalid = validateJournalDraft(draft);
  const latest = selected ? store.entries.find((entry) => entry.id === selected.id) : undefined;

  function open(entry: ActorJournalEntry | null) {
    if (dirty || busy) return;
    setSelected(entry);
    setDraft(entry ? draftOf(entry) : blankJournalDraft());
    setHistory(null);
    setMessage("");
    setFailed(false);
    creationId.current = crypto.randomUUID();
  }
  async function save(event?: FormEvent<HTMLFormElement>, status = selected?.status ?? "active") {
    event?.preventDefault();
    if (busy || !store.loaded || invalid || (!dirty && status === selected?.status)) return;
    setBusy(true);
    setMessage("");
    const result = selected
      ? await store.update(selected, draft, status)
      : await store.create(draft, { auditionId, rehearsalId }, creationId.current);
    if (!mounted.current) return;
    setBusy(false);
    setFailed(!!result.error);
    if (result.error !== undefined) {
      setMessage(ui.failed);
      return;
    }
    setSelected(result.value);
    setDraft(draftOf(result.value));
    setHistory(null);
    setMessage(ui.saved);
    creationId.current = crypto.randomUUID();
  }
  async function showHistory() {
    if (!selected || busy) return;
    setBusy(true);
    const result = await store.loadHistory(selected);
    if (!mounted.current) return;
    setBusy(false);
    setFailed(!!result.error);
    if (result.error !== undefined) {
      setMessage(ui.historyFail);
      return;
    }
    setHistory(result.value);
    setTab("history");
    onTabChange?.("history");
    setMessage("");
  }
  const contextAudition = selected ? selected.auditionId : auditionId;
  const contextRehearsal = selected ? selected.rehearsalId : rehearsalId;
  return (
    <div className="space-y-5">
      <p>
        {ui.project}: <strong dir="auto">{projectTitle}</strong>
      </p>
      <div role="tablist" aria-label={ui.title} className="flex flex-wrap gap-2">
        {(["scenes", "notes", "history"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={currentTab === value}
            className={btnSecondary}
            onClick={() => {
              setTab(value);
              onTabChange?.(value);
            }}
          >
            {ui[value]}
          </button>
        ))}
      </div>
      {currentTab === "scenes" && (
        <nav aria-label={ui.scenes} className="flex flex-wrap gap-2">
          <Link to="/work/sides" search={{ projectId }} className={btnSecondary}>
            {ui.sides}
          </Link>
          {contextAudition && (
            <Link
              to="/work"
              search={{ tab: "auditions", auditionId: contextAudition }}
              className={btnSecondary}
            >
              {ui.audition}
            </Link>
          )}
          {contextRehearsal && (
            <Link to="/rehearsal" search={{ sessionId: contextRehearsal }} className={btnSecondary}>
              {ui.rehearsal}
            </Link>
          )}
        </nav>
      )}
      {!store.loaded && <p role="status">{ui.loading}</p>}
      {store.error && <p role="alert">{ui.loadError}</p>}
      <button
        type="button"
        className={btnSecondary}
        onClick={() => void store.reload()}
        disabled={busy}
      >
        {ui.retry}
      </button>
      <section className="flex flex-wrap gap-2" aria-label={ui.notes}>
        <button
          type="button"
          className={btnSecondary}
          disabled={dirty || busy}
          onClick={() => open(null)}
        >
          {ui.new}
        </button>
        {store.loaded && !store.error && !store.entries.length && <p>{ui.empty}</p>}
        {store.entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={selected?.id === entry.id}
            className={btnSecondary}
            disabled={dirty || busy}
            onClick={() => open(entry)}
          >
            <span dir="auto">{entry.title}</span>
            {entry.status === "archived" && ` · ${ui.archived}`}
          </button>
        ))}
      </section>
      {dirty && <p className="text-sm text-muted-foreground">{ui.selectionHelp}</p>}
      {currentTab === "history" && (
        <section className="space-y-3" aria-label={ui.history}>
          <p>{ui.historyHelp}</p>
          {!selected ? (
            <p>{ui.chooseEntry}</p>
          ) : (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => void showHistory()}
              disabled={busy}
            >
              {ui.historyLoad}
            </button>
          )}
          {history?.length === 0 && <p>{ui.noHistory}</p>}
          {history?.map((version) => (
            <details key={version.revision} className="rounded-xl border p-3">
              <summary>
                {ui.version} {version.revision} · <span dir="auto">{version.title}</span>
              </summary>
              <p dir="auto" className="my-3 whitespace-pre-wrap">
                {version.body}
              </p>
              <button
                type="button"
                className={btnSecondary}
                disabled={busy || dirty}
                onClick={() => {
                  setDraft({ title: version.title, body: version.body });
                  setMessage(ui.staged);
                  setFailed(false);
                }}
              >
                {ui.stage}
              </button>
            </details>
          ))}
        </section>
      )}
      <form onSubmit={(event) => void save(event)} className="space-y-4">
        {!selected && (auditionId || rehearsalId) && (
          <p className="text-sm text-muted-foreground">{ui.context}</p>
        )}
        {selected?.status === "archived" && <p>{ui.archived}</p>}
        <label className="block">
          {ui.titleLabel}
          <input
            dir="auto"
            className="mt-1 w-full rounded-lg border bg-background p-3"
            value={draft.title}
            maxLength={120}
            disabled={busy}
            onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
          />
        </label>
        <label className="block">
          {ui.body}
          <textarea
            dir="auto"
            className="mt-1 min-h-56 w-full rounded-lg border bg-background p-3"
            value={draft.body}
            maxLength={20000}
            disabled={busy}
            onChange={(event) => setDraft((d) => ({ ...d, body: event.target.value }))}
          />
        </label>
        <p className="text-sm text-muted-foreground">{dirty ? ui.dirty : ui.clean}</p>
        {dirty && invalid && <p role="alert">{ui.invalid}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className={btnPrimary}
            disabled={busy || !store.loaded || !dirty || !!invalid}
          >
            {busy ? ui.saving : selected ? ui.save : ui.create}
          </button>
          {dirty && (
            <button
              type="button"
              className={btnSecondary}
              disabled={busy}
              onClick={() => {
                setDraft(selected ? draftOf(selected) : blankJournalDraft());
                setMessage("");
                setFailed(false);
              }}
            >
              {ui.discard}
            </button>
          )}
          {selected && (
            <button
              type="button"
              className={btnSecondary}
              disabled={busy || !store.loaded || dirty}
              onClick={() =>
                void save(undefined, selected.status === "active" ? "archived" : "active")
              }
            >
              {selected.status === "active" ? ui.archive : ui.restore}
            </button>
          )}
          {selected && currentTab !== "history" && (
            <button
              type="button"
              className={btnSecondary}
              disabled={busy}
              onClick={() => void showHistory()}
            >
              {ui.historyLoad}
            </button>
          )}
          {selected && latest && latest.revision > selected.revision && (
            <button
              type="button"
              className={btnSecondary}
              disabled={busy}
              onClick={() => {
                setSelected(latest);
                setMessage(ui.latestLoaded);
                setFailed(false);
              }}
            >
              {ui.latest}
            </button>
          )}
        </div>
      </form>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
    </div>
  );
}

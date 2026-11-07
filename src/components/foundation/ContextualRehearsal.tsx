import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { useActorProjects } from "@/lib/use-actor-projects";
import { useActorAuditions } from "@/lib/use-actor-auditions";
import { useActorSides, type ActorSide } from "@/lib/use-actor-sides";
import { useActorRehearsals, sideMatchesScene } from "@/lib/use-actor-rehearsals";
import { useUnsavedWork } from "@/lib/unsaved-work";
import {
  validateRehearsalDraft,
  validateSceneDraft,
  type ActorWorkRehearsal,
  type RehearsalDraft,
  type RehearsalSearch,
  type SceneDraft,
} from "@/lib/actor-rehearsal-model";

const COPY = {
  en: {
    title: "Your working scenes",
    intro:
      "Rehearse your own saved text. Choose an action, perform it yourself and write what you observed. No recording or automatic assessment takes place.",
    guest: "Sign in to save and resume private scenes and rehearsals.",
    login: "Sign in",
    loading: "Loading private work…",
    error: "Private work is unavailable. Check the database installation and retry.",
    retry: "Retry loading",
    missing:
      "This scene, source version or session is not available in your account or does not match this context.",
    choose: "Choose a project or audition",
    project: "Project",
    audition: "Audition",
    empty: "Create a project or audition in Actor at Work first.",
    work: "Actor at Work",
    sides: "Add or open script sources",
    noSides:
      "This file has no script sources yet. Add and confirm a source before creating a scene.",
    source: "Script source",
    version: "Source version",
    scenes: "Saved scenes",
    noScenes: "No saved scenes in this context yet.",
    newScene: "New scene from this source",
    sceneTitle: "Scene title",
    objective: "What do you want from the other person?",
    circumstances: "Given circumstances",
    saveScene: "Save scene",
    start: "Start a new rehearsal",
    history: "Private rehearsal history",
    noHistory: "No saved rehearsal drafts or completed sessions yet.",
    resume: "Resume draft",
    review: "Review completed rehearsal",
    draft: "Draft",
    completed: "Completed · read only",
    back: "Return to originating work",
    journal: "Write a linked journal entry",
    prepare: "Prepare",
    take: "Take",
    direction: "Direction and retake",
    reflect: "Reflect",
    action: "Playable action for this take",
    observed: "What did you observe?",
    directionNote: "Direction to try next",
    next: "Add another take",
    first: "Begin first take",
    noTakes:
      "Begin a take when you are ready. Perform the text yourself, then record your observations below.",
    takeNumber: "Take",
    removeEmpty: "Remove empty take",
    prompts: "Authored direction prompts",
    promptIntro:
      "Choose a prompt as an experiment. It is a suggestion, not an assessment of your work.",
    directions: [
      "Keep the objective. Change the action you use to reach the other person.",
      "Let the next line answer something specific you heard or imagined.",
      "Try less effort. Notice what changes when you allow a pause.",
    ],
    reflection: "Your reflection: what changed and what will you try next?",
    save: "Save cloud draft",
    finish: "Complete rehearsal",
    saved: "Saved and confirmed in your account.",
    finished: "Rehearsal completed and confirmed. This record is now read only.",
    saving: "Saving…",
    failed:
      "Save was not confirmed. Your unsaved notes remain here. Check your connection or open another tab to inspect a newer revision.",
    unsaved: "Unsaved changes are not backed up. Save before leaving this page.",
    completeRule:
      "Completion requires at least two takes, each with an action and observed notes, plus a reflection of at least three characters.",
    preparation: "Pinned preparation",
    immutable:
      "This rehearsal keeps the original source version and preparation, even when you add a newer script source.",
    savedRevision: "Saved revision",
    selectScene: "Open scene",
  },
  ar: {
    title: "مشاهد شغلك",
    intro:
      "اتمرن على نصك المحفوظ. اختار فعل وجرّبه بنفسك واكتب اللي لاحظته. مفيش تسجيل أو تقييم آلي.",
    guest: "سجل دخول علشان تحفظ مشاهدك وبروفاتك الخاصة وترجع تكملها.",
    login: "تسجيل الدخول",
    loading: "جاري تحميل شغلك الخاص…",
    error: "مش قادرين نحمّل الشغل الخاص. راجع تثبيت قاعدة البيانات وجرب تاني.",
    retry: "أعد التحميل",
    missing: "المشهد أو نسخة النص أو البروفة مش متاحة في حسابك أو مش مرتبطة بالملف ده.",
    choose: "اختار مشروع أو أوديشن",
    project: "مشروع",
    audition: "أوديشن",
    empty: "اعمل مشروع أو أوديشن في شغل الممثل الأول.",
    work: "شغل الممثل",
    sides: "ضيف أو افتح مصادر النص",
    noSides: "الملف ده لسه مفيهوش نصوص. ضيف وراجع مصدر قبل إنشاء مشهد.",
    source: "مصدر النص",
    version: "نسخة المصدر",
    scenes: "المشاهد المحفوظة",
    noScenes: "لسه مفيش مشاهد محفوظة في الملف ده.",
    newScene: "مشهد جديد من المصدر ده",
    sceneTitle: "عنوان المشهد",
    objective: "عايز إيه من الشخص التاني؟",
    circumstances: "الظروف المعطاة",
    saveScene: "احفظ المشهد",
    start: "ابدأ بروفة جديدة",
    history: "تاريخ بروفاتك الخاصة",
    noHistory: "لسه مفيش مسودات بروفات أو جلسات مكتملة محفوظة.",
    resume: "كمل المسودة",
    review: "راجع البروفة المكتملة",
    draft: "مسودة",
    completed: "مكتملة · للقراءة بس",
    back: "ارجع لملف الشغل الأصلي",
    journal: "اكتب ملاحظة مرتبطة في اليوميات",
    prepare: "التحضير",
    take: "المحاولة",
    direction: "التوجيه وإعادة المحاولة",
    reflect: "التأمل",
    action: "الفعل القابل للعب في المحاولة دي",
    observed: "لاحظت إيه؟",
    directionNote: "توجيه تجربه بعد كده",
    next: "ضيف محاولة تانية",
    first: "ابدأ أول محاولة",
    noTakes: "ابدأ لما تكون جاهز. أدّي النص بنفسك، وبعدها اكتب ملاحظاتك هنا.",
    takeNumber: "محاولة",
    removeEmpty: "احذف المحاولة الفاضية",
    prompts: "اقتراحات توجيه مكتوبة",
    promptIntro: "اختار اقتراح كتجربة. ده اقتراح، مش تقييم لشغلك.",
    directions: [
      "خليك مع الهدف. غيّر الفعل اللي بتستخدمه للوصول للشخص التاني.",
      "خلي الجملة الجاية ترد على حاجة محددة سمعتها أو تخيلتها.",
      "جرّب مجهود أقل. لاحظ إيه اللي بيتغير لما تسمح بسكتة.",
    ],
    reflection: "تأملك: إيه اللي اتغير وإيه اللي هتجربه بعد كده؟",
    save: "احفظ المسودة في حسابك",
    finish: "كمّل البروفة واحفظها",
    saved: "اتأكد حفظ المسودة في حسابك.",
    finished: "اتأكد حفظ البروفة المكتملة. السجل دلوقتي للقراءة بس.",
    saving: "جاري الحفظ…",
    failed:
      "الحفظ لم يتأكد. ملاحظاتك غير المحفوظة لسه هنا. راجع الاتصال أو افتح تبويب تاني لمراجعة نسخة أحدث.",
    unsaved: "التغييرات غير المحفوظة مش متخزنة. احفظ قبل ما تخرج من الصفحة.",
    completeRule:
      "الإكمال محتاج محاولتين على الأقل، كل واحدة فيها فعل وملاحظاتك، وبعدها تأمل من ٣ حروف على الأقل.",
    preparation: "التحضير المثبت",
    immutable: "البروفة بتحتفظ بنسخة النص والتحضير الأصليين حتى لو ضفت مصدر نص أحدث.",
    savedRevision: "النسخة المحفوظة",
    selectScene: "افتح المشهد",
  },
} as const;
type UI = (typeof COPY)[keyof typeof COPY];
type Navigate = (next: Partial<RehearsalSearch>) => void;
const fieldClass = "w-full min-h-12 rounded border border-input bg-background p-3";

export function WorkContextReturn({
  context,
  label,
}: {
  context: ActorWorkRehearsal["context"];
  label: string;
}) {
  if (context.return_to === "audition" && context.audition_id)
    return (
      <Link
        to="/work"
        search={{ tab: "auditions", auditionId: context.audition_id }}
        className={btnSecondary}
      >
        {label}
      </Link>
    );
  if (
    context.project_id &&
    (context.return_to === "character" || context.return_to === "breakdown")
  )
    return (
      <Link
        to={context.return_to === "character" ? "/work/character" : "/work/breakdown"}
        search={{ projectId: context.project_id }}
        className={btnSecondary}
      >
        {label}
      </Link>
    );
  return (
    <Link
      to="/work"
      search={{
        tab: context.project_id ? "projects" : "auditions",
        projectId: context.project_id ?? undefined,
        auditionId: context.audition_id ?? undefined,
      }}
      className={btnSecondary}
    >
      {label}
    </Link>
  );
}

export function ContextualRehearsal({
  search,
  onNavigate,
}: {
  search: RehearsalSearch;
  onNavigate: Navigate;
}) {
  const { locale } = useLanguage();
  const ui = COPY[locale];
  const store = useActorRehearsals();
  const projects = useActorProjects();
  const auditions = useActorAuditions();
  const sides = useActorSides();
  const session = store.sessions.find((item) => item.id === search.sessionId);
  const scene = store.scenes.find((item) => item.id === (session?.sceneId ?? search.sceneId));
  const source = sides.sides.find(
    (item) => item.id === (session?.sideId ?? scene?.sideId ?? search.sideId),
  );
  const auditionId = session
    ? session.context.audition_id
    : scene
      ? scene.auditionId
      : (search.auditionId ?? (source?.target.kind === "audition" ? source.target.id : null));
  const audition = auditions.records.find((item) => item.id === auditionId);
  const projectId = session
    ? session.context.project_id
    : scene
      ? scene.projectId
      : (search.projectId ??
        audition?.projectId ??
        (source?.target.kind === "project" ? source.target.id : null));
  const project = projects.projects.find((item) => item.id === projectId);
  const matchingSides = sides.sides.filter((side) =>
    side.target.kind === "audition" ? side.target.id === auditionId : side.target.id === projectId,
  );
  const matchingScenes = store.scenes.filter(
    (item) =>
      (!projectId || item.projectId === projectId) &&
      (!auditionId || item.auditionId === auditionId) &&
      (!source || item.sideId === source.id),
  );
  const matchingSessions = store.sessions.filter(
    (item) =>
      (!projectId || item.context.project_id === projectId) &&
      (!auditionId || item.context.audition_id === auditionId),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = `${store.userId ?? ""}:${search.projectId ?? ""}:${search.auditionId ?? ""}:${search.sideId ?? ""}:${search.sceneId ?? ""}:${search.sessionId ?? ""}`;
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    setBusy(false);
    setMessage("");
  }, [active]);
  const loaded = store.loaded && projects.loaded && auditions.loaded && sides.loaded;
  const error = store.error || projects.error || auditions.error || sides.error;
  const invalid = !!(
    (search.sessionId && !session) ||
    (search.sceneId && (!scene || scene.id !== search.sceneId)) ||
    (search.projectId && (!project || search.projectId !== projectId)) ||
    (search.auditionId && (!audition || search.auditionId !== auditionId)) ||
    (projectId && !project) ||
    (auditionId && !audition) ||
    (!session && !scene && projectId && audition && audition.projectId !== projectId) ||
    (search.sideId && (!source || source.id !== search.sideId)) ||
    (source && !matchingSides.some((side) => side.id === source.id)) ||
    (scene && (!source || !sideMatchesScene(source, scene)))
  );
  const returnTo =
    session?.context.return_to ?? search.returnTo ?? (auditionId ? "audition" : "project");
  async function start() {
    if (!scene || !source || busy) return;
    const token = activeRef.current;
    setBusy(true);
    setMessage("");
    const result = await store.start(scene, source, returnTo);
    if (activeRef.current !== token) return;
    setBusy(false);
    if (result.value) onNavigate({ sessionId: result.value.id });
    else setMessage(ui.failed);
  }
  if (!store.signedIn)
    return (
      <section className="foundation-stack">
        <p>{ui.guest}</p>
        <Link to="/auth" className={btnPrimary}>
          {ui.login}
        </Link>
      </section>
    );
  if (!loaded) return <p role="status">{ui.loading}</p>;
  if (error)
    return (
      <section role="alert" className="foundation-stack">
        <p>{ui.error}</p>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => {
            void store.reload();
            void projects.reload();
            void auditions.reload();
            void sides.reload();
          }}
        >
          {ui.retry}
        </button>
      </section>
    );
  if (invalid)
    return (
      <section className="foundation-stack">
        <p role="alert">{ui.missing}</p>
        <Link to="/work" className={btnSecondary}>
          {ui.work}
        </Link>
      </section>
    );
  if (session && source)
    return (
      <SessionEditor
        key={`${store.userId}:${session.id}`}
        session={session}
        side={source}
        save={store.save}
        ui={ui}
      />
    );
  return (
    <section className="foundation-stack" aria-label={ui.title}>
      <h2>{ui.title}</h2>
      <p>{ui.intro}</p>
      {!projectId && !auditionId ? (
        <section className="foundation-stack">
          <h3>{ui.choose}</h3>
          {projects.projects.length + auditions.records.length === 0 && <p>{ui.empty}</p>}
          <ul className="grid gap-2">
            {projects.projects.map((item) => (
              <li key={item.id}>
                <Link
                  to="/rehearsal"
                  search={{ projectId: item.id, returnTo: "project" }}
                  className={btnSecondary}
                >
                  {ui.project}: {item.title}
                </Link>
              </li>
            ))}
            {auditions.records.map((item) => (
              <li key={item.id}>
                <Link
                  to="/rehearsal"
                  search={{ auditionId: item.id, returnTo: "audition" }}
                  className={btnSecondary}
                >
                  {ui.audition}: {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <h3 className="font-semibold">{audition?.title ?? project?.title}</h3>
          <WorkContextReturn
            context={{
              project_id: projectId,
              audition_id: auditionId,
              return_to: returnTo,
              source_version: 1,
              source_kind: "legacy_text",
              source_title: "",
              scene_title: "",
              objective: "",
              circumstances: "",
            }}
            label={ui.back}
          />
          <Link to="/work/sides" className="underline">
            {ui.sides}
          </Link>
          {matchingSides.length === 0 && <p>{ui.noSides}</p>}
          <ul className="grid gap-2">
            {matchingSides.map((side) => (
              <li key={side.id}>
                <Link
                  to="/rehearsal"
                  search={{
                    projectId: projectId ?? undefined,
                    auditionId: auditionId ?? undefined,
                    sideId: side.id,
                    returnTo,
                  }}
                  className={btnSecondary}
                >
                  {ui.source}: {side.title} · {ui.version} {side.sourceVersion ?? 1}
                </Link>
              </li>
            ))}
          </ul>
          {source && (
            <>
              <ScriptSource side={source} ui={ui} />
              {scene ? (
                <section className="panel p-4 foundation-stack">
                  <h3>{scene.title}</h3>
                  <p dir="auto" className="whitespace-pre-wrap">
                    {scene.objective}
                  </p>
                  <p dir="auto" className="whitespace-pre-wrap">
                    {scene.circumstances}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    className={btnPrimary}
                    onClick={() => void start()}
                  >
                    {busy ? ui.saving : ui.start}
                  </button>
                </section>
              ) : (
                <SceneCreator
                  key={`${active}:${source.id}`}
                  ui={ui}
                  create={async (draft, markSaved) => {
                    const token = activeRef.current;
                    const result = await store.createScene(draft, source, projectId, auditionId);
                    if (activeRef.current !== token) return false;
                    if (result.value) {
                      markSaved();
                      onNavigate({ sceneId: result.value.id, returnTo });
                    }
                    return !!result.value;
                  }}
                />
              )}
            </>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
      <h3>{ui.scenes}</h3>
      {matchingScenes.length === 0 && <p>{ui.noScenes}</p>}
      <ul className="grid gap-2">
        {matchingScenes.map((item) => (
          <li key={item.id}>
            <Link
              to="/rehearsal"
              search={{
                sceneId: item.id,
                returnTo:
                  projectId || auditionId ? returnTo : item.auditionId ? "audition" : "project",
              }}
              className={btnSecondary}
            >
              {ui.selectScene}: {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <h3>{ui.history}</h3>
      {matchingSessions.length === 0 && <p>{ui.noHistory}</p>}
      <ul className="grid gap-2">
        {matchingSessions.map((item) => (
          <li key={item.id}>
            <Link
              to="/rehearsal"
              search={{ sessionId: item.id }}
              className={`${btnSecondary} flex-wrap justify-start text-start`}
            >
              {item.context.scene_title} · {ui.version} {item.context.source_version} ·{" "}
              {item.status === "draft" ? ui.resume : ui.review}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
function ScriptSource({
  side,
  ui,
  expanded = false,
}: {
  side: ActorSide;
  ui: UI;
  expanded?: boolean;
}) {
  return (
    <details className="planned-tools" open={expanded}>
      <summary>
        {ui.source}: {side.title} · {ui.version} {side.sourceVersion ?? 1}
      </summary>
      <pre
        dir="auto"
        className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm"
      >
        {side.content}
      </pre>
    </details>
  );
}
function SceneCreator({
  ui,
  create,
}: {
  ui: UI;
  create: (draft: SceneDraft, markSaved: () => void) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<SceneDraft>({ title: "", objective: "", circumstances: "" });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const markSaved = useUnsavedWork(!!(draft.title || draft.objective || draft.circumstances));
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || validateSceneDraft(draft)) return;
    setBusy(true);
    const ok = await create(draft, markSaved);
    if (mounted.current) {
      setBusy(false);
      setFailed(!ok);
    }
  }
  return (
    <form className="panel p-4 foundation-stack" onSubmit={(event) => void submit(event)}>
      <h3>{ui.newScene}</h3>
      {(["title", "objective", "circumstances"] as const).map((key) => (
        <label className="grid gap-2" key={key}>
          {key === "title" ? ui.sceneTitle : ui[key]}
          <textarea
            dir="auto"
            className={fieldClass}
            rows={key === "title" ? 1 : 3}
            maxLength={key === "title" ? 120 : 1500}
            required={key === "title"}
            disabled={busy}
            value={draft[key]}
            onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
          />
        </label>
      ))}
      <button type="submit" className={btnPrimary} disabled={busy || !!validateSceneDraft(draft)}>
        {busy ? ui.saving : ui.saveScene}
      </button>
      {failed && <p role="alert">{ui.failed}</p>}
      <p className="text-sm text-muted-foreground">{ui.unsaved}</p>
    </form>
  );
}

function SessionEditor({
  session,
  side,
  save,
  ui,
}: {
  session: ActorWorkRehearsal;
  side: ActorSide;
  save: ReturnType<typeof useActorRehearsals>["save"];
  ui: UI;
}) {
  const [draft, setDraft] = useState<RehearsalDraft>({
    phase: session.phase,
    takes: session.takes.map((take) => ({ ...take })),
    reflection: session.reflection,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const readOnly = session.status === "completed";
  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify({ phase: session.phase, takes: session.takes, reflection: session.reflection });
  const incomplete = !!validateRehearsalDraft(draft, true);
  const markSaved = useUnsavedWork(!readOnly && dirty);
  function update(next: RehearsalDraft) {
    setDraft(next);
    setMessage("");
  }
  function addTake() {
    if (draft.takes.length >= 12) return;
    update({
      ...draft,
      phase: "take",
      takes: [
        ...draft.takes,
        { id: crypto.randomUUID(), action: "", observation: "", direction: "" },
      ],
    });
  }
  async function persist(complete: boolean) {
    if (busy || readOnly || (complete && incomplete)) return;
    setBusy(true);
    setMessage("");
    const result = await save(session, draft, complete);
    if (!alive.current) return;
    if (result.value) markSaved();
    setBusy(false);
    setMessage(result.value ? (complete ? ui.finished : ui.saved) : ui.failed);
  }
  return (
    <section className="foundation-stack" aria-label={session.context.scene_title}>
      <h2>{session.context.scene_title}</h2>
      <p>
        {readOnly ? ui.completed : ui.draft} · {ui.savedRevision} {session.revision}
      </p>
      <p>
        {ui.version} {session.context.source_version} · {session.context.source_title}
      </p>
      <p className="text-sm text-muted-foreground">{ui.immutable}</p>
      <WorkContextReturn context={session.context} label={ui.back} />
      {session.context.project_id && (
        <Link
          to="/work/journal"
          search={{
            projectId: session.context.project_id ?? undefined,
            auditionId: session.context.audition_id ?? undefined,
            rehearsalId: session.id,
          }}
          className="underline"
        >
          {ui.journal}
        </Link>
      )}
      <details className="planned-tools" open>
        <summary>{ui.preparation}</summary>
        <p dir="auto" className="whitespace-pre-wrap">
          {session.context.objective}
        </p>
        <p dir="auto" className="whitespace-pre-wrap">
          {session.context.circumstances}
        </p>
      </details>
      <ScriptSource side={side} ui={ui} expanded />
      {!readOnly && (
        <nav className="flex flex-wrap gap-2" aria-label={ui.title}>
          {(["prepare", "take", "direction", "reflect"] as const).map((phase) => (
            <button
              key={phase}
              type="button"
              disabled={busy}
              className={btnSecondary}
              aria-pressed={draft.phase === phase}
              onClick={() => update({ ...draft, phase })}
            >
              {ui[phase]}
            </button>
          ))}
        </nav>
      )}
      {draft.takes.length === 0 && <p>{ui.noTakes}</p>}
      {draft.takes.map((take, index) => (
        <fieldset className="panel p-4 foundation-stack" key={take.id} disabled={busy || readOnly}>
          <legend>
            {ui.takeNumber} {index + 1}
          </legend>
          {(["action", "observation", "direction"] as const).map((key) => (
            <label key={key} className="grid gap-2">
              {key === "action"
                ? ui.action
                : key === "observation"
                  ? ui.observed
                  : ui.directionNote}
              <textarea
                dir="auto"
                className={fieldClass}
                rows={3}
                maxLength={1500}
                readOnly={readOnly}
                value={take[key]}
                onChange={(event) =>
                  update({
                    ...draft,
                    takes: draft.takes.map((item) =>
                      item.id === take.id ? { ...item, [key]: event.target.value } : item,
                    ),
                  })
                }
              />
            </label>
          ))}
          {!readOnly && !take.action && !take.observation && !take.direction && (
            <button
              type="button"
              className={btnSecondary}
              onClick={() =>
                update({ ...draft, takes: draft.takes.filter((item) => item.id !== take.id) })
              }
            >
              {ui.removeEmpty}
            </button>
          )}
        </fieldset>
      ))}
      {!readOnly && (
        <>
          <button
            type="button"
            className={btnSecondary}
            disabled={busy || draft.takes.length >= 12}
            onClick={addTake}
          >
            {draft.takes.length ? ui.next : ui.first}
          </button>
          {draft.phase === "direction" && (
            <section className="planned-tools foundation-stack">
              <h3>{ui.prompts}</h3>
              <p>{ui.promptIntro}</p>
              {ui.directions.map((prompt) => (
                <p key={prompt}>{prompt}</p>
              ))}
            </section>
          )}
        </>
      )}
      <label className="grid gap-2">
        {ui.reflection}
        <textarea
          dir="auto"
          className={fieldClass}
          rows={4}
          maxLength={3000}
          disabled={busy}
          readOnly={readOnly}
          value={draft.reflection}
          onChange={(event) =>
            update({ ...draft, phase: "reflect", reflection: event.target.value })
          }
        />
      </label>
      {!readOnly && (
        <>
          <p className="text-sm text-muted-foreground">{ui.completeRule}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary}
              disabled={busy || !dirty}
              onClick={() => void persist(false)}
            >
              {busy ? ui.saving : ui.save}
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={busy || incomplete}
              onClick={() => void persist(true)}
            >
              {ui.finish}
            </button>
          </div>
          {dirty && (
            <p role="status" className="text-sm text-amber">
              {ui.unsaved}
            </p>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

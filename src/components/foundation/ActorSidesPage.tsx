import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { useUnsavedWork } from "@/lib/unsaved-work";
import { useActorProjects } from "@/lib/use-actor-projects";
import { useActorAuditions } from "@/lib/use-actor-auditions";
import { useActorSides, type ActorSide } from "@/lib/use-actor-sides";
import {
  anchoredExcerpt,
  blankSideDraft,
  sideLines,
  validateSideAnnotations,
  validateSideDraft,
  type SideAnnotation,
  type SideDraft,
  type SideTarget,
} from "@/lib/actor-sides-model";
import { prepareScriptSource, type PreparedScriptSource } from "@/lib/actor-script-import";

const UI = {
  en: {
    heading: "Script Sides & Beats",
    intro:
      "Create a private text snapshot for one project or audition. Mark exact lines with actor-authored beat, objective and tactic notes.",
    signIn: "Sign in to save private script sides.",
    signInLink: "Sign in",
    loading: "Loading script sides…",
    unavailable: "The secured script-side database is not available. No script was saved.",
    retry: "Retry",
    new: "New side",
    empty: "No imported sides yet.",
    close: "Close editor",
    title: "Side title",
    parent: "Attach to one of your projects or auditions",
    parentNone: "Choose a project or audition",
    ownTargets: "No accessible projects or auditions. Create one before importing sides.",
    unavailableParents: "Parent records are unavailable; linking or saving is blocked.",
    project: "Project",
    audition: "Audition",
    script: "Paste original side text",
    file: "Or load a UTF-8 TXT, PDF or DOCX file from this device",
    fileInvalid: "Choose a TXT, PDF or DOCX document up to 10 MB.",
    fileFailed:
      "This document could not be read. Nothing was uploaded. Paste the original text instead.",
    reading: "Reading the document on this device…",
    approve: "I reviewed this text preview and approve saving this source version",
    preview:
      "Review extracted text before saving. PDF and DOCX layout may change; check names, line order and punctuation.",
    sourceVersion: "Source version",
    newVersion: "New source version",
    versionWarning:
      "This creates a separate immutable source version with no beat notes. Older versions and their line anchors stay unchanged. Review every changed line before saving.",
    history: "Source version history",
    excerpt: "Choose source lines for this side (the full original file is retained)",
    excerptFrom: "First source line",
    excerptTo: "Last source line",
    useExcerpt: "Use these source lines",
    rehearse: "Rehearse this source version",
    privacy:
      "The file is read in this device. It is sent to your account only when you select Save side.",
    limits:
      "Maximum 25,000 characters / 60 KB and 400 lines. Source text is frozen after save so line anchors remain accurate. Use New source version to revise it.",
    save: "Save side",
    saving: "Saving…",
    saved: "Script side confirmed saved to your account.",
    scriptView: "Original script — immutable snapshot",
    lines: "lines",
    annotate: "Create a line-anchored beat",
    start: "From line",
    end: "To line",
    selected: "Original lines selected",
    beat: "Beat / change",
    objective: "Actor's playable objective (interpretation)",
    tactic: "Tactic / action (interpretation)",
    add: "Stage beat",
    remove: "Remove staged beat",
    changes: "Unsaved beat annotations",
    commit: "Save beat annotations",
    noChanges: "No unsaved annotation changes.",
    noteSaved: "Beat annotations saved as a new revision.",
    noNotes: "No beats marked. Select lines and stage your first beat.",
    revision: "Revision",
    caution:
      "The selected text is script evidence. Your beat, objective and tactic are your interpretation — not an AI diagnosis.",
    unsaved:
      "Unsaved imports and beat edits are not backed up. Leaving or switching files discards them.",
    discard: "Discard the unsaved source preview or beat edits?",
    back: "Actor at Work",
  },
  ar: {
    heading: "النصوص وتحليل الوحدات",
    intro:
      "احفظ نسخة نصية خاصة لمشروع أو أوديشن. علّم سطور بعينها وسجّل الوحدات والأهداف والتكتيكات بنفسك.",
    signIn: "سجّل دخول علشان تحفظ النصوص بشكل خاص في حسابك.",
    signInLink: "تسجيل الدخول",
    loading: "جاري تحميل النصوص…",
    unavailable: "قاعدة بيانات النصوص المؤمنة مش متاحة. مفيش نص اتحفظ.",
    retry: "حاول تاني",
    new: "نص جديد",
    empty: "مفيش نصوص مستوردة لسه.",
    close: "اقفل المحرر",
    title: "عنوان النص",
    parent: "اربط النص بمشروع أو أوديشن واحد",
    parentNone: "اختار المشروع أو الأوديشن",
    ownTargets: "مفيش مشاريع أو أوديشنات متاحة. أنشئ واحد قبل استيراد النص.",
    unavailableParents: "الملفات المرتبطة مش متاحة، ومش ممكن تحفظ النص دلوقتي.",
    project: "مشروع",
    audition: "أوديشن",
    script: "الصق النص الأصلي",
    file: "أو اختار ملف TXT أو PDF أو DOCX من جهازك",
    fileInvalid: "اختار ملف TXT أو PDF أو DOCX حتى ١٠ ميجابايت.",
    fileFailed: "تعذر قراءة الملف. ما اترفعش أي شيء. الصق النص الأصلي بدلًا منه.",
    reading: "جاري قراءة الملف على جهازك…",
    approve: "راجعت النص المعروض وبوافق على حفظ نسخة المصدر دي",
    preview:
      "راجع النص المستخرج قبل الحفظ. تنسيق PDF وDOCX ممكن يتغير؛ راجع الأسماء وترتيب السطور وعلامات الترقيم.",
    sourceVersion: "نسخة المصدر",
    newVersion: "نسخة مصدر جديدة",
    versionWarning:
      "ده بيحفظ نسخة مصدر ثابتة منفصلة من غير ملاحظات وحدات. النسخ القديمة والسطور المرتبطة بيها بتفضل زي ما هي. راجع كل سطر اتغير قبل الحفظ.",
    history: "تاريخ نسخ المصدر",
    excerpt: "اختار سطور المصدر للنص ده (الملف الأصلي كامل بيتحفظ)",
    excerptFrom: "أول سطر من المصدر",
    excerptTo: "آخر سطر من المصدر",
    useExcerpt: "استخدم سطور المصدر دي",
    rehearse: "اتمرن على نسخة النص دي",
    privacy: "الملف بيتقري على جهازك. مش بيتحفظ في حسابك إلا لما تضغط حفظ النص.",
    limits:
      "الحد الأقصى ٢٥ ألف حرف و٤٠٠ سطر. النص بيتثبت بعد الحفظ علشان أرقام السطور تفضل صحيحة. التعديل يحتاج نسخة نص جديدة.",
    save: "احفظ النص",
    saving: "جاري الحفظ…",
    saved: "تم حفظ النص في حسابك.",
    scriptView: "النص الأصلي — نسخة ثابتة",
    lines: "سطور",
    annotate: "علّم وحدة في سطور محددة",
    start: "من سطر",
    end: "لحد سطر",
    selected: "النص في السطور المختارة",
    beat: "وحدة المشهد / التغيّر",
    objective: "هدف الممثل (تفسيرك)",
    tactic: "التكتيك أو الفعل (تفسيرك)",
    add: "جهّز الوحدة",
    remove: "امسح الوحدة المجهزة",
    changes: "الوحدات غير المحفوظة",
    commit: "احفظ وحدات المشهد",
    noChanges: "مفيش تعديلات غير محفوظة.",
    noteSaved: "تم حفظ الوحدات كنسخة جديدة.",
    noNotes: "لسه مفيش وحدات. اختار السطور وسجّل أول وحدة.",
    revision: "نسخة",
    caution: "النص المحدد دليل من السيناريو. الوحدة والهدف والتكتيك تفسيرك إنت، مش تحليل آلي.",
    unsaved: "النصوص أو التعديلات اللي متحفظتش مش متخزنة. تغيير الملف أو الخروج بيمسحها.",
    discard: "تمسح معاينة المصدر أو تعديلات الوحدات اللي متحفظتش؟",
    back: "شغل الممثل",
  },
} as const;

function parentOption(kind: SideTarget["kind"], id: string): SideTarget {
  return { kind, id };
}

export function ActorSidesPage() {
  const { locale } = useLanguage();
  const ui = UI[locale];
  const sides = useActorSides();
  const projects = useActorProjects();
  const auditions = useActorAuditions();
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SideDraft>(blankSideDraft);
  const [source, setSource] = useState<PreparedScriptSource | undefined>();
  const [previous, setPrevious] = useState<ActorSide | undefined>();
  const [approved, setApproved] = useState(false);
  const [reading, setReading] = useState(false);
  const [sourceFrom, setSourceFrom] = useState(1);
  const [sourceTo, setSourceTo] = useState(1);
  const [annotationDraft, setAnnotationDraft] = useState<SideAnnotation[]>([]);
  const [fromLine, setFromLine] = useState(1);
  const [toLine, setToLine] = useState(1);
  const [beat, setBeat] = useState("");
  const [objective, setObjective] = useState("");
  const [tactic, setTactic] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectionRef = useRef("");
  const readSeq = useRef(0);
  const selection = `${sides.userId ?? ""}:${selectedId ?? ""}:${creating ? "new" : "view"}`;
  selectionRef.current = selection;

  const selected = sides.sides.find((side) => side.id === selectedId) ?? null;
  const availableProjects = projects.loaded && !projects.error ? projects.projects : [];
  const availableAuditions = auditions.loaded && !auditions.error ? auditions.records : [];
  const projectIds = availableProjects.map((project) => project.id);
  const auditionIds = availableAuditions.map((audition) => audition.id);
  const parentReady = projects.loaded && auditions.loaded;
  const parentAvailable = !projects.error || !auditions.error;
  const invalid = validateSideDraft(draft, projectIds, auditionIds);
  const notesInvalid = selected ? validateSideAnnotations(annotationDraft, selected.content) : null;
  const hasChanges =
    !!selected && JSON.stringify(annotationDraft) !== JSON.stringify(selected.annotations);
  const dirty =
    (creating && (!!draft.title || !!draft.content || !!source || !!previous)) || hasChanges;
  const markSaved = useUnsavedWork(dirty);
  const lineCount = selected ? sideLines(selected.content).length : 0;
  const versionHistory = selected
    ? sides.sides
        .filter(
          (side) => (side.sourceGroupId ?? side.id) === (selected.sourceGroupId ?? selected.id),
        )
        .sort((a, b) => (b.sourceVersion ?? 1) - (a.sourceVersion ?? 1))
    : [];
  const needsApproval = !!source || !!previous;
  const sourceLineCount = source ? sideLines(source.content).length : 0;
  const excerptValid =
    Number.isInteger(sourceFrom) &&
    Number.isInteger(sourceTo) &&
    sourceFrom > 0 &&
    sourceTo >= sourceFrom &&
    sourceTo <= sourceLineCount;
  const excerpt =
    selected && fromLine >= 1 && toLine >= fromLine && toLine <= lineCount
      ? anchoredExcerpt(selected.content, fromLine, toLine)
      : "";

  useEffect(() => {
    readSeq.current++;
    setSelectedId(null);
    setCreating(false);
    setDraft(blankSideDraft());
    setSource(undefined);
    setPrevious(undefined);
    setApproved(false);
    setReading(false);
    setAnnotationDraft([]);
    setBusy(false);
    setMessage("");
  }, [sides.userId]);

  function open(side: ActorSide, saved = false) {
    if (!saved && dirty && !window.confirm(ui.discard)) return;
    readSeq.current++;
    setSelectedId(side.id);
    setCreating(false);
    setSource(undefined);
    setPrevious(undefined);
    setApproved(false);
    setReading(false);
    setAnnotationDraft(side.annotations.map((note) => ({ ...note })));
    setFromLine(1);
    setToLine(1);
    setBeat("");
    setObjective("");
    setTactic("");
    setMessage("");
  }
  function newSide() {
    if (dirty && !window.confirm(ui.discard)) return;
    readSeq.current++;
    setSelectedId(null);
    setCreating(true);
    setDraft(blankSideDraft());
    setSource(undefined);
    setPrevious(undefined);
    setApproved(false);
    setReading(false);
    setMessage("");
  }
  function newSourceVersion(side: ActorSide) {
    if (dirty && !window.confirm(ui.discard)) return;
    readSeq.current++;
    setSelectedId(null);
    setCreating(true);
    setDraft({ title: side.title, content: side.content, target: { ...side.target } });
    setPrevious(side);
    setSource(undefined);
    setApproved(false);
    setReading(false);
    setMessage("");
  }
  function close() {
    if (dirty && !window.confirm(ui.discard)) return;
    readSeq.current++;
    setSelectedId(null);
    setCreating(false);
    setSource(undefined);
    setPrevious(undefined);
    setReading(false);
    setMessage("");
  }
  useEffect(() => {
    if (selected) setAnnotationDraft(selected.annotations.map((note) => ({ ...note })));
  }, [selected]);

  async function readSourceFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const sequence = ++readSeq.current;
    const currentSelection = selectionRef.current;
    setReading(true);
    setApproved(false);
    setMessage("");
    try {
      const next = await prepareScriptSource(file);
      if (sequence !== readSeq.current || currentSelection !== selectionRef.current) return;
      setSource(next);
      setSourceFrom(1);
      setSourceTo(Math.min(400, sideLines(next.content).length));
      setApproved(false);
      setDraft((old) => ({
        ...old,
        content: next.content,
        title: old.title || file.name.replace(/\.(txt|pdf|docx)$/i, ""),
      }));
    } catch (error) {
      if (sequence === readSeq.current && currentSelection === selectionRef.current)
        setMessage(locale === "en" && error instanceof Error ? error.message : ui.fileFailed);
    } finally {
      if (sequence === readSeq.current && currentSelection === selectionRef.current)
        setReading(false);
    }
  }

  async function saveSide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !creating ||
      invalid ||
      busy ||
      reading ||
      (needsApproval && !approved) ||
      !parentReady ||
      !parentAvailable
    )
      return;
    const identity = selectionRef.current;
    setBusy(true);
    setMessage("");
    try {
      const result =
        source || previous
          ? await sides.create(draft, projectIds, auditionIds, {
              ...(source ? { source } : {}),
              ...(previous ? { previous } : {}),
            })
          : await sides.create(draft, projectIds, auditionIds);
      if (selectionRef.current !== identity) return;
      if (result.value) {
        markSaved();
        open(result.value, true);
        setMessage(ui.saved);
      } else {
        setMessage(result.error ?? ui.unavailable);
      }
    } finally {
      if (selectionRef.current === identity) setBusy(false);
    }
  }

  function stageBeat() {
    if (!selected || busy) return;
    const item: SideAnnotation = {
      id: crypto.randomUUID(),
      fromLine,
      toLine,
      beat,
      objective,
      tactic,
    };
    const next = [...annotationDraft, item];
    const error = validateSideAnnotations(next, selected.content);
    if (error) {
      setMessage(error);
      return;
    }
    setAnnotationDraft(next);
    setBeat("");
    setObjective("");
    setTactic("");
    setMessage("");
  }
  async function saveBeats() {
    if (!selected || !hasChanges || notesInvalid || busy) return;
    const identity = selectionRef.current;
    setBusy(true);
    setMessage("");
    try {
      const result = await sides.annotate(selected, annotationDraft);
      if (selectionRef.current !== identity) return;
      if (result.value) {
        markSaved();
        setAnnotationDraft(result.value.annotations.map((note) => ({ ...note })));
        setMessage(ui.noteSaved);
      } else {
        setMessage(result.error ?? ui.unavailable);
      }
    } finally {
      if (selectionRef.current === identity) setBusy(false);
    }
  }
  const targetValue = draft.target ? `${draft.target.kind}:${draft.target.id}` : "";
  return (
    <Page title={ui.heading} eyebrow="Actor at Work" backTo="/work" world="work">
      <section className="foundation-stack" aria-label={ui.heading}>
        <p className="text-sm text-muted-foreground">{ui.intro}</p>
        {!sides.signedIn ? (
          <div className="panel p-4">
            <p>{ui.signIn}</p>
            <Link to="/auth" className={btnPrimary}>
              {ui.signInLink}
            </Link>
          </div>
        ) : (
          <>
            {!sides.loaded && <p role="status">{ui.loading}</p>}
            {sides.error && (
              <div className="panel p-4 foundation-stack" role="alert">
                <p>{ui.unavailable}</p>
                <button className={btnSecondary} type="button" onClick={() => void sides.reload()}>
                  {ui.retry}
                </button>
              </div>
            )}
            {sides.loaded && !sides.error && (
              <>
                <button className={btnPrimary} type="button" disabled={busy} onClick={newSide}>
                  {ui.new}
                </button>
                {sides.sides.length === 0 && <p>{ui.empty}</p>}
                <ul className="grid gap-2">
                  {sides.sides.map((side) => (
                    <li key={side.id}>
                      <button
                        type="button"
                        className={`${btnSecondary} w-full justify-between gap-3 text-start`}
                        aria-pressed={side.id === selectedId}
                        disabled={busy}
                        onClick={() => open(side)}
                      >
                        <span className="break-words">{side.title}</span>
                        <span className="text-xs">
                          {ui.sourceVersion} {side.sourceVersion ?? 1} · {ui.revision}{" "}
                          {side.revision}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {creating && (
                  <section className="panel p-4 foundation-stack" aria-label={ui.new}>
                    <button className={btnSecondary} type="button" onClick={close} disabled={busy}>
                      {ui.close}
                    </button>
                    <form className="foundation-stack" onSubmit={(event) => void saveSide(event)}>
                      {previous && (
                        <p className="text-sm" role="note">
                          {ui.versionWarning}
                        </p>
                      )}
                      <label className="grid gap-1">
                        {ui.title}
                        <input
                          className="w-full rounded border border-input bg-background p-3"
                          maxLength={120}
                          required
                          disabled={busy}
                          value={draft.title}
                          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                        />
                      </label>
                      <label className="grid gap-1">
                        {ui.parent}
                        <select
                          className="w-full min-h-12 rounded border border-input bg-background p-3"
                          value={targetValue}
                          disabled={busy || !!previous || !parentReady}
                          onChange={(event) => {
                            const value = event.target.value;
                            const owned = [
                              ...availableProjects.map((item) => ({
                                kind: "project" as const,
                                id: item.id,
                              })),
                              ...availableAuditions.map((item) => ({
                                kind: "audition" as const,
                                id: item.id,
                              })),
                            ];
                            const next = owned.find(
                              (option) => `${option.kind}:${option.id}` === value,
                            );
                            setDraft({
                              ...draft,
                              target: next ? parentOption(next.kind, next.id) : null,
                            });
                          }}
                        >
                          <option value="">{ui.parentNone}</option>
                          {availableProjects.map((project) => (
                            <option key={project.id} value={`project:${project.id}`}>
                              {ui.project}: {project.title}
                            </option>
                          ))}
                          {availableAuditions.map((audition) => (
                            <option key={audition.id} value={`audition:${audition.id}`}>
                              {ui.audition}: {audition.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      {parentReady && !availableProjects.length && !availableAuditions.length && (
                        <p>{ui.ownTargets}</p>
                      )}
                      {!parentReady && <p role="status">{ui.loading}</p>}
                      {parentReady && !parentAvailable && (
                        <p role="alert">{ui.unavailableParents}</p>
                      )}
                      <label className="grid gap-1">
                        {ui.file}
                        <input
                          type="file"
                          accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          disabled={busy}
                          onChange={(event) => void readSourceFile(event)}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">{ui.privacy}</p>
                      {reading && <p role="status">{ui.reading}</p>}
                      {source && (
                        <p className="text-sm">
                          {source.name} · {source.kind.toUpperCase()} · {ui.preview}
                        </p>
                      )}
                      {source && (
                        <fieldset className="grid gap-3 rounded border border-input p-3">
                          <legend className="text-sm">{ui.excerpt}</legend>
                          <p className="text-xs">
                            {sourceLineCount} {ui.lines}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="grid gap-1">
                              {ui.excerptFrom}
                              <input
                                type="number"
                                className="w-full rounded border border-input bg-background p-2"
                                min={1}
                                max={sourceLineCount}
                                value={sourceFrom}
                                disabled={busy || reading}
                                onChange={(event) => setSourceFrom(Number(event.target.value))}
                              />
                            </label>
                            <label className="grid gap-1">
                              {ui.excerptTo}
                              <input
                                type="number"
                                className="w-full rounded border border-input bg-background p-2"
                                min={1}
                                max={sourceLineCount}
                                value={sourceTo}
                                disabled={busy || reading}
                                onChange={(event) => setSourceTo(Number(event.target.value))}
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            className={btnSecondary}
                            disabled={!excerptValid || busy || reading}
                            onClick={() => {
                              setDraft({
                                ...draft,
                                content: anchoredExcerpt(source.content, sourceFrom, sourceTo),
                              });
                              setApproved(false);
                            }}
                          >
                            {ui.useExcerpt}
                          </button>
                        </fieldset>
                      )}
                      <label className="grid gap-1">
                        {ui.script}
                        <textarea
                          className="w-full rounded border border-input bg-background p-3 font-mono text-sm"
                          dir="auto"
                          rows={12}
                          disabled={busy}
                          value={draft.content}
                          onChange={(event) => {
                            setDraft({ ...draft, content: event.target.value });
                            setApproved(false);
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">{ui.limits}</p>
                      {needsApproval && (
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={approved}
                            disabled={busy || reading}
                            onChange={(event) => setApproved(event.target.checked)}
                          />
                          {ui.approve}
                        </label>
                      )}
                      {invalid && (
                        <p className="text-sm text-amber" role="status">
                          {invalid}
                        </p>
                      )}
                      <button
                        className={btnPrimary}
                        type="submit"
                        disabled={
                          !!invalid ||
                          !parentReady ||
                          !parentAvailable ||
                          busy ||
                          reading ||
                          (needsApproval && !approved)
                        }
                      >
                        {busy ? ui.saving : ui.save}
                      </button>
                    </form>
                  </section>
                )}
                {selected && (
                  <section className="foundation-stack panel p-4">
                    <button className={btnSecondary} type="button" disabled={busy} onClick={close}>
                      {ui.close}
                    </button>
                    <h2>{selected.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnSecondary}
                        disabled={busy || versionHistory[0]?.id !== selected.id}
                        onClick={() => newSourceVersion(selected)}
                      >
                        {ui.newVersion}
                      </button>
                      <Link
                        className={btnPrimary}
                        to="/rehearsal"
                        search={{
                          sideId: selected.id,
                          ...(selected.target.kind === "project"
                            ? { projectId: selected.target.id }
                            : { auditionId: selected.target.id }),
                          returnTo: selected.target.kind === "project" ? "project" : "audition",
                        }}
                      >
                        {ui.rehearse}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ui.sourceVersion} {selected.sourceVersion ?? 1} ·{" "}
                      {selected.sourceKind ?? "legacy_text"}
                      {selected.sourceName ? ` · ${selected.sourceName}` : ""}
                    </p>
                    {versionHistory.length > 1 && (
                      <nav aria-label={ui.history} className="flex flex-wrap gap-2">
                        {versionHistory.map((side) => (
                          <button
                            key={side.id}
                            type="button"
                            className={btnSecondary}
                            disabled={busy}
                            aria-current={side.id === selected.id ? "true" : undefined}
                            onClick={() => open(side)}
                          >
                            {ui.sourceVersion} {side.sourceVersion ?? 1}
                          </button>
                        ))}
                      </nav>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {ui.revision} {selected.revision} · {lineCount} {ui.lines}
                    </p>
                    <h3 className="font-semibold">{ui.scriptView}</h3>
                    <ol
                      className="grid gap-1 max-h-96 overflow-y-auto border border-input rounded p-2"
                      aria-label={ui.scriptView}
                    >
                      {sideLines(selected.content).map((line, index) => (
                        <li className="flex gap-3 border-b border-input/40 py-1" key={index}>
                          <span className="shrink-0 w-8 text-xs text-muted-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <span
                            dir="auto"
                            className="min-w-0 whitespace-pre-wrap break-words font-mono text-sm"
                          >
                            {line || " "}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <h3 className="font-semibold">{ui.annotate}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1">
                        {ui.start}
                        <input
                          type="number"
                          min={1}
                          max={lineCount}
                          value={fromLine}
                          onChange={(event) => setFromLine(Number(event.target.value))}
                          className="w-full rounded border border-input bg-background p-2"
                        />
                      </label>
                      <label className="grid gap-1">
                        {ui.end}
                        <input
                          type="number"
                          min={1}
                          max={lineCount}
                          value={toLine}
                          onChange={(event) => setToLine(Number(event.target.value))}
                          className="w-full rounded border border-input bg-background p-2"
                        />
                      </label>
                    </div>
                    <div className="foundation-stack">
                      <strong>{ui.selected}</strong>
                      <blockquote
                        className="whitespace-pre-wrap break-words border-s-2 border-amber ps-3"
                        dir="auto"
                      >
                        {excerpt || "—"}
                      </blockquote>
                    </div>
                    <p className="text-xs text-muted-foreground">{ui.caution}</p>
                    {(
                      [
                        [ui.beat, beat, setBeat, 300],
                        [ui.objective, objective, setObjective, 500],
                        [ui.tactic, tactic, setTactic, 500],
                      ] as const
                    ).map(([label, value, setter, maxLength]) => (
                      <label className="grid gap-1" key={label}>
                        {label}
                        <textarea
                          className="w-full rounded border border-input bg-background p-3"
                          value={value}
                          maxLength={maxLength}
                          rows={2}
                          disabled={busy}
                          onChange={(event) => setter(event.target.value)}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={busy}
                      onClick={stageBeat}
                    >
                      {ui.add}
                    </button>
                    <h3 className="font-semibold">{ui.changes}</h3>
                    {annotationDraft.length === 0 && <p>{ui.noNotes}</p>}
                    <ul className="grid gap-3">
                      {annotationDraft.map((note) => (
                        <li
                          key={note.id}
                          className="rounded border border-input p-3 foundation-stack"
                        >
                          <strong>
                            {ui.start} {note.fromLine} – {ui.end} {note.toLine}: {note.beat}
                          </strong>
                          <blockquote
                            className="whitespace-pre-wrap break-words border-s-2 border-amber ps-3"
                            dir="auto"
                          >
                            {anchoredExcerpt(selected.content, note.fromLine, note.toLine)}
                          </blockquote>
                          {note.objective && (
                            <p>
                              {ui.objective}: {note.objective}
                            </p>
                          )}
                          {note.tactic && (
                            <p>
                              {ui.tactic}: {note.tactic}
                            </p>
                          )}
                          <button
                            type="button"
                            className={btnSecondary}
                            disabled={busy}
                            onClick={() =>
                              setAnnotationDraft((old) => old.filter((item) => item.id !== note.id))
                            }
                          >
                            {ui.remove}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {notesInvalid && <p role="alert">{notesInvalid}</p>}
                    <button
                      type="button"
                      className={btnPrimary}
                      disabled={busy || !hasChanges || !!notesInvalid}
                      onClick={() => void saveBeats()}
                    >
                      {busy ? ui.saving : ui.commit}
                    </button>
                    {!hasChanges && <p className="text-xs text-muted-foreground">{ui.noChanges}</p>}
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
        <p className="text-xs text-muted-foreground">{ui.unsaved}</p>
        <Link to="/work" className={btnSecondary}>
          {ui.back}
        </Link>
      </section>
    </Page>
  );
}

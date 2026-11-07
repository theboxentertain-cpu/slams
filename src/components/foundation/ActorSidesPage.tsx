import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import { useActorProjects } from "@/lib/use-actor-projects";
import { useActorAuditions } from "@/lib/use-actor-auditions";
import { useActorSides, type ActorSide } from "@/lib/use-actor-sides";
import {
  MAX_SIDE_BYTES,
  anchoredExcerpt,
  blankSideDraft,
  sideLines,
  validateSideAnnotations,
  validateSideDraft,
  type SideAnnotation,
  type SideDraft,
  type SideTarget,
} from "@/lib/actor-sides-model";

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
    file: "Or load a UTF-8 .txt file from this device",
    fileInvalid: "Only .txt files up to 60 KB are supported. PDF, DOCX and FDX are not parsed.",
    fileFailed: "This text file could not be read. Nothing was uploaded.",
    privacy:
      "The file is read in this device. It is sent to your account only when you select Save side.",
    limits:
      "Maximum 25,000 characters and 400 lines. Source text is frozen after save so line anchors remain accurate. To revise a script, create a new side.",
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
    file: "أو اختار ملف نصي UTF-8 بصيغة .txt من جهازك",
    fileInvalid: "المدعوم ملفات .txt فقط حتى ٦٠ كيلوبايت. ملفات PDF وDOCX وFDX مش مدعومة.",
    fileFailed: "تعذر قراءة الملف النصي. ما اترفعش أي شيء.",
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
  const lineCount = selected ? sideLines(selected.content).length : 0;
  const excerpt =
    selected && fromLine >= 1 && toLine >= fromLine && toLine <= lineCount
      ? anchoredExcerpt(selected.content, fromLine, toLine)
      : "";

  useEffect(() => {
    readSeq.current++;
    setSelectedId(null);
    setCreating(false);
    setDraft(blankSideDraft());
    setAnnotationDraft([]);
    setBusy(false);
    setMessage("");
  }, [sides.userId]);

  function open(side: ActorSide) {
    readSeq.current++;
    setSelectedId(side.id);
    setCreating(false);
    setAnnotationDraft(side.annotations.map((note) => ({ ...note })));
    setFromLine(1);
    setToLine(1);
    setBeat("");
    setObjective("");
    setTactic("");
    setMessage("");
  }
  function newSide() {
    readSeq.current++;
    setSelectedId(null);
    setCreating(true);
    setDraft(blankSideDraft());
    setMessage("");
  }
  function close() {
    readSeq.current++;
    setSelectedId(null);
    setCreating(false);
    setMessage("");
  }
  useEffect(() => {
    if (selected) setAnnotationDraft(selected.annotations.map((note) => ({ ...note })));
  }, [selected?.id, selected?.revision]);

  async function readTextFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!/\.txt$/i.test(file.name) || file.size > MAX_SIDE_BYTES) {
      setMessage(ui.fileInvalid);
      return;
    }
    const sequence = ++readSeq.current;
    const currentSelection = selectionRef.current;
    try {
      const content = await file.text();
      if (sequence !== readSeq.current || currentSelection !== selectionRef.current) return;
      setDraft((old) => ({
        ...old,
        content,
        title: old.title || file.name.replace(/\.txt$/i, ""),
      }));
      setMessage("");
    } catch {
      if (sequence === readSeq.current) setMessage(ui.fileFailed);
    }
  }

  async function saveSide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creating || invalid || busy || !parentReady || !parentAvailable) return;
    const identity = selectionRef.current;
    setBusy(true);
    setMessage("");
    try {
      const result = await sides.create(draft, projectIds, auditionIds);
      if (selectionRef.current !== identity) return;
      if (result.value) {
        open(result.value);
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
                          {ui.revision} {side.revision}
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
                          disabled={busy || !parentReady}
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
                          accept=".txt,text/plain"
                          disabled={busy}
                          onChange={(event) => void readTextFile(event)}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">{ui.privacy}</p>
                      <label className="grid gap-1">
                        {ui.script}
                        <textarea
                          className="w-full rounded border border-input bg-background p-3 font-mono text-sm"
                          dir="auto"
                          rows={12}
                          disabled={busy}
                          value={draft.content}
                          onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">{ui.limits}</p>
                      {invalid && (
                        <p className="text-sm text-amber" role="status">
                          {invalid}
                        </p>
                      )}
                      <button
                        className={btnPrimary}
                        type="submit"
                        disabled={!!invalid || !parentReady || !parentAvailable || busy}
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

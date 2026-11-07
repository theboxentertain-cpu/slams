/**
 * Local-only Performance Lab. Only explicit user clicks request microphone or
 * camera permission; recorded blobs remain in process memory (object URLs),
 * never in localStorage, Supabase, a service worker, or Passport.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";

type Slot = "a" | "b";
type CaptureKind = "video" | "audio";
type Stage = "idle" | "requesting" | "recording" | "finishing";
type Take = { url: string; type: string; bytes: number; recordedAt: string; kind: CaptureKind };
type Takes = Record<Slot, Take | null>;
type Notes = Record<Slot, string>;
const MAX_MS = 90_000;
const MAX_NOTE = 1000;
const initialTakes: Takes = { a: null, b: null };
const initialNotes: Notes = { a: "", b: "" };

export function supportedLocalCapture(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    typeof URL.createObjectURL === "function" &&
    typeof URL.revokeObjectURL === "function"
  );
}

function safeDownloadExtension(mime: string, kind: CaptureKind) {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("webm")) return "webm";
  return kind === "audio" ? "webm" : "webm";
}

export function PerformanceLab() {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [stage, setStage] = useState<Stage>("idle");
  const [kind, setKind] = useState<CaptureKind>("video");
  const [slot, setSlot] = useState<Slot>("a");
  const [takes, setTakes] = useState<Takes>(initialTakes);
  const [notes, setNotes] = useState<Notes>(initialNotes);
  const [comparison, setComparison] = useState("");
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const live = useRef(true);
  const takesRef = useRef<Takes>(initialTakes);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startTime = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestId = useRef(0);
  const captureTarget = useRef<{ slot: Slot; kind: CaptureKind } | null>(null);

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  function stopTimers() {
    if (timeout.current !== null) clearTimeout(timeout.current);
    if (tick.current !== null) clearInterval(tick.current);
    timeout.current = null;
    tick.current = null;
  }
  function discard(slotId: Slot) {
    const existing = takesRef.current[slotId];
    if (existing) URL.revokeObjectURL(existing.url);
    const next = { ...takesRef.current, [slotId]: null };
    takesRef.current = next;
    setTakes(next);
    setNotes((prev) => ({ ...prev, [slotId]: "" }));
    setComparison("");
    setFeedback("");
  }
  function endCapture() {
    if (!recorder.current || recorder.current.state === "inactive") return;
    setStage("finishing");
    stopTimers();
    try {
      recorder.current.stop();
    } catch {
      setFailed(true);
      setFeedback(t("Could not finish this recording. No take was saved.", "تعذّر إنهاء التسجيل. لم يتم حفظ محاولة."));
      setStage("idle");
    } finally {
      stopTracks();
    }
  }

  async function startCapture() {
    if (stage !== "idle") return;
    setFeedback("");
    setFailed(false);
    if (!supportedLocalCapture()) {
      setFailed(true);
      setFeedback(t("This browser does not support local capture. The text rehearsal remains available.", "المتصفح لا يدعم التسجيل المحلي. التدريب النصي ما زال متاحًا."));
      return;
    }
    setStage("requesting");
    setElapsed(0);
    const sequence = ++requestId.current;
    let acquired: MediaStream | null = null;
    try {
      // This is the sole permission request and only occurs on a real click.
      acquired = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video" ? { facingMode: "user" } : false,
      });
      if (!live.current || sequence !== requestId.current) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = acquired;
      const preferred = kind === "video"
        ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
        : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const preferredType = preferred.find((type) => MediaRecorder.isTypeSupported?.(type));
      const mr = preferredType ? new MediaRecorder(acquired, { mimeType: preferredType }) : new MediaRecorder(acquired);
      chunks.current = [];
      recorder.current = mr;
      captureTarget.current = { slot, kind };
      mr.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      mr.onerror = () => {
        if (!live.current) return;
        setFailed(true);
        setFeedback(t("Recorder failed. Try again; no take was uploaded.", "حدث خطأ في التسجيل. جرّب مجددًا؛ لم يتم رفع أي شيء."));
        endCapture();
      };
      mr.onstop = () => {
        stopTimers();
        stopTracks();
        recorder.current = null;
        if (!live.current) return;
        const target = captureTarget.current;
        const recorded = [...chunks.current];
        chunks.current = [];
        captureTarget.current = null;
        const mime = mr.mimeType || recorded[0]?.type || "";
        const blob = new Blob(recorded, { type: mime || "application/octet-stream" });
        if (!target || !recorded.length || !blob.size || failed) {
          setStage("idle");
          setFailed(true);
          setFeedback(t("No usable take was captured. Retry with device permission enabled.", "لم يتم تسجيل محاولة صالحة. فعّل صلاحية الجهاز وحاول مرة أخرى."));
          return;
        }
        const url = URL.createObjectURL(blob);
        const next: Takes = {
          ...takesRef.current,
          [target.slot]: {
            url, type: blob.type, bytes: blob.size,
            recordedAt: new Date().toISOString(), kind: target.kind,
          },
        };
        if (takesRef.current[target.slot]) URL.revokeObjectURL(takesRef.current[target.slot]!.url);
        takesRef.current = next;
        setTakes(next);
        setNotes((prev) => ({ ...prev, [target.slot]: "" }));
        setComparison("");
        setFailed(false);
        setStage("idle");
        setFeedback(t(
          `Take ${target.slot.toUpperCase()} is ready locally. It was not uploaded or saved to Passport.`,
          `المحاولة ${target.slot === "a" ? "أ" : "ب"} جاهزة على الجهاز. لم تُرفع أو تُحفظ في جواز الممثل.`,
        ));
      };
      mr.start(250);
      startTime.current = Date.now();
      setStage("recording");
      timeout.current = setTimeout(() => endCapture(), MAX_MS);
      tick.current = setInterval(() => setElapsed(Math.min(90, Math.floor((Date.now() - startTime.current) / 1000))), 1000);
    } catch {
      acquired?.getTracks().forEach((track) => track.stop());
      stopTracks();
      stopTimers();
      recorder.current = null;
      if (live.current && sequence === requestId.current) {
        setStage("idle");
        setFailed(true);
        setFeedback(t(
          "Permission was denied, the device is busy, or recording is unsupported. No data was captured.",
          "تم رفض الإذن أو الكاميرا مشغولة أو التسجيل غير مدعوم. لم يتم التقاط أي بيانات.",
        ));
      }
    }
  }

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      requestId.current++;
      stopTimers();
      if (recorder.current) {
        recorder.current.onstop = null;
        recorder.current.ondataavailable = null;
        recorder.current.onerror = null;
        if (recorder.current.state !== "inactive") {
          try { recorder.current.stop(); } catch { /* Device has already ended. */ }
        }
      }
      stopTracks();
      Object.values(takesRef.current).forEach((take) => {
        if (take) URL.revokeObjectURL(take.url);
      });
    };
  }, []);

  async function copyReview() {
    const text = [
      "SLAMS Performance Lab — actor's own notes (not graded)",
      `Take A: ${notes.a.trim() || "No note"}`,
      `Take B: ${notes.b.trim() || "No note"}`,
      `Difference noticed: ${comparison.trim() || "Not entered"}`,
      "Local media is not copied, uploaded, graded, or linked to Passport.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(t("Review copied as text only. No clips saved.", "تم نسخ الملاحظات نصيًا فقط. لم تُحفظ التسجيلات."));
      setFailed(false);
    } catch {
      setFeedback(t("Clipboard unavailable. Your notes are still on this page.", "الحافظة غير متاحة. ملاحظاتك ما زالت على الصفحة."));
      setFailed(true);
    }
  }

  return (
    <Page title="Performance Lab" eyebrow="CAPTURE · RETAKE · COMPARE" backTo="/rehearsal" world="rehearsal">
      <section className="foundation-stack" aria-label={t("Local Performance Lab", "معمل الأداء المحلي")}>
        <div className="availability-note">
          <h2 className="font-bold">{t("Local-only capture · early pilot", "تسجيل محلي فقط · نسخة تجريبية")}</h2>
          <p className="mt-2">
            {t(
              "Recording starts only when you press Record and grant device permission. Each take ends after 90 seconds at most. Playback stays in this page's memory; leaving it erases both takes. No AI observation, automatic score, cloud upload, or Passport media storage.",
              "يبدأ التسجيل فقط لما تضغط تسجيل وتوافق على إذن الجهاز. مدة كل محاولة بحد أقصى ٩٠ ثانية. التسجيلات موجودة في ذاكرة الصفحة فقط وتُمحى لما تخرج. لا يوجد تحليل آلي أو درجات أو رفع سحابي أو حفظ تسجيلات في جواز الممثل.",
            )}
          </p>
          <p className="mt-2 text-sm">
            {t("Only record yourself and people who knowingly agree. Avoid capturing private conversations or bystanders.", "سجّل نفسك ومن وافق بوضوح فقط. تجنّب تصوير أشخاص آخرين أو أحاديث خاصة.")}
          </p>
        </div>

        <section className="panel space-y-4 p-4" aria-label={t("Capture controls", "أدوات التسجيل")}>
          <h3 className="text-lg font-semibold">{t("01 — Choose a take and capture mode", "٠١ — اختار المحاولة ونوع التسجيل")}</h3>
          <fieldset className="flex flex-wrap gap-4" disabled={stage !== "idle"}>
            <legend className="mb-2 font-semibold">{t("Take slot", "مكان المحاولة")}</legend>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="take-slot" checked={slot === "a"} onChange={() => setSlot("a")} />{t("Take A", "المحاولة أ")}</label>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="take-slot" checked={slot === "b"} onChange={() => setSlot("b")} />{t("Take B", "المحاولة ب")}</label>
          </fieldset>
          <fieldset className="flex flex-wrap gap-4" disabled={stage !== "idle"}>
            <legend className="mb-2 font-semibold">{t("What to record", "ماذا تريد أن تسجّل؟")}</legend>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="capture-kind" checked={kind === "video"} onChange={() => setKind("video")} />{t("Camera + microphone", "كاميرا وميكروفون")}</label>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="capture-kind" checked={kind === "audio"} onChange={() => setKind("audio")} />{t("Voice only", "صوت فقط")}</label>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            {stage === "idle" ? (
              <button type="button" className={btnPrimary} onClick={() => void startCapture()} disabled={!supportedLocalCapture()}>
                {t(`Record Take ${slot.toUpperCase()} (request permission)`, `سجّل المحاولة ${slot === "a" ? "أ" : "ب"} (طلب الإذن)`)}
              </button>
            ) : stage === "recording" ? (
              <button type="button" className={btnPrimary} onClick={endCapture}>
                {t("Stop recording", "أوقف التسجيل")}
              </button>
            ) : (
              <span role="status">{stage === "requesting" ? t("Requesting device permission…", "جارٍ طلب إذن الجهاز…") : t("Finishing local take…", "جارٍ إنهاء التسجيل المحلي…")}</span>
            )}
            {stage === "recording" && (
              <span role="status" aria-live="off">
                {t(`Recording Take ${slot.toUpperCase()}: ${elapsed}s / 90s`, `تسجيل المحاولة ${slot === "a" ? "أ" : "ب"}: ${elapsed} / ٩٠ ثانية`)}
              </span>
            )}
          </div>
          {!supportedLocalCapture() && (
            <p role="alert">{t("Your device/browser does not expose secure local recording. You can still use the Living Scene.", "الجهاز أو المتصفح لا يتيح التسجيل المحلي. تقدر تستخدم المشهد التفاعلي.")}</p>
          )}
          {feedback && <p role={failed ? "alert" : "status"}>{feedback}</p>}
        </section>

        <section className="panel space-y-3 p-4" aria-label={t("Before and after takes", "محاولات قبل وبعد")}>
          <h3 className="text-lg font-semibold">{t("02 — Play back your actual takes", "٠٢ — شاهد محاولاتك الحقيقية")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["a", "b"] as const).map((id) => (
              <div key={id} className="min-w-0 space-y-2 rounded border border-border p-3">
                <h4 className="font-bold">{t(`Take ${id.toUpperCase()}`, `المحاولة ${id === "a" ? "أ" : "ب"}`)}</h4>
                {takes[id] ? (
                  <>
                    {takes[id]!.kind === "video" ? (
                      <video controls playsInline preload="metadata" src={takes[id]!.url} className="w-full rounded bg-black" aria-label={t(`Playback take ${id.toUpperCase()}`, `شغّل المحاولة ${id === "a" ? "أ" : "ب"}`)} />
                    ) : (
                      <audio controls preload="metadata" src={takes[id]!.url} className="w-full" aria-label={t(`Playback take ${id.toUpperCase()}`, `شغّل صوت المحاولة ${id === "a" ? "أ" : "ب"}`)} />
                    )}
                    <p className="text-xs text-muted-foreground">{t("Memory only · not uploaded", "في الذاكرة فقط · لم يتم الرفع")}</p>
                    <div className="flex flex-wrap gap-2">
                      <a className={btnSecondary} href={takes[id]!.url}
                        download={`slams-take-${id}.${safeDownloadExtension(takes[id]!.type, takes[id]!.kind)}`}>
                        {t("Download this take", "نزّل هذه المحاولة")}
                      </a>
                      <button type="button" className={btnSecondary} onClick={() => discard(id)} disabled={stage !== "idle"}>
                        {t("Delete take now", "امسح المحاولة الآن")}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("No take in memory", "لا توجد محاولة في الذاكرة")}</p>
                )}
                <label className="block text-sm font-semibold" htmlFor={`lab-note-${id}`}>{t("What actually happened in this take?", "ماذا حدث بالفعل في هذه المحاولة؟")}</label>
                <textarea id={`lab-note-${id}`} className="w-full rounded border border-border bg-background p-3 text-foreground"
                  maxLength={MAX_NOTE} rows={3} value={notes[id]}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [id]: e.target.value }))} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel space-y-3 p-4" aria-label={t("Your comparison", "مقارنتك الشخصية")}>
          <h3 className="text-lg font-semibold">{t("03 — Compare observable behavior", "٠٣ — قارن السلوك الملحوظ")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Compare what you actually saw or heard: timing, listening, intention, movement, tactic, or response. A difference is not automatically an improvement. The app cannot evaluate your acting.",
              "قارن ما رأيته أو سمعته فعلًا: التوقيت والاستماع والهدف والحركة والتكتيك والاستجابة. الاختلاف لا يعني بالضرورة التحسن. التطبيق لا يقيّم التمثيل.",
            )}
          </p>
          <label className="block font-semibold" htmlFor="lab-comparison">{t("What changed between A and B, if anything?", "ما الذي تغيّر بين أ وب، إن وجد؟")}</label>
          <textarea id="lab-comparison" className="w-full rounded border border-border bg-background p-3 text-foreground"
            maxLength={1200} rows={4} value={comparison} onChange={(e) => setComparison(e.target.value)} />
          <button type="button" className={btnSecondary} disabled={!notes.a.trim() && !notes.b.trim() && !comparison.trim()}
            onClick={() => void copyReview()}>{t("Copy comparison as text (no media)", "انسخ المقارنة كنص فقط")}</button>
          <p className="text-xs text-muted-foreground">{t(
            "Written observations are not saved by this tool. A future Performance Lab will support time-coded notes, media annotation and opt-in cloud backup after privacy testing.",
            "الملاحظات لا تُحفظ بواسطة هذه الأداة. النسخة القادمة ستدعم ملاحظات مرتبطة بالتوقيت وتعليقات على التسجيلات وحفظًا اختياريًا بعد اختبار الخصوصية.",
          )}</p>
          <Link to="/scene" className="underline underline-offset-4">{t("Return to the Living Scene", "العودة للمشهد التفاعلي")}</Link>
        </section>
      </section>
    </Page>
  );
}

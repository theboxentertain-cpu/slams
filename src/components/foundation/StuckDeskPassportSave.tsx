import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { usePassport, type PassportEntry } from "@/lib/store";
import { btnPrimary } from "@/components/slams";

/**
 * Opt-in bridge from the learner's text-only Stuck Desk notes to the existing
 * Passport. This does not assess performance or upload video/audio.
 * Passport itself enforces account identity and confirmed database writes.
 */
export function StuckDeskPassportSave({
  problem,
  technique,
  intervention,
  before,
  after,
  saved,
  onSaved,
}: {
  problem: string;
  technique: string;
  intervention: string;
  before: string;
  after: string;
  saved: boolean;
  onSaved: () => void;
}) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const passport = usePassport();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready =
    before.trim().length > 0 && after.trim().length > 0 && before.trim() !== after.trim();
  const disabled = saved || busy || !passport.loaded || !!passport.error || !ready;

  async function save() {
    if (disabled) return;
    const id = globalThis.crypto?.randomUUID?.();
    if (!id) {
      setError(
        ar
          ? "تعذّر إنشاء رقم آمن للمذكرة. انسخها بدلًا من ذلك."
          : "Secure note ID unavailable. Copy the note instead.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const entry: PassportEntry = {
      id,
      date: new Date().toISOString(),
      tactic: technique,
      intervention,
      exerciseNote: before.trim(),
      obstacle: problem,
      retakeLine: after.trim(),
      reflection:
        "Self-reported before/after acting experiment; not a performance assessment or academic credit.",
    };
    try {
      const result = await passport.add(entry);
      if (result.error) {
        setError(
          ar
            ? "الحفظ لم يتأكد. جرّب مجددًا أو انسخ الملاحظة."
            : "Save not confirmed. Retry or copy the note.",
        );
      } else {
        onSaved();
      }
    } catch {
      setError(
        ar ? "تعذّر الحفظ. جرّب مجددًا أو انسخ الملاحظة." : "Save failed. Retry or copy the note.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="mt-3 border-t border-border pt-3"
      aria-label={ar ? "الحفظ الاختياري لجواز الممثل" : "Optional Passport save"}
    >
      <button type="button" className={btnPrimary} disabled={disabled} onClick={() => void save()}>
        {saved
          ? ar
            ? "تم الحفظ في جواز الممثل"
            : "Saved to Actor's Passport"
          : busy
            ? ar
              ? "جارٍ الحفظ…"
              : "Saving…"
            : ar
              ? "احفظ ملاحظاتي في جواز الممثل"
              : "Save these notes to Actor's Passport"}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        {passport.signedIn
          ? ar
            ? "الحفظ يدوي فقط، إلى حسابك بعد التأكيد. لا يتم رفع تسجيل."
            : "Only saves when pressed, to your verified account. No recording is uploaded."
          : ar
            ? "ملفات الزائر تبقى في هذا المتصفح ولا تُنقل تلقائيًا للحساب."
            : "Guest saves remain in this browser; no automatic account upload."}
      </p>
      {passport.error && (
        <p role="alert">
          {ar
            ? "جواز الممثل غير متاح. انسخ ملاحظاتك بدلًا من ذلك."
            : "Passport unavailable. Copy your notes instead."}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

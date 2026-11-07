import { useState } from "react";
import { btnSecondary } from "@/components/slams";
import { useLanguage } from "@/lib/i18n";
import {
  MARKER_CATEGORIES,
  MARKER_MAX_CHARACTERS,
  formatTimecode,
  type MarkerCategory,
  type ReviewMarker,
  type TakeSlot,
} from "@/lib/performance-review-model";

export function TakeMarkerEditor({
  take,
  markers,
  onAdd,
  onRemove,
  onSeek,
  disabled,
}: {
  take: TakeSlot;
  markers: readonly ReviewMarker[];
  onAdd: (category: MarkerCategory, observation: string) => string | null;
  onRemove: (id: string) => void;
  onSeek: (marker: ReviewMarker) => void;
  disabled: boolean;
}) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [category, setCategory] = useState<MarkerCategory>("listening");
  const [observation, setObservation] = useState("");
  const [error, setError] = useState("");

  const caption = t(
    `Take ${take.toUpperCase()} markers`,
    `علامات المحاولة ${take === "a" ? "أ" : "ب"}`,
  );
  return (
    <section className="space-y-3 rounded border border-border bg-secondary/40 p-3" aria-label={caption}>
      <h5 className="font-semibold">
        {t("Mark an observed moment", "حدّد لحظة لاحظتها")}
      </h5>
      <p className="text-xs text-muted-foreground">
        {t(
          "Play or seek to an actual moment in the take. The marker will use the player’s current timestamp, not an estimated AI position.",
          "شغّل التسجيل أو انتقل للحظة فعلية. سيستخدم التحديد توقيت المشغل الحالي، وليس توقيتًا خمّنه الذكاء الاصطناعي.",
        )}
      </p>
      <label className="grid gap-1 text-sm" htmlFor={`lab-category-${take}`}>
        <span>{t("Observation category", "نوع الملاحظة")}</span>
        <select
          id={`lab-category-${take}`}
          className="min-h-11 w-full rounded border border-border bg-background p-2 text-foreground"
          value={category}
          disabled={disabled}
          onChange={(event) => {
            setCategory(event.target.value as MarkerCategory);
            setError("");
          }}
        >
          {MARKER_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {ar ? item.ar : item.en}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`lab-marker-${take}`}>
        <span>{t("What did you observe at this moment?", "ماذا لاحظت في هذه اللحظة؟")}</span>
        <textarea
          id={`lab-marker-${take}`}
          className="w-full rounded border border-border bg-background p-2 text-foreground"
          maxLength={MARKER_MAX_CHARACTERS}
          rows={2}
          disabled={disabled}
          value={observation}
          onChange={(event) => {
            setObservation(event.target.value);
            setError("");
          }}
        />
        <span className="text-xs text-muted-foreground">
          {observation.length}/{MARKER_MAX_CHARACTERS}
        </span>
      </label>
      <button
        className={btnSecondary}
        type="button"
        disabled={disabled || observation.trim().length < 8}
        onClick={() => {
          const failure = onAdd(category, observation);
          if (failure) setError(failure);
          else {
            setObservation("");
            setError("");
          }
        }}
      >
        {t(
          `Mark current time in Take ${take.toUpperCase()}`,
          `حدّد توقيت المحاولة ${take === "a" ? "أ" : "ب"} الحالي`,
        )}
      </button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {markers.length > 0 && (
        <>
          <h6 className="font-semibold">{t("Your time-coded observations", "ملاحظاتك المحددة بالتوقيت")}</h6>
          <ul className="space-y-2">
            {[...markers].sort((a, b) => a.seconds - b.seconds).map((marker) => {
              const lens = MARKER_CATEGORIES.find((item) => item.id === marker.category);
              return (
                <li key={marker.id} className="rounded border border-border bg-background p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="min-h-11 rounded border border-border px-3 py-2 text-start underline underline-offset-4"
                      disabled={disabled}
                      onClick={() => onSeek(marker)}
                    >
                      {t("Jump to", "انتقل إلى")} {formatTimecode(marker.seconds)}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {ar ? lens?.ar : lens?.en}
                    </span>
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={disabled}
                      onClick={() => onRemove(marker.id)}
                    >
                      {t(`Remove marker at ${formatTimecode(marker.seconds)}`, `احذف العلامة عند ${formatTimecode(marker.seconds)}`)}
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{marker.observation}</p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

import { useCallback, useRef, type ReactNode } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { UnsavedWorkContext, type Registration } from "./unsaved-work-state";

/** One router blocker protects every mounted private editor, including browser Back. */
export function UnsavedWorkProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const language = useRef(locale);
  language.current = locale;
  const editors = useRef(new Set<symbol>());
  const register = useCallback<Registration>((key, dirty) => {
    if (dirty) editors.current.add(key);
    else editors.current.delete(key);
  }, []);
  const hasUnsavedWork = useCallback(() => editors.current.size > 0, []);
  const shouldBlock = useCallback(() => {
    if (!hasUnsavedWork()) return false;
    const message =
      language.current === "ar"
        ? "عندك تعديلات غير محفوظة. لو خرجت هتضيع. تخرج من غير حفظ؟"
        : "You have unsaved changes. Leaving will discard them. Leave without saving?";
    return typeof window === "undefined" || !window.confirm(message);
  }, [hasUnsavedWork]);
  useBlocker({ shouldBlockFn: shouldBlock, enableBeforeUnload: hasUnsavedWork });
  return <UnsavedWorkContext.Provider value={register}>{children}</UnsavedWorkContext.Provider>;
}

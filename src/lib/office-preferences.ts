import { useEffect, useState } from "react";
export const OFFICE_PREFERENCES = "slams.office.preferences.v1";
const CHANGE_EVENT = "slams-office-preferences";
export type OfficePreferences = { motion: boolean; sound: boolean };
const defaults: OfficePreferences = { motion: true, sound: false };
export function useOfficePreferences() {
  const [preferences, setPreferences] = useState(defaults);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        const value: unknown = JSON.parse(localStorage.getItem(OFFICE_PREFERENCES) ?? "null");
        if (
          value &&
          typeof value === "object" &&
          "motion" in value &&
          "sound" in value &&
          typeof value.motion === "boolean" &&
          typeof value.sound === "boolean"
        )
          setPreferences({ motion: value.motion, sound: value.sound });
      } catch {
        /* Retain usable defaults when storage is inaccessible. */
      }
    };
    sync();
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches);
    motion();
    media.addEventListener("change", motion);
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      media.removeEventListener("change", motion);
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);
  function updatePreferences(next: OfficePreferences) {
    setPreferences(next);
    try {
      localStorage.setItem(OFFICE_PREFERENCES, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      /* Current-page preferences remain usable without persistence. */
    }
  }
  return {
    preferences,
    updatePreferences,
    reducedMotion,
    animate: preferences.motion && !reducedMotion,
  };
}

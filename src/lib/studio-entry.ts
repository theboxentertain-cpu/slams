import { useEffect, useState } from "react";
/** A device entry preference, never an identity or permission signal. */
export const STUDIO_ENTRY_COOKIE = "slams_studio_entered";
const ENTRY_EVENT = "slams-studio-entry";
let enteredInThisTab = false;
export function hasEnteredStudio() {
  if (enteredInThisTab) return true;
  try {
    if (document.cookie.split(";").some((part) => part.trim() === `${STUDIO_ENTRY_COOKIE}=1`))
      return true;
  } catch {
    /* Entry can still be remembered in this tab. */
  }
  // Existing app users predate this cookie. Recognize their device without
  // parsing, changing or importing any saved records or settings.
  try {
    return [
      "slams.passport.v1",
      "slams.audition.v1",
      "slams.office.preferences.v1",
      "slams.director.v1",
    ].some((key) => localStorage.getItem(key) !== null);
  } catch {
    return false;
  }
}
export function enterStudio() {
  enteredInThisTab = true;
  try {
    document.cookie = `${STUDIO_ENTRY_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {
    /* Still enter in this tab if cookies are unavailable. */
  }
  window.dispatchEvent(new Event(ENTRY_EVENT));
}
export function useStudioEntry(initial = false) {
  const [entered, setEntered] = useState(initial);
  useEffect(() => {
    const sync = () => setEntered(hasEnteredStudio());
    sync();
    window.addEventListener(ENTRY_EVENT, sync);
    return () => window.removeEventListener(ENTRY_EVENT, sync);
  }, [initial]);
  return entered || initial;
}

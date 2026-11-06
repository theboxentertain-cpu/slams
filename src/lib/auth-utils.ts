// Pure auth helpers (unit-tested). No Supabase calls here.

/** True when the URL hash carries a password-recovery session (#type=recovery&...). */
export function parseRecoveryHash(hash: string): boolean {
  if (!hash) return false;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" && !!params.get("access_token");
}

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

/** Basic email shape check for form UX only (the server remains authoritative). */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

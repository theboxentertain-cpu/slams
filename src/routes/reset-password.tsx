import { T } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseRecoveryHash, validatePassword } from "@/lib/auth-utils";
import { Wordmark, btnPrimary } from "@/components/slams";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Set a new password — SLAMS" },
      { name: "description", content: "Choose a new password for your SLAMS account." },
      { property: "og:title", content: "Set a new password — SLAMS" },
      { property: "og:description", content: "Choose a new password for your SLAMS account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link lands here with #type=recovery&access_token=… and the
    // Supabase client exchanges it for a session automatically.
    if (parseRecoveryHash(window.location.hash)) {
      setValid(true);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValid(true);
    });
    const t = setTimeout(() => setValid((v) => (v === null ? false : v)), 3000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const pw = validatePassword(password);
    if (pw) return setError(pw);
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => navigate({ to: "/" }), 1500);
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <Link to="/" aria-label="SLAMS home">
        <Wordmark small />
      </Link>
      <main id="page-content" tabIndex={-1} className="panel mt-8 w-full max-w-sm p-6">
        <h1 className="text-xl font-bold">
          <T>Set a new password</T>
        </h1>
        {valid === null ? (
          <p role="status" className="mt-2 text-sm">
            <T>Checking your reset link…</T>
          </p>
        ) : valid === false ? (
          <>
            <p role="alert" className="mt-2 text-sm text-crimson">
              <T>This reset link is invalid or has expired. Request a new one.</T>
            </p>
            <Link to="/auth" className={`${btnPrimary} mt-4`}>
              <T>Back to sign in</T>
            </Link>
          </>
        ) : done ? (
          <p role="status" className="mt-2 text-sm text-amber">
            <T>Password updated. Taking you back to the studio…</T>
          </p>
        ) : (
          <form className="mt-4 grid gap-3" onSubmit={submit}>
            <label className="grid gap-1 text-sm">
              <T>New password</T>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border border-input bg-background p-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <T>Confirm new password</T>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded border border-input bg-background p-2"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-crimson">
                {error}
              </p>
            )}
            <button className={btnPrimary} disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

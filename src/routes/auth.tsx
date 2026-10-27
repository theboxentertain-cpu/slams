import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { looksLikeEmail, validatePassword } from "@/lib/auth-utils";
import { Wordmark, btnPrimary, btnSecondary } from "@/components/slams";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SLAMS" },
      { name: "description", content: "Sign in or create an account to save your rehearsal progress." },
      { property: "og:title", content: "Sign in — SLAMS" },
      { property: "og:description", content: "Sign in or create an account to save your rehearsal progress." },
    ],
  }),
  component: Auth,
});

type Mode = "signin" | "signup" | "forgot";

function Auth() {
  const { user, loading, signOut } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!looksLikeEmail(email)) return setError("Enter a valid email address.");
    if (mode !== "forgot") {
      const pw = validatePassword(password);
      if (pw) return setError(pw);
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return setError(error.message);
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) return setError(error.message);
        if (!data.session) {
          setNotice("Account created. Check your email to confirm your address, then sign in.");
          setMode("signin");
        } else {
          navigate({ to: "/" });
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return setError(error.message);
        setNotice("If that email has an account, a password-reset link is on its way.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reach your account. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <Link to="/" aria-label="SLAMS home"><Wordmark small /></Link>
      <main className="panel mt-8 w-full max-w-sm p-6">
        {loading ? (
          <p role="status">Loading…</p>
        ) : user ? (
          <div className="text-center">
            <h1 className="text-xl font-bold">Signed in</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/" className={btnPrimary}>Back to the studio</Link>
              <Button variant="secondary"
                type="button"
                className={btnSecondary}
                onClick={async () => { try { await signOut(); } catch { setError("Sign-out failed. Try again."); } }}
              >
                Sign out
              </Button>
              {error && <p role="alert" className="text-destructive">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "forgot"
                ? "We'll email you a link to set a new password."
                : "Save your Passport, rehearsals and audition prep to your account."}
            </p>
            <form className="mt-4 grid gap-3" onSubmit={submit}>
              <label className="grid gap-1 text-sm">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded border border-input bg-background p-2"
                />
              </label>
              {mode !== "forgot" && (
                <label className="grid gap-1 text-sm">
                  Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded border border-input bg-background p-2"
                  />
                </label>
              )}
              {error && <p role="alert" className="text-sm text-crimson">{error}</p>}
              {notice && <p role="status" className="text-sm text-amber">{notice}</p>}
              <button className={btnPrimary} disabled={busy}>
                {busy ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {mode !== "signin" && (
                <button type="button" className="underline" onClick={() => { setMode("signin"); setError(null); setNotice(null); }}>
                  Sign in
                </button>
              )}
              {mode !== "signup" && (
                <button type="button" className="underline" onClick={() => { setMode("signup"); setError(null); setNotice(null); }}>
                  Create account
                </button>
              )}
              {mode !== "forgot" && (
                <button type="button" className="underline" onClick={() => { setMode("forgot"); setError(null); setNotice(null); }}>
                  Forgot password?
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

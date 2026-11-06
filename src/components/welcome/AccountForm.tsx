import { T, useLanguage } from "@/lib/i18n";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { looksLikeEmail, validatePassword } from "@/lib/auth-utils";
import { enterStudio } from "@/lib/studio-entry";
import type { AuthMode } from "@/lib/welcome-auth";
export function AccountForm({
  mode,
  onModeChange,
  welcome = false,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  welcome?: boolean;
}) {
  const { user, loading, signOut } = useSession();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  function changeMode(next: AuthMode) {
    setError(null);
    setNotice(null);
    onModeChange(next);
  }
  async function finish() {
    if (!active.current) return;
    enterStudio();
    await navigate({ to: welcome ? "/scene" : "/" });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!looksLikeEmail(email)) return setError("Enter a valid email address.");
    if (mode !== "forgot") {
      const message = validatePassword(password);
      if (message) return setError(message);
    }
    if (mode === "signup" && password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (!active.current) return;
        if (error) return setError(error.message);
        await finish();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            ...(name.trim() ? { data: { display_name: name.trim() } } : {}),
          },
        });
        if (!active.current) return;
        if (error) return setError(error.message);
        setPassword("");
        setConfirm("");
        if (!data.session) {
          setNotice("Account created. Check your email to confirm your address, then sign in.");
          onModeChange("signin");
        } else await finish();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (!active.current) return;
        if (error) return setError(error.message);
        setNotice("If that email has an account, a password-reset link is on its way.");
      }
    } catch (cause) {
      if (active.current)
        setError(
          cause instanceof Error ? cause.message : "Could not reach your account. Try again.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  if (loading) return <p role="status"><T>Checking your account…</T></p>;
  if (user)
    return (
      <section className="account-form">
        <h2><T>Signed in</T></h2>
        <p>{user.email}</p>
        <Link
          className={welcome ? "welcome-primary" : "account-submit"}
          to={welcome ? "/scene" : "/"}
          onClick={() => {
            enterStudio();
          }}
        >
          {t(welcome ? "Start a first rehearsal" : "Back to the studio")}
        </Link>
        <button
          className="account-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut();
            } catch {
              setError("Sign-out failed. Try again.");
            } finally {
              if (active.current) setBusy(false);
            }
          }}
        ><T>
          Sign out
        </T></button>
        {error && <p role="alert">{t(error)}</p>}
      </section>
    );
  return (
    <section className="account-form">
      <h2>
        {t(mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password")}
      </h2>
      <p>
        {t(
          mode === "forgot"
            ? "We’ll email you a link to set a new password."
            : "Save your Passport, rehearsal reflections and audition preparation to your account.",
        )}
      </p>
      <form onSubmit={submit} className="account-fields">
        {mode === "signup" && (
          <label>
            <span><T>
              Full name </T><small><T>(optional)</T></small>
            </span>
            <input
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={busy}
            />
          </label>
        )}
        <label><T>
          Email
          </T><input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </label>
        {mode !== "forgot" && (
          <label><T>
            Password
            </T><span className="password-control">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                aria-label={t(showPassword ? "Hide password" : "Show password")}
                aria-pressed={showPassword}
                disabled={busy}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>
        )}
        {mode === "signup" && (
          <>
            <label><T>
              Confirm password
              </T><span className="password-control">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  aria-label={t(showConfirm ? "Hide confirmation" : "Show confirmation")}
                  aria-pressed={showConfirm}
                  disabled={busy}
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </span>
            </label>
            <p className="password-hint">
              {t("At least 8 characters.")}{" "}
              {password.length >= 8
                ? t("Length requirement met.")
                : `${Math.min(password.length, 8)} of 8 entered.`}
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="account-error">
            {t(error)}
          </p>
        )}
        {notice && (
          <p role="status" className="account-notice">
            {t(notice)}
          </p>
        )}
        <button
          type="submit"
          className={welcome ? "welcome-primary" : "account-submit"}
          disabled={busy}
        >
          {t(
            busy
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in",
          )}
        </button>
      </form>
      <div className="account-mode-links">
        {mode !== "signin" && (
          <button disabled={busy} onClick={() => changeMode("signin")}><T>
            Sign in
          </T></button>
        )}
        {mode !== "signup" && (
          <button disabled={busy} onClick={() => changeMode("signup")}><T>
            Create account
          </T></button>
        )}
        {mode !== "forgot" && (
          <button disabled={busy} onClick={() => changeMode("forgot")}><T>
            Forgot password?
          </T></button>
        )}
      </div>
      {welcome && (
        <>
          <p className="account-provider-note"><T>
            Email sign-in is available. Social sign-in is not enabled.
          </T></p>
          <Link className="account-guest" to="/scene" onClick={enterStudio}><T>
            Continue as guest
          </T></Link>
        </>
      )}
    </section>
  );
}

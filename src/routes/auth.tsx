import { T } from "@/lib/i18n";
import { createFileRoute, Link, type SearchSchemaInput } from "@tanstack/react-router";
import { Wordmark } from "@/components/slams";
import { AccountForm } from "@/components/welcome/AccountForm";
import { parseAuthSearch } from "@/lib/welcome-auth";
import { WelcomeFrame } from "@/components/welcome/WelcomeFrame";
export const Route = createFileRoute("/auth")({
  validateSearch: (input: Record<string, unknown> & SearchSchemaInput) => parseAuthSearch(input),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — SLAMS" },
      {
        name: "description",
        content: "Sign in or create an account to save your rehearsal progress.",
      },
      { property: "og:title", content: "Sign in — SLAMS" },
      {
        property: "og:description",
        content: "Sign in or create an account to save your rehearsal progress.",
      },
    ],
  }),
  component: Auth,
});
function Auth() {
  const { mode, flow } = Route.useSearch();
  const navigate = Route.useNavigate();
  const form = (
    <AccountForm
      mode={mode}
      welcome={flow === "welcome"}
      onModeChange={(mode) => void navigate({ search: (prior) => ({ ...prior, mode }) })}
    />
  );
  return flow === "welcome" ? (
    <WelcomeFrame
      title={
        mode === "signup"
          ? "Create Your Account"
          : mode === "forgot"
            ? "A fresh start."
            : "Welcome back, Actor."
      }
      subtitle={
        mode === "signup" ? "Keep your work. Return to your next page." : "Your studio is waiting."
      }
      back="/welcome/account"
    >
      <div className="welcome-paper account-paper">{form}</div>
    </WelcomeFrame>
  ) : (
    <div className="standard-auth">
      <Link to="/" aria-label="SLAMS home">
        <Wordmark small />
      </Link>
      <main id="page-content" tabIndex={-1} className="standard-auth-panel">
        <h1 className="sr-only">
          <T>Your SLAMS account</T>
        </h1>
        {form}
        <Link className="account-tour" to="/welcome">
          <T>New to the studio? Take a look.</T>
        </Link>
      </main>
    </div>
  );
}

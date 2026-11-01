import { useState, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AccountForm } from "@/components/welcome/AccountForm";
import { parseAuthSearch, type AuthMode } from "@/lib/welcome-auth";
const mock = vi.hoisted(() => ({
  navigate: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: mock.signIn,
      signUp: mock.signUp,
      resetPasswordForEmail: mock.reset,
    },
  },
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mock.navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
function Host({ initial = "signup" }: { initial?: AuthMode }) {
  const [mode, setMode] = useState(initial);
  return <AccountForm mode={mode} onModeChange={setMode} welcome />;
}
beforeEach(() => {
  vi.resetAllMocks();
  mock.navigate.mockResolvedValue(undefined);
  mock.signIn.mockResolvedValue({ error: null });
  mock.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mock.reset.mockResolvedValue({ error: null });
});
afterEach(cleanup);
function fillSignup() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "actor@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "FixturePassword1" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "FixturePassword1" },
  });
}
it("rejects mismatched passwords before calling the real SDK contract", () => {
  render(<Host />);
  fillSignup();
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "DifferentFixture1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(mock.signUp).not.toHaveBeenCalled();
  expect(mock.navigate).not.toHaveBeenCalled();
});
it("preserves the confirmation redirect and optional name without inventing a signed-in session", async () => {
  render(<Host />);
  fillSignup();
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: " Test Actor " } });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Check your email"));
  expect(mock.signUp).toHaveBeenCalledWith({
    email: "actor@example.test",
    password: "FixturePassword1",
    options: { emailRedirectTo: window.location.origin, data: { display_name: "Test Actor" } },
  });
  expect(mock.navigate).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toHaveValue("");
});
it("continues to the bounded setup route after successful email sign-in", async () => {
  render(<Host initial="signin" />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "actor@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "FixturePassword1" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(mock.navigate).toHaveBeenCalledWith({ to: "/welcome/setup" }));
});
it("retains recovery behavior and exposes password visibility accessibly", async () => {
  render(<Host initial="signin" />);
  const password = screen.getByLabelText("Password");
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(password).toHaveAttribute("type", "text");
  expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "actor@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  await waitFor(() =>
    expect(mock.reset).toHaveBeenCalledWith("actor@example.test", {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
  );
});
it("preserves SDK callback parameters and ignores external flow destinations", () => {
  expect(
    parseAuthSearch({ mode: "nonsense", flow: "https://example.test", code: "fixture-callback" }),
  ).toEqual({ mode: "signin", flow: undefined, code: "fixture-callback" });
  expect(parseAuthSearch({ mode: "signup", flow: "welcome" })).toEqual({
    mode: "signup",
    flow: "welcome",
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDeletion } from "@/components/foundation/AccountDeletion";

const mock = vi.hoisted(() => ({
  available: vi.fn(),
  deleteAccount: vi.fn(),
  signOut: vi.fn(),
  user: { id: "owner-a" } as { id: string } | null,
}));
vi.mock("@/lib/account-lifecycle.functions", () => ({
  getAccountDeletionAvailability: mock.available,
  deleteAccount: mock.deleteAccount,
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: mock.user, loading: false, signOut: mock.signOut }),
}));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: "en" }) }));
vi.mock("@/components/slams", () => ({ btnSecondary: "secondary" }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

beforeEach(() => {
  vi.resetAllMocks();
  mock.user = { id: "owner-a" };
  mock.available.mockResolvedValue({ available: true });
  mock.deleteAccount.mockResolvedValue({ ok: false, code: "reauthentication_failed" });
  mock.signOut.mockResolvedValue(undefined);
});
afterEach(cleanup);

async function openForm() {
  fireEvent.click(await screen.findByRole("button", { name: "Delete my account…" }));
}
function fillForm() {
  fireEvent.change(screen.getByLabelText("Current account password"), {
    target: { value: "current-secret" },
  });
  fireEvent.change(screen.getByLabelText("Type DELETE MY ACCOUNT to confirm"), {
    target: { value: "DELETE MY ACCOUNT" },
  });
}

describe("Account deletion UI", () => {
  it("fails closed when secure deletion is unavailable", async () => {
    mock.available.mockResolvedValue({ available: false });
    render(<AccountDeletion />);
    expect(await screen.findByText(/Secure account deletion is unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete my account…" })).not.toBeInTheDocument();
    expect(mock.deleteAccount).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation and password, then clears the submitted password", async () => {
    render(<AccountDeletion />);
    await openForm();
    const submit = screen.getByRole("button", { name: "Permanently delete my account" });
    expect(submit).toBeDisabled();
    fillForm();
    fireEvent.click(submit);
    await waitFor(() =>
      expect(mock.deleteAccount).toHaveBeenCalledWith({
        data: {
          expectedUserId: "owner-a",
          confirmation: "DELETE MY ACCOUNT",
          password: "current-secret",
        },
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not verify your current password/,
    );
    expect(screen.getByLabelText("Current account password")).toHaveValue("");
    expect(mock.signOut).not.toHaveBeenCalled();
  });

  it("shows an honest retry state on partial cleanup without claiming deletion", async () => {
    mock.deleteAccount.mockResolvedValue({ ok: false, code: "cleanup_incomplete" });
    render(<AccountDeletion />);
    await openForm();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Deletion has not finished/);
    expect(screen.getByRole("alert")).toHaveTextContent(/Some data may already be deleted/);
    expect(mock.signOut).not.toHaveBeenCalled();
  });

  it("signs out only after the server confirms account and resource deletion", async () => {
    mock.deleteAccount.mockResolvedValue({ ok: true, code: "deleted", receiptPending: false });
    render(<AccountDeletion />);
    await openForm();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete my account" }));
    await waitFor(() => expect(mock.signOut).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your account and owned cloud data have been deleted.",
    );
    expect(screen.queryByLabelText("Current account password")).not.toBeInTheDocument();
  });

  it("does not sign out a replacement account when a previous account's response arrives late", async () => {
    let finish!: (result: unknown) => void;
    mock.deleteAccount.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { rerender } = render(<AccountDeletion />);
    await openForm();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete my account" }));
    mock.user = { id: "owner-b" };
    rerender(<AccountDeletion />);
    finish({ ok: true, code: "deleted", receiptPending: false });
    await screen.findByRole("button", { name: "Delete my account…" });
    expect(mock.signOut).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Your account and owned cloud data have been deleted."),
    ).not.toBeInTheDocument();
  });
});

import { useState, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuditionFile } from "@/components/foundation/WorkspacePages";
import { AUDITION_KEY } from "@/lib/store";
const mock = vi.hoisted(() => ({
  user: null as { id: string } | null,
  read: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => ({ user: mock.user, loading: false }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mock.read }) }),
      upsert: mock.upsert,
    }),
  },
}));
vi.mock("@/components/slams", () => ({
  Page: ({ children }: { children: ReactNode }) => <main>{children}</main>,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
function Host() {
  const [tab, setTab] = useState("preparation");
  return <AuditionFile tab={tab} onTabChange={setTab} />;
}
function selectTab(name: string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }), {
    button: 0,
    ctrlKey: false,
  });
}
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  mock.user = null;
  mock.read.mockResolvedValue({ data: { data: { role: "Previous cloud role" } }, error: null });
  mock.upsert.mockImplementation((row: { user_id: string; data: Record<string, string> }) => ({
    select: () => ({ single: async () => ({ data: row, error: null }) }),
  }));
});
afterEach(cleanup);
it("keeps an unsaved audition draft through tab changes and updates the brief only after saving", async () => {
  render(<Host />);
  const input = await screen.findByRole("textbox", { name: "Role & project" });
  fireEvent.change(input, { target: { value: "Unsaved test preparation" } });
  selectTab("Brief");
  expect(within(screen.getByRole("tabpanel")).getByText("Not entered")).toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "Role & project" })).toBeNull();
  selectTab("Preparation");
  expect(screen.getByRole("textbox", { name: "Role & project" })).toHaveValue(
    "Unsaved test preparation",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save audition prep" }));
  await screen.findByText("Saved in this browser.");
  expect(JSON.parse(localStorage.getItem(AUDITION_KEY)!)).toMatchObject({
    role: "Unsaved test preparation",
  });
  selectTab("Brief");
  expect(
    within(screen.getByRole("tabpanel")).getByText("Unsaved test preparation"),
  ).toBeInTheDocument();
});
it("shares confirmed account saves with the brief instead of a stale independent cloud hook", async () => {
  mock.user = { id: "owner" };
  render(<Host />);
  const input = await screen.findByRole("textbox", { name: "Role & project" });
  await waitFor(() => expect(input).toHaveValue("Previous cloud role"));
  fireEvent.change(input, { target: { value: "Confirmed account preparation" } });
  fireEvent.click(screen.getByRole("button", { name: "Save audition prep" }));
  await screen.findByText("Saved to your account.");
  selectTab("Brief");
  expect(
    within(screen.getByRole("tabpanel")).getByText("Confirmed account preparation"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Previous cloud role")).toBeNull();
  expect(mock.read).toHaveBeenCalledTimes(1);
});

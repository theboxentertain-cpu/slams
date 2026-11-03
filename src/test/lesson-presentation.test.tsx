import type { AnchorHTMLAttributes } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CurriculumUnit } from "@/components/CurriculumUnit";

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  loading: false,
  read: vi.fn(),
  owner: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  useSession: () => ({ user: state.user, loading: state.loading }),
}));
vi.mock("@/lib/unit-progress", () => ({ saveUnitProgress: state.save }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ eq: state.owner }) }) },
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props} />
  ),
}));
const fixture = {
  id: "test-only-unit",
  title: "Unit fixture — not curriculum",
  content: "TEST ONLY: this is a multiline unit fixture.\nIt is not teaching material.",
  status: "published",
  reviewed: true,
};
const clients: QueryClient[] = [];
function show(overrides: Partial<typeof fixture> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <CurriculumUnit unit={{ ...fixture, ...overrides }} kind="lesson" presentation="lesson" />
    </QueryClientProvider>,
  );
  return client;
}
beforeEach(() => {
  vi.resetAllMocks();
  state.user = null;
  state.loading = false;
  state.owner.mockReturnValue({ eq: state.owner, maybeSingle: state.read });
  state.read.mockResolvedValue({ data: { status: "started" }, error: null });
  state.save.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

it("opens reviewed lesson text directly and gives guests a real sign-in action", () => {
  show();
  expect(screen.getByRole("article", { name: `${fixture.title} — lesson` })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Reviewed unit material" })).toHaveTextContent(
    "TEST ONLY: this is a multiline unit fixture.",
  );
  expect(document.querySelector("details")).toBeNull();
  expect(screen.getByRole("link", { name: "Sign in to save unit progress" })).toHaveAttribute(
    "href",
    "/auth",
  );
  expect(screen.queryByRole("button", { name: /Start unit|Mark complete/ })).toBeNull();
  expect(state.read).not.toHaveBeenCalled();
});
it.each([
  { label: "draft", overrides: { status: "draft" } },
  { label: "unreviewed", overrides: { reviewed: false } },
  { label: "empty", overrides: { content: "   " } },
])("withholds $label lesson content and progress actions", ({ overrides }) => {
  show(overrides);
  expect(screen.queryByRole("region", { name: "Reviewed unit material" })).toBeNull();
  expect(screen.getByText("Coming soon — reviewed material is not available.")).toBeInTheDocument();
  expect(screen.queryByText(/TEST ONLY:/)).toBeNull();
  expect(screen.queryByRole("button", { name: /Start unit|Mark complete/ })).toBeNull();
});
it("waits for identity instead of presenting a guest progress decision while loading", () => {
  state.loading = true;
  show();
  expect(screen.getByRole("status")).toHaveTextContent("Checking your account");
  expect(screen.queryByRole("link", { name: "Sign in to save unit progress" })).toBeNull();
});
it("labels a legacy completion as unassessed and preserves its disabled activity action", async () => {
  state.user = { id: "owner-fixture" };
  state.read.mockResolvedValue({ data: { status: "completed" }, error: null });
  show();
  await screen.findByText("Legacy recorded completion (not assessed)");
  expect(screen.getByRole("button", { name: "Start unit" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Mark complete" })).toBeNull();
});
it("exposes a progress-load error and never presents an unknown record as not started", async () => {
  state.user = { id: "owner-fixture" };
  state.read.mockResolvedValue({ data: null, error: new Error("Fixture load failure") });
  show();
  await screen.findByRole("alert");
  expect(screen.getByRole("status")).toHaveTextContent("Saved activity unavailable.");
  expect(screen.queryByText("Not started")).toBeNull();
  expect(screen.getByRole("button", { name: "Start unit" })).toBeDisabled();
});
it("retains confirmed-save query refreshes and rejects self-awarded completion", async () => {
  state.user = { id: "owner-fixture" };
  const client = show();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const start = screen.getByRole("button", { name: "Start unit" });
  await waitFor(() => expect(start).toBeEnabled());
  fireEvent.click(start);
  await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3));
  expect(state.save).toHaveBeenCalledWith({
    unit_kind: "lesson",
    unit_id: fixture.id,
    status: "started",
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["training-progress", "owner-fixture"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["office-milestones", "owner-fixture"] });
  expect(screen.queryByRole("button", { name: "Mark complete" })).toBeNull();
});

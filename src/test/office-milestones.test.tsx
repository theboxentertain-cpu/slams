import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOfficeMilestones } from "@/components/office/useOfficeMilestones";

const mock = vi.hoisted(() => ({
  session: { user: { id: "a" } as { id: string } | null, loading: false },
  select: vi.fn(),
  owner: vi.fn(),
  status: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { user: { id: "a" }, loading: false };
  mock.from.mockReturnValue({ select: mock.select });
  mock.select.mockReturnValue({ eq: mock.owner });
  mock.owner.mockReturnValue({ eq: mock.status });
  mock.status.mockResolvedValue({ count: 3, error: null });
});
afterEach(cleanup);
function mounted() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const hook = renderHook(() => useOfficeMilestones(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client };
}
describe("Verified office milestones", () => {
  it("reads only the authenticated owner's completed count without retrieving private content", async () => {
    const hook = mounted();
    await waitFor(() => expect(hook.result.current).toBe(3));
    expect(mock.from).toHaveBeenCalledWith("unit_progress");
    expect(mock.select).toHaveBeenCalledWith("unit_id", { count: "exact", head: true });
    expect(mock.owner).toHaveBeenCalledWith("user_id", "a");
    expect(mock.status).toHaveBeenCalledWith("status", "completed");
  });
  it.each(["signed-out", "loading"])("does not query for a %s session", (state) => {
    if (state === "signed-out") mock.session.user = null;
    else mock.session.loading = true;
    const hook = mounted();
    expect(hook.result.current).toBeNull();
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("does not turn a failed count request into a milestone", async () => {
    mock.status.mockResolvedValue({ count: 99, error: { message: "Denied" } });
    const hook = mounted();
    await waitFor(() =>
      expect(hook.client.getQueryState(["office-milestones", "a"])?.status).toBe("error"),
    );
    expect(hook.result.current).toBeNull();
  });
  it("does not expose a late count from A after switching to B", async () => {
    let finish!: (value: { count: number; error: null }) => void;
    mock.status
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValueOnce({ count: 1, error: null });
    const hook = mounted();
    await waitFor(() => expect(mock.status).toHaveBeenCalledOnce());
    mock.session = { user: { id: "b" }, loading: false };
    hook.rerender();
    await waitFor(() => expect(hook.result.current).toBe(1));
    await act(async () => {
      finish({ count: 99, error: null });
    });
    expect(hook.result.current).toBe(1);
    expect(mock.owner).toHaveBeenLastCalledWith("user_id", "b");
    mock.session.user = null;
    hook.rerender();
    expect(hook.result.current).toBeNull();
  });
});

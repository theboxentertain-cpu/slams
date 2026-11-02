import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CurriculumUnit } from "@/components/CurriculumUnit";
const mock = vi.hoisted(() => ({ save: vi.fn(), read: vi.fn(), owner: vi.fn() }));
vi.mock("@/lib/session", () => ({ useSession: () => ({ user: { id: "owner" }, loading: false }) }));
vi.mock("@/lib/unit-progress", () => ({ saveUnitProgress: mock.save }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ eq: mock.owner }) }) },
}));
vi.mock("@tanstack/react-router", () => ({ Link: () => null }));
beforeEach(() => {
  vi.resetAllMocks();
  mock.owner.mockReturnValue({ eq: mock.owner, maybeSingle: mock.read });
  mock.read.mockResolvedValue({ data: { status: "started" }, error: null });
  mock.save.mockResolvedValue(undefined);
});
afterEach(cleanup);
it("refreshes the unit, account summary and office milestones only after a confirmed save", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <CurriculumUnit
        unit={{
          id: "fixture",
          title: "Test fixture, not curriculum",
          content: "Test only",
          status: "published",
          reviewed: true,
        }}
        kind="lesson"
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByText(/Test fixture, not curriculum/));
  await waitFor(() => expect(screen.getByRole("button", { name: "Mark complete" })).toBeEnabled());
  mock.save.mockRejectedValueOnce(new Error("Rejected"));
  fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Rejected"));
  expect(invalidate).not.toHaveBeenCalled();
  mock.save.mockResolvedValueOnce(undefined);
  fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["training-progress", "owner"] }),
  );
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["office-milestones", "owner"] });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ["unit-progress", "owner", "lesson", "fixture"],
  });
});

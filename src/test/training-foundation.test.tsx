import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  flattenCatalog,
  resolveResume,
  schoolHasProgress,
  useTrainingProgress,
  type Catalog,
  type ProgressRecord,
} from "@/lib/training";
import { primarySection, validateTab } from "@/lib/foundation";

const mock = vi.hoisted(() => ({
  session: { user: { id: "a" } as { id: string } | null, loading: false },
  from: vi.fn(),
  select: vi.fn(),
  owner: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));
vi.mock("@/lib/curriculum.functions", () => ({ getCurriculum: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
const row: ProgressRecord = {
  unit_kind: "course",
  unit_id: "fixture-course",
  status: "started",
  updated_at: "2026-01-01T00:00:00Z",
};
// Synthetic metadata exists only in this test; it is never shipped as teaching.
const catalog = [
  {
    slug: "meisner",
    curriculum_years: [
      {
        number: 1,
        curriculum_terms: [
          {
            number: 1,
            status: "published",
            curriculum_courses: [
              {
                id: "fixture-course",
                title: "Test fixture",
                content: "Fixture, not curriculum",
                reviewed: true,
                status: "published",
                curriculum_workshops: [],
              },
            ],
          },
        ],
      },
    ],
  },
] as unknown as Catalog;
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { user: { id: "a" }, loading: false };
  mock.from.mockReturnValue({ select: mock.select });
  mock.select.mockReturnValue({ eq: mock.owner });
  mock.owner.mockReturnValue({ order: mock.order });
  mock.order.mockReturnValue({ order: mock.order, range: mock.range });
  mock.range.mockReturnValue({ abortSignal: mock.read });
  mock.read.mockResolvedValue({ data: [row], error: null, count: 1 });
});
afterEach(cleanup);
function mounted() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return {
    ...renderHook(() => useTrainingProgress(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }),
    client,
  };
}
describe("Foundation training and routing", () => {
  it("resumes only a saved started unit with published parents and reviewed material", () => {
    const units = flattenCatalog(catalog);
    expect(resolveResume(units, [row])?.id).toBe(row.unit_id);
    expect(resolveResume(units, [{ ...row, status: "completed" }])).toBeNull();
    expect(resolveResume(units, [{ ...row, unit_kind: "lesson" }])).toBeNull();
    expect(resolveResume([{ ...units[0]!, available: false }], [row])).toBeNull();
    expect(schoolHasProgress("adler", units, [row])).toBe(false);
    expect(schoolHasProgress("meisner", units, [row])).toBe(true);
  });
  it("blocks unreviewed content and unpublished ancestors without modifying canonical structure", () => {
    const unreviewed = structuredClone(catalog);
    unreviewed[0]!.curriculum_years[0]!.curriculum_terms[0]!.curriculum_courses[0]!.reviewed = false;
    expect(flattenCatalog(unreviewed)[0]!.available).toBe(false);
    const unpublished = structuredClone(catalog);
    unpublished[0]!.curriculum_years[0]!.curriculum_terms[0]!.status = "in-development";
    expect(flattenCatalog(unpublished)[0]!.available).toBe(false);
    expect(flattenCatalog([])).toEqual([]);
  });
  it("filters reads by authenticated owner and gives cancellation to Supabase", async () => {
    const hook = mounted();
    await waitFor(() => expect(hook.result.current.records).toEqual([row]));
    expect(mock.from).toHaveBeenCalledWith("unit_progress");
    expect(mock.owner).toHaveBeenCalledWith("user_id", "a");
    expect(mock.read.mock.calls[0]![0]).toBeInstanceOf(AbortSignal);
  });
  it.each(["signed-out", "loading"])("makes no private request for %s identity", (state) => {
    if (state === "signed-out") mock.session.user = null;
    else mock.session.loading = true;
    const hook = mounted();
    expect(hook.result.current.records).toBeNull();
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("keeps failed requests unknown rather than treating them as zero", async () => {
    mock.read.mockResolvedValue({ data: [row], error: new Error("Denied") });
    const hook = mounted();
    await waitFor(() => expect(hook.result.current.error).toBeTruthy());
    expect(hook.result.current.records).toBeNull();
  });
  it("reads beyond the backend page limit before computing counts", async () => {
    const first = Array.from({ length: 1000 }, (_, i) => ({ ...row, unit_id: `fixture-${i}` }));
    mock.read
      .mockResolvedValueOnce({ data: first, error: null, count: 1001 })
      .mockResolvedValueOnce({ data: [row], error: null, count: 1001 });
    const hook = mounted();
    await waitFor(() => expect(hook.result.current.records).toHaveLength(1001));
    expect(mock.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(mock.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
  it("does not report partial results as complete when backend pagination is truncated", async () => {
    mock.read.mockResolvedValue({ data: [row], error: null, count: 2 });
    const hook = mounted();
    await waitFor(() => expect(hook.result.current.error).toBeTruthy());
    expect(hook.result.current.records).toBeNull();
  });
  it("hides A during transition and rejects a late A result after B", async () => {
    let finish!: (value: unknown) => void;
    mock.read
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValueOnce({ data: [], error: null, count: 0 });
    const hook = mounted();
    await waitFor(() => expect(mock.read).toHaveBeenCalledOnce());
    mock.session = { user: { id: "b" }, loading: true };
    hook.rerender();
    expect(hook.result.current.records).toBeNull();
    mock.session.loading = false;
    hook.rerender();
    await waitFor(() => expect(hook.result.current.records).toEqual([]));
    await act(async () => finish({ data: [row], error: null, count: 1 }));
    expect(hook.result.current.records).toEqual([]);
    mock.session.user = null;
    hook.rerender();
    expect(hook.result.current.records).toBeNull();
  });
  it("validates tab URLs and assigns only real parent sections", () => {
    expect(validateTab("school", { tab: "curriculum" })).toEqual({ tab: "curriculum" });
    expect(validateTab("school", { tab: "invalid" })).toEqual({ tab: "overview" });
    expect(primarySection("/conservatory/meisner/years/1")).toBe("/conservatory");
    expect(primarySection("/work/character")).toBe("/work");
    expect(primarySection("/lab")).toBe("/rehearsal");
    expect(primarySection("/progress")).toBeNull();
    expect(primarySection("/workshop")).toBeNull();
  });
});

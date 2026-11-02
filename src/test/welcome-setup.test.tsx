import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTOR_GOALS,
  EMPTY_SETUP,
  readActorSetup,
  setupKey,
  useActorSetup,
  writeActorSetup,
} from "@/lib/actor-setup";
const mock = vi.hoisted(() => ({
  session: { user: null as { id: string } | null, loading: false },
}));
vi.mock("@/lib/session", () => ({ useSession: () => mock.session }));
beforeEach(() => {
  localStorage.clear();
  mock.session = { user: null, loading: false };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Optional actor setup", () => {
  it("saves only the new guest preferences and preserves existing records", async () => {
    localStorage.setItem("slams.passport.v1", "keep Passport");
    localStorage.setItem("slams.audition.v1", "keep audition");
    const hook = renderHook(() => useActorSetup());
    await waitFor(() => expect(hook.result.current.ready).toBe(true));
    act(() =>
      hook.result.current.update((value) => ({
        ...value,
        experience: "Beginner",
        goals: [ACTOR_GOALS[2]],
      })),
    );
    act(() => expect(hook.result.current.save()).toBe(true));
    expect(readActorSetup("guest")).toMatchObject({
      experience: "Beginner",
      goals: [ACTOR_GOALS[2]],
    });
    expect(localStorage.getItem("slams.passport.v1")).toBe("keep Passport");
    expect(localStorage.getItem("slams.audition.v1")).toBe("keep audition");
  });
  it("keeps guest, A and B preferences isolated and hides A during identity loading", async () => {
    writeActorSetup("guest", { ...EMPTY_SETUP, experience: "Some experience" });
    writeActorSetup("a", { ...EMPTY_SETUP, experience: "Beginner" });
    writeActorSetup("b", { ...EMPTY_SETUP, experience: "Professional / advanced" });
    mock.session = { user: { id: "a" }, loading: false };
    const hook = renderHook(() => useActorSetup());
    await waitFor(() => expect(hook.result.current.data.experience).toBe("Beginner"));
    mock.session.loading = true;
    hook.rerender();
    expect(hook.result.current.ready).toBe(false);
    expect(hook.result.current.data.experience).toBeNull();
    mock.session = { user: { id: "b" }, loading: false };
    hook.rerender();
    await waitFor(() =>
      expect(hook.result.current.data.experience).toBe("Professional / advanced"),
    );
    act(() => hook.result.current.update((value) => ({ ...value, goals: [ACTOR_GOALS[3]] })));
    act(() => hook.result.current.save());
    expect(readActorSetup("a").goals).toEqual([]);
    expect(readActorSetup("guest").experience).toBe("Some experience");
    mock.session = { user: null, loading: false };
    hook.rerender();
    await waitFor(() => expect(hook.result.current.data.experience).toBe("Some experience"));
  });
  it("retains an unsaved draft through refresh of the same identity", async () => {
    mock.session = { user: { id: "a" }, loading: false };
    const hook = renderHook(() => useActorSetup());
    await waitFor(() => expect(hook.result.current.ready).toBe(true));
    act(() => hook.result.current.update((value) => ({ ...value, experience: "Working actor" })));
    mock.session.loading = true;
    hook.rerender();
    expect(hook.result.current.ready).toBe(false);
    mock.session.loading = false;
    hook.rerender();
    await waitFor(() => expect(hook.result.current.data.experience).toBe("Working actor"));
  });
  it("keeps drafts and previous saved data when storage fails", async () => {
    writeActorSetup("guest", { ...EMPTY_SETUP, experience: "Beginner" });
    const hook = renderHook(() => useActorSetup());
    await waitFor(() => expect(hook.result.current.ready).toBe(true));
    act(() => hook.result.current.update((value) => ({ ...value, experience: "Working actor" })));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    act(() => expect(hook.result.current.save()).toBe(false));
    expect(hook.result.current.data.experience).toBe("Working actor");
    expect(hook.result.current.error).toMatch(/could not be saved/);
    expect(readActorSetup("guest").experience).toBe("Beginner");
  });
  it("does not silently overwrite malformed saved setup or accept an unsupported language", async () => {
    const raw = JSON.stringify({ ...EMPTY_SETUP, language: "ar" });
    localStorage.setItem(setupKey("guest"), raw);
    const hook = renderHook(() => useActorSetup());
    await waitFor(() => expect(hook.result.current.error).toMatch(/could not be read/));
    expect(localStorage.getItem(setupKey("guest"))).toBe(raw);
    expect(hook.result.current.data.language).toBe("en");
  });
});

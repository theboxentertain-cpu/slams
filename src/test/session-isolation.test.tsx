import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { SessionProvider, useSession } from "@/lib/session";

const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  cancelQueries: vi.fn(),
  clear: vi.fn(),
  invalidate: vi.fn(),
  invalidateQueries: vi.fn(),
  navigate: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: mock } }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => mock }));
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => mock,
  useNavigate: () => mock.navigate,
}));

let notify: (event: AuthChangeEvent, session: Session | null) => void;
const user = (id: string) => ({ id }) as User;
const session = (id: string) => ({ user: user(id) }) as Session;
beforeEach(() => {
  vi.resetAllMocks();
  mock.getUser.mockResolvedValue({ data: { user: user("a") }, error: null });
  mock.cancelQueries.mockResolvedValue(undefined);
  mock.signOut.mockImplementation(async () => {
    notify("SIGNED_OUT", null);
    return { error: null };
  });
  mock.onAuthStateChange.mockImplementation((callback) => {
    notify = callback;
    return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
  });
});
afterEach(cleanup);

async function mounted() {
  const hook = renderHook(() => useSession(), { wrapper: SessionProvider });
  await waitFor(() => expect(hook.result.current.user?.id).toBe("a"));
  mock.cancelQueries.mockClear();
  mock.clear.mockClear();
  return hook;
}

describe("Session identity isolation", () => {
  it.each(["SIGNED_OUT", "SIGNED_IN"] as const)(
    "cancels and clears private queries before applying %s",
    async (event) => {
      const hook = await mounted();
      let finish!: () => void;
      mock.cancelQueries.mockReturnValue(
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      );
      act(() => notify(event, event === "SIGNED_OUT" ? null : session("b")));
      await waitFor(() => expect(mock.cancelQueries).toHaveBeenCalledOnce());
      expect(hook.result.current.loading).toBe(true);
      expect(hook.result.current.user?.id).toBe("a");
      expect(mock.clear).not.toHaveBeenCalled();
      await act(async () => {
        finish();
      });
      expect(mock.clear).toHaveBeenCalledOnce();
      expect(hook.result.current.user?.id ?? null).toBe(event === "SIGNED_OUT" ? null : "b");
      expect(hook.result.current.loading).toBe(false);
      expect(mock.cancelQueries.mock.invocationCallOrder[0]).toBeLessThan(
        mock.clear.mock.invocationCallOrder[0]!,
      );
    },
  );

  it("does not let an old getUser result resurrect an account after sign-out", async () => {
    let finish!: (value: unknown) => void;
    mock.getUser.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const hook = renderHook(() => useSession(), { wrapper: SessionProvider });
    act(() => notify("SIGNED_OUT", null));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    await act(async () => {
      finish({ data: { user: user("a") }, error: null });
    });
    expect(hook.result.current.user).toBeNull();
  });

  it("does not restore an obsolete account when identity transitions overlap", async () => {
    const hook = await mounted();
    let finish!: () => void;
    mock.cancelQueries.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    act(() => notify("SIGNED_IN", session("b")));
    await waitFor(() => expect(mock.cancelQueries).toHaveBeenCalledOnce());
    act(() => notify("SIGNED_OUT", null));
    await waitFor(() => expect(hook.result.current.user).toBeNull());
    await act(async () => {
      finish();
    });
    expect(hook.result.current.user).toBeNull();
  });

  it("does not accept a getUser response with an authentication error", async () => {
    mock.getUser.mockResolvedValue({ data: { user: user("a") }, error: { message: "Expired" } });
    const hook = renderHook(() => useSession(), { wrapper: SessionProvider });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.user).toBeNull();
  });

  it("cancels and clears before calling Supabase signOut", async () => {
    const hook = await mounted();
    await act(async () => {
      await hook.result.current.signOut();
    });
    expect(mock.cancelQueries.mock.invocationCallOrder[0]).toBeLessThan(
      mock.clear.mock.invocationCallOrder[0]!,
    );
    expect(mock.clear.mock.invocationCallOrder[0]).toBeLessThan(
      mock.signOut.mock.invocationCallOrder[0]!,
    );
    expect(hook.result.current.user).toBeNull();
    expect(mock.navigate).toHaveBeenCalledWith({ to: "/auth", replace: true });
  });

  it("unsubscribes the identity listener on unmount", async () => {
    const hook = await mounted();
    hook.unmount();
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
  });
});

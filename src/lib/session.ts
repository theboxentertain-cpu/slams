// Session state for SLAMS. Uses getUser() (server-validated) for the initial
// read and a single onAuthStateChange subscription for transitions.
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

const SessionContext = createContext<{
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let transitioned = false;
    let revision = 0;
    let currentUser: User | null = null;
    const applyUser = async (nextUser: User | null, version: number) => {
      if (!active || version !== revision) return;
      if (nextUser?.id !== currentUser?.id) {
        // Includes expiry, cross-tab sign-out and account replacement, not just
        // the explicit signOut button. Cancel before discarding private caches.
        await queryClient.cancelQueries();
        if (!active || version !== revision) return;
        queryClient.clear();
      }
      currentUser = nextUser;
      setUser(nextUser);
      setLoading(false);
      void router.invalidate();
      if (nextUser) void queryClient.invalidateQueries();
    };
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (transitioned) return;
        return applyUser(error ? null : data.user, revision);
      })
      .catch(() => {
        if (active && !transitioned) setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED" &&
        event !== "TOKEN_REFRESHED" &&
        event !== "PASSWORD_RECOVERY"
      )
        return;
      transitioned = true;
      const version = ++revision;
      setLoading(true);
      // Keep the auth callback synchronous: schedule router/query work outside it.
      queueMicrotask(() => {
        if (!active) return;
        void applyUser(session?.user ?? null, version);
      });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await navigate({ to: "/auth", replace: true });
  }

  return createElement(SessionContext.Provider, { value: { user, loading, signOut } }, children);
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession requires SessionProvider");
  return session;
}

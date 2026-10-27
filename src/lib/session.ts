// Session state for SLAMS. Uses getUser() (server-validated) for the initial
// read and a single onAuthStateChange subscription for transitions.
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

const SessionContext = createContext<{ user: User | null; loading: boolean; signOut: () => Promise<void> } | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let transitioned = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (transitioned) return;
      setUser(data.user);
      setLoading(false);
    }).catch(() => {
      if (active && !transitioned) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      transitioned = true;
      setUser(session?.user ?? null);
      setLoading(false);
      // Keep the auth callback synchronous: schedule router/query work outside it.
      queueMicrotask(() => {
        if (!active) return;
        void router.invalidate();
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
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

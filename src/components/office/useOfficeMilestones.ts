import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

/** Confirmed account records only; no inferred grades or school attribution. */
export function useOfficeMilestones() {
  const { user, loading } = useSession();
  const result = useQuery({
    queryKey: ["office-milestones", user?.id],
    enabled: !!user && !loading,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) return null;
      const { count, error } = await supabase
        .from("unit_progress")
        .select("unit_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (error) throw error;
      return count;
    },
  });
  return user && !loading && !result.isError ? (result.data ?? null) : null;
}

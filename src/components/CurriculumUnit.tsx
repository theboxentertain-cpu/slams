import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { saveUnitProgress, type progressInput } from "@/lib/unit-progress";
import { supabase } from "@/integrations/supabase/client";
import type { z } from "zod";

type Kind = z.infer<typeof progressInput>["unit_kind"];
export function CurriculumUnit({ unit, kind, children }: {
  unit: { id: string; title: string; content: string; reviewed: boolean; status: string };
  kind: Kind; children?: React.ReactNode;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["unit-progress", user?.id, kind, unit.id];
  const progress = useQuery({ queryKey: key, enabled: !!user, queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from("unit_progress").select("status").eq("user_id", user.id).eq("unit_kind", kind).eq("unit_id", unit.id).maybeSingle();
    if (error) throw error;
    return data?.status ?? null;
  } });
  const published = unit.status === "published" && unit.reviewed && !!unit.content.trim();
  async function save(status: "started" | "completed") {
    setBusy(true); setError("");
    try { await saveUnitProgress({ unit_kind: kind, unit_id: unit.id, status }); await queryClient.invalidateQueries({ queryKey: key }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Progress save failed."); }
    finally { setBusy(false); }
  }
  return <details className="mt-3 border-l border-border pl-3">
    <summary className="cursor-pointer font-bold">{unit.title} · {kind}</summary>
    {!published ? <p className="text-sm text-warning">Coming soon — reviewed material is not available.</p> : <>
      <p className="mt-2 whitespace-pre-wrap">{unit.content}</p>
      {user ? <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm">{progress.data ?? "Not started"}</span>
        <Button variant="secondary" disabled={busy || progress.isPending || !!progress.error || progress.data === "completed"} onClick={() => save("started")}>Start unit</Button>
        <Button disabled={busy || progress.isPending || !!progress.error || progress.data === "completed"} onClick={() => save("completed")}>Mark complete</Button>
      </div> : <Link to="/auth" className="underline">Sign in to save unit progress</Link>}
    </>}
    {(error || progress.error) && <p role="alert" className="text-destructive">{error || "Could not load progress. Refresh to retry."}</p>}
    {children}
  </details>;
}
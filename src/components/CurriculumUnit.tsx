import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { saveUnitProgress, type progressInput } from "@/lib/unit-progress";
import { supabase } from "@/integrations/supabase/client";
import type { z } from "zod";

type Kind = z.infer<typeof progressInput>["unit_kind"];
export function CurriculumUnit({
  unit,
  kind,
  children,
  presentation = "disclosure",
}: {
  unit: { id: string; title: string; content: string; reviewed: boolean; status: string };
  kind: Kind;
  children?: ReactNode;
  presentation?: "disclosure" | "lesson";
}) {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["unit-progress", user?.id, kind, unit.id];
  const progress = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("unit_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("unit_kind", kind)
        .eq("unit_id", unit.id)
        .maybeSingle();
      if (error) throw error;
      return data?.status ?? null;
    },
  });
  const published = unit.status === "published" && unit.reviewed && !!unit.content.trim();
  async function saveStarted() {
    setBusy(true);
    setError("");
    try {
      await saveUnitProgress({ unit_kind: kind, unit_id: unit.id, status: "started" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: ["training-progress", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["office-milestones", user?.id] }),
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Progress save failed.");
    } finally {
      setBusy(false);
    }
  }
  const progressLabel = progress.isPending
    ? "Loading saved activity…"
    : progress.error
      ? "Saved activity unavailable."
      : progress.data === "completed"
        ? "Legacy recorded completion (not assessed)"
        : progress.data === "started"
          ? "Started"
          : "Not started";
  const activity = (
    <div
      className={
        presentation === "lesson" ? "curriculum-activity" : "mt-2 flex flex-wrap items-center gap-2"
      }
      aria-busy={busy || (!!user && progress.isPending)}
    >
      {loading ? (
        <p role="status">Checking your account…</p>
      ) : user ? (
        <>
          <p className="curriculum-activity-status" role="status">
            {progressLabel}
          </p>
          <Button
            variant="secondary"
            disabled={
              busy || progress.isPending || !!progress.error || progress.data === "completed"
            }
            onClick={() => void saveStarted()}
          >
            Start unit
          </Button>
          <p className="curriculum-activity-help text-xs text-muted-foreground">
            Starting records activity only. Academic completion needs evidence and authorized
            assessment; no self-awarded credit.
          </p>
        </>
      ) : (
        <>
          {presentation === "lesson" && <p>Sign in to keep this unit in your training record.</p>}
          <Link to="/auth" className="curriculum-signin underline">
            Sign in to save unit progress
          </Link>
        </>
      )}
    </div>
  );
  const failure = (error || progress.error) && (
    <p role="alert" className="curriculum-save-error text-destructive">
      {error || "Could not load progress. Refresh to retry."}
    </p>
  );
  if (presentation === "lesson")
    return (
      <article className="curriculum-lesson" aria-label={`${unit.title} — ${kind}`}>
        <header className="curriculum-lesson-heading">
          <span className="office-kicker">{kind}</span>
          <span className="curriculum-publication">
            {published ? "Reviewed & published" : "Material unavailable"}
          </span>
        </header>
        {published ? (
          <div className="curriculum-reading-layout">
            <section className="curriculum-reading-sheet" aria-label="Reviewed unit material">
              <h2>{kind === "lesson" ? "The lesson" : "The material"}</h2>
              <p className="curriculum-reading-copy whitespace-pre-wrap">{unit.content}</p>
            </section>
            <aside className="curriculum-record" aria-label="Unit activity">
              <h2>Your training record</h2>
              {activity}
              {failure}
            </aside>
          </div>
        ) : (
          <p className="availability-note">Coming soon — reviewed material is not available.</p>
        )}
        {!published && failure}
        {children}
      </article>
    );
  return (
    <details className="mt-3 border-l border-border pl-3">
      <summary className="cursor-pointer font-bold">
        {unit.title} · {kind}
      </summary>
      {!published ? (
        <p className="text-sm text-warning">Coming soon — reviewed material is not available.</p>
      ) : (
        <>
          <p className="mt-2 whitespace-pre-wrap">{unit.content}</p>
          {activity}
        </>
      )}
      {failure}
      {children}
    </details>
  );
}

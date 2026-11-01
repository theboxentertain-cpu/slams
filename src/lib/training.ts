import { useQuery } from "@tanstack/react-query";
import { getCurriculum } from "@/lib/curriculum.functions";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

export const UNIT_KINDS = ["course", "workshop", "lesson", "exercise", "assessment"] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];
export type Catalog = Awaited<ReturnType<typeof getCurriculum>>;
type Material = { id: string; title: string; content: string; status: string; reviewed: boolean };
export type TrainingUnit = Material & {
  kind: UnitKind;
  school: string;
  year: number;
  term: number;
  available: boolean;
  ancestors: { id: string; kind: UnitKind; title: string }[];
};
export type ProgressRecord = {
  unit_kind: UnitKind;
  unit_id: string;
  status: string;
  updated_at: string;
};

/** Normalize the existing public hierarchy without inventing units or gates. */
export function flattenCatalog(catalog: Catalog): TrainingUnit[] {
  const units: TrainingUnit[] = [];
  for (const school of catalog)
    for (const year of school.curriculum_years)
      for (const term of year.curriculum_terms) {
        const add = (
          unit: Material,
          kind: UnitKind,
          ancestors: TrainingUnit[],
          parentsAvailable: boolean,
        ) => {
          const row: TrainingUnit = {
            ...unit,
            kind,
            school: school.slug,
            year: year.number,
            term: term.number,
            available:
              parentsAvailable &&
              unit.status === "published" &&
              unit.reviewed &&
              !!unit.content.trim(),
            ancestors: ancestors.map(({ id, kind, title }) => ({ id, kind, title })),
          };
          units.push(row);
          return row;
        };
        for (const course of term.curriculum_courses) {
          const c = add(course, "course", [], term.status === "published");
          for (const workshop of course.curriculum_workshops) {
            const w = add(workshop, "workshop", [c], c.available);
            for (const lesson of workshop.curriculum_lessons) {
              const l = add(lesson, "lesson", [c, w], w.available);
              for (const exercise of lesson.curriculum_exercises)
                add(exercise, "exercise", [c, w, l], l.available);
              for (const assessment of lesson.curriculum_assessments)
                add(assessment, "assessment", [c, w, l], l.available);
            }
          }
        }
      }
  return units;
}

export function resolveResume(units: TrainingUnit[], records: ProgressRecord[]) {
  return (
    [...records]
      .filter((r) => r.status === "started")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((r) => units.find((u) => u.id === r.unit_id && u.kind === r.unit_kind && u.available))
      .find((u) => u !== undefined) ?? null
  );
}
export function schoolHasProgress(slug: string, units: TrainingUnit[], records: ProgressRecord[]) {
  return records.some((r) =>
    units.some((u) => u.school === slug && u.id === r.unit_id && u.kind === r.unit_kind),
  );
}
export function useCatalog() {
  const result = useQuery({
    queryKey: ["curriculum-catalog"],
    queryFn: () => getCurriculum(),
    retry: false,
    staleTime: 60_000,
  });
  return { ...result, units: flattenCatalog(result.data ?? []) };
}
export function useTrainingProgress() {
  const { user, loading } = useSession();
  const result = useQuery({
    queryKey: ["training-progress", user?.id],
    enabled: !!user && !loading,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!user) return [];
      const records: ProgressRecord[] = [];
      const seen = new Set<string>();
      let expected: number | null = null;
      for (let offset = 0; ; offset += 1000) {
        if (signal.aborted) throw new DOMException("Request cancelled", "AbortError");
        const { data, error, count } = await supabase
          .from("unit_progress")
          .select("unit_kind,unit_id,status,updated_at", { count: "exact" })
          .eq("user_id", user.id)
          .order("unit_kind")
          .order("unit_id")
          .range(offset, offset + 999)
          .abortSignal(signal);
        if (error) throw error;
        if (count === null) throw new Error("Could not verify the complete progress record set.");
        if (expected !== null && count !== expected)
          throw new Error("Progress changed while loading. Retry to refresh.");
        expected = count;
        for (const row of data ?? []) {
          const key = `${row.unit_kind}:${row.unit_id}`;
          if (seen.has(key)) throw new Error("Progress changed while loading. Retry to refresh.");
          seen.add(key);
          records.push(row as ProgressRecord);
        }
        if (records.length === expected) return records;
        if (!data?.length || data.length < 1000)
          throw new Error("Some progress records could not be loaded. Retry to refresh.");
      }
    },
  });
  return {
    records:
      user && !loading && !result.isError && result.data ? (result.data as ProgressRecord[]) : null,
    loading: loading || (!!user && result.isPending),
    error: user && !loading ? result.error : null,
    signedIn: !!user && !loading,
    retry: result.refetch,
  };
}

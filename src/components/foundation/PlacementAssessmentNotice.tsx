import { placementDisplayStatus } from "@/lib/conservatory-academic";
import { getSchool } from "@/data/schools";

/**
 * Honest placement entrance in every school. Request/assessment activation remains
 * blocked until independent faculty review and real server-authorized eligibility
 * checks are deployed. No client-side unlock buttons are exposed.
 */
export function PlacementAssessmentNotice({ school }: { school: string }) {
  const schoolName = getSchool(school)?.name ?? "this school";
  const pending = placementDisplayStatus(null, school, "school", null);
  return (
    <section className="panel p-4" aria-label="Advanced placement assessment">
      <span className="office-kicker">FOR EXPERIENCED ACTORS</span>
      <h2 className="mt-2 text-lg font-bold">Already trained? Prove your starting level.</h2>
      <p className="mt-2">
        You can explore {schoolName} now. Skipping prerequisite training for academic
        credit will require a school-specific assessment, a qualified faculty review,
        and a verified server-side unlock. Previous acting experience alone cannot
        unlock later lessons.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Placement requirements may include practical performance with a consenting
        human partner, script work, and demonstrable responses to directed adjustments.
        Solo exercises cannot replace partner competencies.
      </p>
      <p role="status" className="mt-3 font-semibold">{pending.label}</p>
      <p className="text-sm">{pending.next}. No reviewed placement assessment has been released yet.</p>
    </section>
  );
}

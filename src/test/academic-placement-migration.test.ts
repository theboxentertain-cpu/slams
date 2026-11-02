import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Static contract checks only. These are NOT PostgreSQL or multi-account RLS tests. */
const sql = readFileSync(
  new URL("../../drizzle/migrations/0003_academic_progression_placement.sql", import.meta.url),
  "utf8"
);

describe("Academic progression migration static safety contract", () => {
  it("removes browser-awarded academic completion at the SQL policy layer", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Users insert own unit progress"');
    expect(sql).toContain('DROP POLICY IF EXISTS "Users update own unit progress"');
    expect(sql).toContain("status = 'started'");
  });
  it("restricts reviewer appointment and advancement grants", () => {
    expect(sql).toContain("REVOKE ALL ON public.academic_reviewers FROM PUBLIC, anon, authenticated;");
    expect(sql).toContain("REVOKE ALL ON public.academic_placement_grants FROM PUBLIC, anon, authenticated;");
    expect(sql).toContain("Actors see own reviewed placement grants");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("v_case.user_id=v_reviewer");
  });
  it("requires an actual active signed policy and specific documented faculty rubric", () => {
    expect(sql).toContain("Active policies require an assigned, active faculty signoff");
    expect(sql).toContain("Assessment criteria must have unique IDs");
    expect(sql).toContain("Approvals require documented rubric results");
    expect(sql).toContain("Each required published criterion must be demonstrated and documented");
    expect(sql).toContain("p.status='active'");
    expect(sql).not.toContain("INSERT INTO public.academic_reviewers");
    expect(sql).not.toContain("INSERT INTO public.academic_policies");
  });
  it("never marks practice attempts as mastery or grants placement from an attempt", () => {
    expect(sql).toContain("state IN ('draft','submitted')");
    expect(sql).toContain("Practice requires a reviewed, published exercise with matching content version");
    expect(sql).toContain("academic_review_placement");
    expect(sql).toContain("academic_has_placement");
    expect(sql).toContain("COMMIT;");
  });
});

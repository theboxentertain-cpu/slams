import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0008_slams_role_grants_hardening.sql"),
  "utf8",
);
const disposable = readFileSync(resolve(process.cwd(), "scripts/rls-actor-work.sql"), "utf8");

describe("SLAMS Supabase default-privilege hardening", () => {
  it("explicitly revokes inherited broad access from every existing SLAMS table", () => {
    expect(migration).toContain("REVOKE ALL ON TABLE");
    for (const name of [
      "profiles",
      "passport_entries",
      "audition_prep",
      "schools",
      "curriculum_years",
      "curriculum_terms",
      "curriculum_courses",
      "curriculum_workshops",
      "curriculum_lessons",
      "curriculum_exercises",
      "curriculum_assessments",
      "curriculum_imports",
      "unit_progress",
      "actor_projects",
      "actor_project_revisions",
      "actor_auditions",
      "actor_sides",
    ]) {
      expect(migration).toContain("public." + name);
    }
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("REVOKE ALL ON TABLES FROM anon, authenticated");
    expect(migration).toContain("REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC");
  });

  it("restores only intended authenticated privileges", () => {
    expect(migration).toContain(
      "GRANT SELECT, INSERT, UPDATE ON public.actor_projects TO authenticated",
    );
    expect(migration).toContain("GRANT SELECT ON public.actor_project_revisions TO authenticated");
    expect(migration).toContain("ON public.actor_auditions, public.actor_sides TO authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.handle_new_user()");
    expect(disposable).toContain("0008_slams_role_grants_hardening.sql");
    expect(disposable).toContain("GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated");
    expect(disposable).toContain("No client role can TRUNCATE a SLAMS table");
  });
});

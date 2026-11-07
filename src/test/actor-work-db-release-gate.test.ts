import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function repositoryFile(path: string): string {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}

describe("Actor at Work database rollout safety", () => {
  const journal = JSON.parse(repositoryFile("drizzle/migrations/meta/_journal.json")) as {
    entries: Array<{ tag: string }>;
  };
  const projects = repositoryFile("drizzle/migrations/0004_actor_projects_versioned.sql");
  const auditions = repositoryFile("drizzle/migrations/0005_actor_auditions.sql");
  const preflight = repositoryFile("scripts/db/actor-work-preflight-readonly.sql");
  const staging = repositoryFile("scripts/db/actor-work-staging-rls.psql");
  const realAuth = repositoryFile("scripts/db/verify-actor-rls-real-auth.mjs");
  const gate = repositoryFile("docs/ops/ACTOR_WORK_DATABASE_RELEASE_GATE.md");

  it("flags academic 0003 in the shared pending journal; does not authorize migrate-all", () => {
    expect(journal.entries.map((entry) => entry.tag)).toEqual(
      expect.arrayContaining([
        "0003_academic_progression_placement",
        "0004_actor_projects_versioned",
        "0005_actor_auditions",
      ]),
    );
    expect(repositoryFile("drizzle/migrations/0003_academic_progression_placement.sql")).toContain(
      "PROPOSAL ONLY",
    );
    expect(gate).toContain("Never run all pending Drizzle journal entries");
  });

  it("requires a read-only query for inspecting ledger and policy metadata", () => {
    expect(preflight).toContain("BEGIN TRANSACTION READ ONLY");
    expect(preflight).toContain("drizzle.__drizzle_migrations");
    expect(preflight).toContain("pg_policies");
    expect(preflight).toContain("information_schema.role_table_grants");
    expect(preflight).toContain("pg_get_constraintdef");
    expect(preflight).toContain("ROLLBACK;");
    expect(preflight).not.toMatch(/\bCREATE TABLE\b/i);
    expect(preflight).not.toMatch(/^\s*(INSERT|UPDATE|DELETE|DROP|ALTER)\b/im);
  });

  it("preserves owner-only source policies, revisions, composite FK and no client audit writes", () => {
    expect(projects).toContain("SECURITY DEFINER SET search_path = ''");
    expect(projects).toContain("actor_project_revisions_parent");
    expect(projects).toContain("FOREIGN KEY (user_id, project_id)");
    expect(projects).toMatch(/GRANT SELECT ON public\.actor_project_revisions TO authenticated/);
    expect(projects).toMatch(
      /FOR SELECT TO authenticated USING \(user_id = \(select auth\.uid\(\)\)\)/,
    );
    expect(projects).not.toMatch(
      /GRANT (?:ALL|INSERT|UPDATE|DELETE) ON public\.actor_project_revisions TO authenticated/,
    );
    expect(auditions).toContain("FOREIGN KEY (user_id, project_id)");
    expect(auditions).toContain("ON DELETE RESTRICT");
    expect(auditions).toMatch(
      /GRANT SELECT, INSERT, UPDATE ON public\.actor_auditions TO authenticated/,
    );
    expect(auditions).not.toMatch(/GRANT .*DELETE ON public\.actor_auditions TO authenticated/);
    expect(auditions).toContain("NEW.revision := OLD.revision + 1");
  });

  it("forbids live tests and requires rolled-back and real-token staging checks", () => {
    expect(staging).toContain("confirmed_nonproduction");
    expect(staging).toContain("SET LOCAL ROLE authenticated");
    expect(staging).toContain("request.jwt.claim.sub");
    expect(staging).toContain("auth.users");
    expect(staging).toContain("ROLLBACK;");
    expect(staging).toContain("actor_project_revisions");
    expect(staging).toContain("foreign_key_violation");
    expect(staging).toContain("insufficient_privilege");
    expect(realAuth).toContain("staging-only");
    expect(realAuth).toContain("signInWithPassword");
    expect(realAuth).toContain("sb_publishable_");
    expect(realAuth).toContain("cross-account audition association");
    expect(realAuth).toContain("cleanUp");
    expect(gate).toContain("real authenticated user sessions");
    expect(gate).toContain("No production SQL");
  });

  it("does not auto-run database migrations from the normal test/build workflow", () => {
    const workflow = repositoryFile(".github/workflows/quality.yml");
    expect(workflow).not.toMatch(/drizzle-kit\s+(migrate|push)/);
    expect(workflow).not.toContain("psql ");
    const scripts = JSON.parse(repositoryFile("package.json")) as {
      scripts: Record<string, string>;
    };
    for (const script of Object.values(scripts.scripts))
      expect(script).not.toMatch(/drizzle-kit\s+(migrate|push)|psql\s/);
  });
});

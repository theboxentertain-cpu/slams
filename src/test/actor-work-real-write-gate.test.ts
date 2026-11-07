import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(process.cwd(), "scripts/db/verify-actor-rls-real-writes.mjs");
const script = readFileSync(scriptPath, "utf8");

describe("real-token Actor at Work write-security staging gate", () => {
  it("parses and fails closed to the known separate Supabase staging project", () => {
    expect(() => execFileSync(process.execPath, ["--check", scriptPath])).not.toThrow();
    expect(script).toContain('const STAGING_REF = "bfoukjcissyardeokfev"');
    expect(script).toContain('SLAMS_STAGING_API_WRITES_ACK');
    expect(script).toContain('synthetic-fixtures-only');
    expect(script).toContain('SLAMS_NONPROD_RLS_ACK');
    expect(script).toContain('startsWith("SLAMS STAGING TEST")');
    expect(script).not.toContain('edrchrzqsrfrlcfbnxhs');
  });

  it("uses only real user credentials, never a service key, and restores fixture data", () => {
    expect(script).toContain("signInWithPassword");
    expect(script).toContain("sb_publishable_");
    expect(script).toContain("RLS BREACH:");
    expect(script).toContain("forgedProject");
    expect(script).toContain("foreignAudition");
    expect(script).toContain("forbiddenRewrite");
    expect(script).toContain("forgedHistory");
    expect(script).toContain("async function restore()");
    expect(script).toContain("await restore()");
    expect(script).not.toContain("service_role");
    expect(script).not.toContain(".delete(");
    expect(script).not.toContain("createUser(");
  });
});

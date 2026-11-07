/**
 * SLAMS: READ-ONLY, REAL-TOKEN, two-account RLS smoke test against STAGING.
 * Never run against production. Requires approved pre-seeded disposable fixtures
 * in a NONPRODUCTION Supabase database with migrations 0004–0007 applied.
 * Unlike SQL SET ROLE simulation, these are real Supabase sign-in sessions.
 *
 * Environment (supply via a private secret store, never commit credentials):
 * SLAMS_NONPROD_RLS_ACK=staging-only
 * SLAMS_STAGING_URL=https://<staging-project>.supabase.co
 * SLAMS_STAGING_PUBLISHABLE_KEY=sb_publishable_...
 * SLAMS_TEST_ACTOR_A_EMAIL / SLAMS_TEST_ACTOR_A_PASSWORD
 * SLAMS_TEST_ACTOR_B_EMAIL / SLAMS_TEST_ACTOR_B_PASSWORD
 * SLAMS_TEST_A_PROJECT_ID / SLAMS_TEST_B_PROJECT_ID
 * SLAMS_TEST_A_AUDITION_ID / SLAMS_TEST_B_AUDITION_ID
 * SLAMS_TEST_A_SIDE_ID / SLAMS_TEST_B_SIDE_ID
 *
 * Run: node scripts/db/verify-actor-rls-real-auth.mjs
 *
 * NO INSERT/UPDATE/DELETE performed by this verifier. SQL mutation/RLS tests
 * are separately run inside the disposable transaction-rolled-back harness.
 * These read-only results still require UI, real Android, and write-path checks.
 */
import { createClient } from "@supabase/supabase-js";

const required = [
  "SLAMS_NONPROD_RLS_ACK",
  "SLAMS_STAGING_URL",
  "SLAMS_STAGING_PUBLISHABLE_KEY",
  "SLAMS_TEST_ACTOR_A_EMAIL",
  "SLAMS_TEST_ACTOR_A_PASSWORD",
  "SLAMS_TEST_ACTOR_B_EMAIL",
  "SLAMS_TEST_ACTOR_B_PASSWORD",
  "SLAMS_TEST_A_PROJECT_ID",
  "SLAMS_TEST_B_PROJECT_ID",
  "SLAMS_TEST_A_AUDITION_ID",
  "SLAMS_TEST_B_AUDITION_ID",
  "SLAMS_TEST_A_SIDE_ID",
  "SLAMS_TEST_B_SIDE_ID",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing staging-only environment variable: ${name}`);
}
if (process.env.SLAMS_NONPROD_RLS_ACK !== "staging-only") {
  throw new Error("BLOCKED: explicitly confirm a disposable staging database.");
}
const endpoint = new URL(process.env.SLAMS_STAGING_URL);
if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
  throw new Error("Staging endpoint must use HTTPS or localhost.");
}
const publishableKey = process.env.SLAMS_STAGING_PUBLISHABLE_KEY;
if (!publishableKey.startsWith("sb_publishable_")) {
  throw new Error("BLOCKED: only a Supabase sb_publishable_ staging key is accepted.");
}

const fixture = {
  actor_projects: [
    process.env.SLAMS_TEST_A_PROJECT_ID,
    process.env.SLAMS_TEST_B_PROJECT_ID,
  ],
  actor_auditions: [
    process.env.SLAMS_TEST_A_AUDITION_ID,
    process.env.SLAMS_TEST_B_AUDITION_ID,
  ],
  actor_sides: [process.env.SLAMS_TEST_A_SIDE_ID, process.env.SLAMS_TEST_B_SIDE_ID],
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ids = Object.values(fixture).flat();
if (ids.some((id) => !uuid.test(id)) || new Set(ids).size !== ids.length) {
  throw new Error("BLOCKED: staging fixture IDs must be distinct UUIDs.");
}

function actorClient() {
  return createClient(endpoint.toString().replace(/\/$/, ""), publishableKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
    },
  });
}
function assert(result, reason) {
  if (!result) throw new Error(reason);
}
function checked(response, label) {
  if (response.error) {
    throw new Error(`${label}: staging API error ${response.error.code ?? "unknown"}`);
  }
  return response.data ?? [];
}
async function logIn(actor, prefix) {
  const result = await actor.auth.signInWithPassword({
    email: process.env[`SLAMS_TEST_ACTOR_${prefix}_EMAIL`],
    password: process.env[`SLAMS_TEST_ACTOR_${prefix}_PASSWORD`],
  });
  if (result.error || !result.data.user?.id) {
    throw new Error(`Actor ${prefix}: disposable staging login failed`);
  }
  return result.data.user.id;
}

const actorA = actorClient();
const actorB = actorClient();
const anon = actorClient();

try {
  const userA = await logIn(actorA, "A");
  const userB = await logIn(actorB, "B");
  assert(userA !== userB, "BLOCKED: both accounts resolve to one identity.");

  for (const [table, [ownA, ownB]] of Object.entries(fixture)) {
    const aOwn = checked(
      await actorA.from(table).select("id,user_id").eq("id", ownA),
      `Actor A reads own ${table}`,
    );
    const bOwn = checked(
      await actorB.from(table).select("id,user_id").eq("id", ownB),
      `Actor B reads own ${table}`,
    );
    assert(aOwn.length === 1 && aOwn[0].user_id === userA,
      `Missing or incorrect Actor A staging fixture in ${table}`);
    assert(bOwn.length === 1 && bOwn[0].user_id === userB,
      `Missing or incorrect Actor B staging fixture in ${table}`);

    const aOther = checked(
      await actorA.from(table).select("id").eq("id", ownB),
      `Actor A cross-read ${table}`,
    );
    const bOther = checked(
      await actorB.from(table).select("id").eq("id", ownA),
      `Actor B cross-read ${table}`,
    );
    assert(aOther.length === 0 && bOther.length === 0,
      `RLS BREACH: private ${table} record visible to another actor`);

    const anonymous = await anon.from(table).select("id").eq("id", ownA);
    assert(
      anonymous.error?.code === "42501" ||
        (!anonymous.error && (anonymous.data ?? []).length === 0),
      `RLS BREACH: anonymous can read a private ${table} record`,
    );
  }

  const [aProject, bProject] = fixture.actor_projects;
  const aHistory = checked(
    await actorA.from("actor_project_revisions").select("project_id,revision")
      .eq("project_id", aProject),
    "Actor A own project history",
  );
  const bHistory = checked(
    await actorB.from("actor_project_revisions").select("project_id,revision")
      .eq("project_id", bProject),
    "Actor B own project history",
  );
  assert(aHistory.length > 0 && bHistory.length > 0,
    "Both disposable staging projects require an original revision fixture.");

  const [aOtherHistory, bOtherHistory] = await Promise.all([
    actorA.from("actor_project_revisions").select("revision").eq("project_id", bProject),
    actorB.from("actor_project_revisions").select("revision").eq("project_id", aProject),
  ]);
  assert(checked(aOtherHistory, "A read B revision").length === 0,
    "RLS BREACH: A can see B revision history");
  assert(checked(bOtherHistory, "B read A revision").length === 0,
    "RLS BREACH: B can see A revision history");

  const anonHistory = await anon.from("actor_project_revisions")
    .select("revision").eq("project_id", aProject);
  assert(
    anonHistory.error?.code === "42501" ||
      (!anonHistory.error && (anonHistory.data ?? []).length === 0),
    "RLS BREACH: anonymous can see actor revision history",
  );

  process.stdout.write(
    "PASS: real-token, read-only two-account staging project, audition, script-side and revision SELECT isolation.\n",
  );
  process.stdout.write(
    "NOT YET VERIFIED: API mutation permissions, Android behavior, production migration and release approval.\n",
  );
} finally {
  await Promise.allSettled([actorA.auth.signOut(), actorB.auth.signOut()]);
}

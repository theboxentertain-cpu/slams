/**
 * Real-JWT, real-REST API WRITE security test for SLAMS staging ONLY.
 *
 * Reuses the synthetic fixtures from the read-only verifier.
 * Writes only test-only fixture notes/annotations, restores original values
 * in finally, and uses rejected write attempts for negative authorization.
 * Server-generated project history revisions remain after restoration.
 * NEVER use with the Lovable production database or real actor records.
 *
 * Required env: same SLAMS_* variables as verify-actor-rls-real-auth.mjs,
 * plus SLAMS_STAGING_API_WRITES_ACK=synthetic-fixtures-only.
 *
 * Run: node scripts/db/verify-actor-rls-real-writes.mjs
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "bfoukjcissyardeokfev";
const required = [
  "SLAMS_NONPROD_RLS_ACK",
  "SLAMS_STAGING_API_WRITES_ACK",
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
  if (!process.env[name]) throw new Error(`BLOCKED: missing staging variable ${name}`);
}
if (
  process.env.SLAMS_NONPROD_RLS_ACK !== "staging-only" ||
  process.env.SLAMS_STAGING_API_WRITES_ACK !== "synthetic-fixtures-only"
) {
  throw new Error("BLOCKED: staging-only synthetic-write acknowledgment is required.");
}

const url = new URL(process.env.SLAMS_STAGING_URL);
if (
  url.protocol !== "https:" ||
  url.hostname !== `${STAGING_REF}.supabase.co` ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
) {
  throw new Error("BLOCKED: endpoint is not the approved separate SLAMS staging project.");
}
const key = process.env.SLAMS_STAGING_PUBLISHABLE_KEY;
if (!key.startsWith("sb_publishable_")) {
  throw new Error("BLOCKED: requires a staging publishable key, not a secret/admin key.");
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fixtures = {
  actor_projects: [process.env.SLAMS_TEST_A_PROJECT_ID, process.env.SLAMS_TEST_B_PROJECT_ID],
  actor_auditions: [
    process.env.SLAMS_TEST_A_AUDITION_ID,
    process.env.SLAMS_TEST_B_AUDITION_ID,
  ],
  actor_sides: [process.env.SLAMS_TEST_A_SIDE_ID, process.env.SLAMS_TEST_B_SIDE_ID],
};
const allIds = Object.values(fixtures).flat();
if (allIds.some((id) => !uuid.test(id)) || new Set(allIds).size !== allIds.length) {
  throw new Error("BLOCKED: all six fixture IDs must be distinct valid UUIDs.");
}
const changes = [];
let failure = null;
let restoreFailure = null;
const client = () =>
  createClient(url.origin, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
const actorA = client();
const actorB = client();
const anon = client();

function requireThat(condition, reason) {
  if (!condition) throw new Error(reason);
}
function dataOrThrow(result, reason) {
  if (result.error) throw new Error(`${reason}: ${result.error.code || "API error"}`);
  return result.data;
}
function blockedResponse(result, reason) {
  if (result.error) {
    // An unrelated server error is NOT evidence that authorization was enforced.
    requireThat(
      ["42501", "P0001", "23503"].includes(result.error.code),
      `${reason}: unexpected API failure ${result.error.code || "unknown"}`,
    );
    return;
  }
  requireThat(Array.isArray(result.data) && result.data.length === 0, reason);
}
async function authenticate(clientInstance, label) {
  const res = await clientInstance.auth.signInWithPassword({
    email: process.env[`SLAMS_TEST_ACTOR_${label}_EMAIL`],
    password: process.env[`SLAMS_TEST_ACTOR_${label}_PASSWORD`],
  });
  requireThat(!res.error && res.data.user?.id, `BLOCKED: Actor ${label} staging sign-in failed`);
  return res.data.user.id;
}
async function ownFixture(actor, table, id, owner, payloadColumn) {
  const result = await actor.from(table).select("*").eq("id", id).single();
  const row = dataOrThrow(result, `Missing ${table} fixture`);
  requireThat(row?.user_id === owner, `BLOCKED: ${table} ownership mismatch`);
  requireThat(
    typeof row.title === "string" && row.title.startsWith("SLAMS STAGING TEST"),
    `BLOCKED: ${table} is not a dedicated synthetic fixture`,
  );
  requireThat(
    payloadColumn === "annotations"
      ? Array.isArray(row.annotations)
      : row.notes?.test_only === true,
    `BLOCKED: ${table} lacks the synthetic fixture marker`,
  );
  return row;
}
async function restore() {
  for (const entry of changes.reverse()) {
    const result = await entry.actor
      .from(entry.table)
      .update({ [entry.column]: entry.value })
      .eq("id", entry.id)
      .eq("user_id", entry.owner)
      .select("id");
    if (result.error || result.data?.length !== 1) {
      throw new Error(`STAGING RESTORE FAILED for ${entry.table}; inspect its synthetic fixture`);
    }
  }
}

try {
  const idA = await authenticate(actorA, "A");
  const idB = await authenticate(actorB, "B");
  requireThat(idA !== idB, "BLOCKED: test users are not distinct.");
  const owners = [idA, idB];
  const actors = [actorA, actorB];
  const originals = {};

  for (const [table, ids] of Object.entries(fixtures)) {
    const column = table === "actor_sides" ? "annotations" : "notes";
    originals[table] = [
      await ownFixture(actorA, table, ids[0], idA, column),
      await ownFixture(actorB, table, ids[1], idB, column),
    ];
  }
  // Negative checks first: do not alter existing fixture content.
  for (const [table, rows] of Object.entries(originals)) {
    for (let i = 0; i < 2; i += 1) {
      const attacker = actors[i];
      const victim = rows[1 - i];
      const attempt = await attacker
        .from(table)
        .update({ title: victim.title })
        .eq("id", victim.id)
        .select("id");
      blockedResponse(attempt, `RLS BREACH: cross-owner ${table} UPDATE succeeded`);
    }
  }
  const ownA = originals.actor_projects[0];
  const ownBSide = originals.actor_sides[1];

  const forgedOwner = await actorA
    .from("actor_projects")
    .update({ user_id: idB })
    .eq("id", ownA.id)
    .select("id");
  requireThat(
    forgedOwner.error && ["P0001", "42501"].includes(forgedOwner.error.code),
    "RLS BREACH: project ownership change was not rejected",
  );

  const forgedProject = await actorA
    .from("actor_projects")
    .insert({
      user_id: idB,
      title: "SLAMS STAGING TEST — forged owner",
      notes: { test_only: true },
    })
    .select("id");
  requireThat(
    forgedProject.error?.code === "42501",
    "RLS BREACH: signed-in user could forge someone else's project owner",
  );

  const foreignAudition = await actorA
    .from("actor_auditions")
    .insert({
      user_id: idA,
      project_id: originals.actor_projects[1].id,
      title: "SLAMS STAGING TEST — forged project link",
      notes: { test_only: true },
    })
    .select("id");
  requireThat(
    foreignAudition.error?.code === "23503",
    "RLS BREACH: audition could link to another owner's project",
  );

  const forbiddenRewrite = await actorB
    .from("actor_sides")
    .update({ content: `${ownBSide.content}\nFORBIDDEN EDIT` })
    .eq("id", ownBSide.id)
    .select("id");
  requireThat(
    forbiddenRewrite.error?.code === "P0001",
    "IMMUTABILITY BREACH: a script side's source text could be overwritten",
  );

  const forgedHistory = await actorA
    .from("actor_project_revisions")
    .insert({
      project_id: ownA.id,
      user_id: idA,
      revision: 987654321,
      title: "SLAMS STAGING TEST — forged history",
      role_name: "",
      status: "active",
      notes: { test_only: true },
    })
    .select("project_id");
  requireThat(
    forgedHistory.error?.code === "42501",
    "RLS BREACH: user could forge append-only project history",
  );

  const anonymousWrite = await anon
    .from("actor_projects")
    .update({ title: ownA.title })
    .eq("id", ownA.id)
    .select("id");
  blockedResponse(anonymousWrite, "RLS BREACH: anonymous project UPDATE succeeded");

  // Positive checks: use only six pre-approved synthetic fixtures, then
  // restore their original notes/annotations. Revision history is append-only.
  for (const [table, rows] of Object.entries(originals)) {
    const column = table === "actor_sides" ? "annotations" : "notes";
    for (let i = 0; i < 2; i += 1) {
      const row = rows[i];
      const actor = actors[i];
      const marker = randomUUID();
      const temporary =
        column === "annotations"
          ? [
              ...row.annotations,
              {
                id: marker,
                fromLine: 1,
                toLine: 1,
                beat: "Staging security test",
                objective: "",
                tactic: "",
              },
            ]
          : { ...row.notes, __slams_write_test: marker };

      // Register first: finally attempts restoration even after a partial response.
      changes.push({
        actor,
        table,
        id: row.id,
        owner: owners[i],
        column,
        value: row[column],
      });
      const updated = dataOrThrow(
        await actor
          .from(table)
          .update({ [column]: temporary })
          .eq("id", row.id)
          .eq("user_id", owners[i])
          .eq("revision", row.revision)
          .select(`id,revision,${column}`)
          .single(),
        `FAILED: own authenticated ${table} update`,
      );
      requireThat(
        updated?.revision === row.revision + 1,
        `FAILED: ${table} server revision did not advance`,
      );
      requireThat(
        column === "annotations"
          ? updated.annotations.some((entry) => entry.id === marker)
          : updated.notes.__slams_write_test === marker,
        `FAILED: ${table} updated value was not persisted`,
      );
    }
  }

  const projectHistoryA = dataOrThrow(
    await actorA
      .from("actor_project_revisions")
      .select("revision")
      .eq("project_id", ownA.id)
      .eq("revision", ownA.revision + 1),
    "FAILED: server-generated owner A project history",
  );
  requireThat(
    projectHistoryA.length === 1,
    "FAILED: project update did not append a readable history revision",
  );

  process.stdout.write(
    "PASS: real-token staging WRITE permissions; own updates, cross-owner denials, " +
      "owner spoofing, FK integrity, side immutability and revision history.\n",
  );
} catch (error) {
  failure = error;
} finally {
  try {
    await restore();
  } catch (error) {
    restoreFailure = error;
  }
  await Promise.allSettled([actorA.auth.signOut(), actorB.auth.signOut()]);
}
if (restoreFailure) throw restoreFailure;
if (failure) throw failure;
process.stdout.write(
  "PASS: original synthetic notes/annotations restored. " +
    "Server-generated history revisions intentionally remain in staging.\n",
);

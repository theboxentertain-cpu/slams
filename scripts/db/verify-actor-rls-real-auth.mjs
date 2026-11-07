/**
 * SLAMS: real-credential, two-account staging RLS smoke test.
 *
 * NONPRODUCTION ONLY, and only AFTER the reviewed 0004/0005 migrations.
 * Run with two distinct disposable staging accounts and a publishable
 * Supabase key; NEVER use a service-role key or personal account credentials.
 *
 * SLAMS_NONPROD_RLS_ACK=staging-only
 * SLAMS_STAGING_URL=https://<staging-project>.supabase.co
 * SLAMS_STAGING_PUBLISHABLE_KEY=<publishable-key>
 * SLAMS_TEST_ACTOR_A_EMAIL=<test-email> SLAMS_TEST_ACTOR_A_PASSWORD=<test-pass>
 * SLAMS_TEST_ACTOR_B_EMAIL=<test-email> SLAMS_TEST_ACTOR_B_PASSWORD=<test-pass>
 *
 * node scripts/db/verify-actor-rls-real-auth.mjs
 *
 * Creates and attempts to delete one disposable project for each account.
 * No legitimate audition records are created because 0005 denies client DELETE.
 * A real two-account audition SELECT test needs approved staging fixtures.
 * Do not interpret a green result as a complete release sign-off.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const required = [
  "SLAMS_NONPROD_RLS_ACK",
  "SLAMS_STAGING_URL",
  "SLAMS_STAGING_PUBLISHABLE_KEY",
  "SLAMS_TEST_ACTOR_A_EMAIL",
  "SLAMS_TEST_ACTOR_A_PASSWORD",
  "SLAMS_TEST_ACTOR_B_EMAIL",
  "SLAMS_TEST_ACTOR_B_PASSWORD",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required staging-only variable: ${key}`);
}
if (process.env.SLAMS_NONPROD_RLS_ACK !== "staging-only") {
  throw new Error("Refusing to run without staging-only acknowledgment.");
}
const url = new URL(process.env.SLAMS_STAGING_URL);
if (url.protocol !== "https:" && url.hostname !== "localhost") {
  throw new Error("Staging URL must use HTTPS (or localhost).");
}
const key = process.env.SLAMS_STAGING_PUBLISHABLE_KEY;
if (!key.startsWith("sb_publishable_")) {
  throw new Error("Refusing legacy JWT or privileged secret keys. Use sb_publishable_ only.");
}

function client() {
  return createClient(url.toString().replace(/\/$/, ""), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function requireQuery(query, label) {
  if (query.error) {
    throw new Error(`${label}: Supabase error code ${query.error.code ?? "unknown"}`);
  }
  return query.data;
}
const actorA = client();
const actorB = client();
const created = [];
const marker = `slams-rls-disposable-${randomUUID()}`;

async function signIn(actor, email, password, label) {
  const result = await actor.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user?.id)
    throw new Error(`${label}: disposable staging login failed`);
  return result.data.user.id;
}
async function cleanUp(owner, id, label) {
  if (!id) return;
  const result = await owner.from("actor_projects").delete().eq("id", id).select("id");
  if (result.error || result.data?.length !== 1) {
    throw new Error(
      `${label}: disposable staging project cleanup not verified; remove it manually`,
    );
  }
}

let passed = false;
try {
  const aId = await signIn(
    actorA,
    process.env.SLAMS_TEST_ACTOR_A_EMAIL,
    process.env.SLAMS_TEST_ACTOR_A_PASSWORD,
    "Actor A",
  );
  const bId = await signIn(
    actorB,
    process.env.SLAMS_TEST_ACTOR_B_EMAIL,
    process.env.SLAMS_TEST_ACTOR_B_PASSWORD,
    "Actor B",
  );
  check(aId !== bId, "Test accounts must be distinct.");

  const aResult = await actorA
    .from("actor_projects")
    .insert({
      user_id: aId,
      title: marker + "-A",
      notes: { objective: "observe actor's chosen result" },
    })
    .select("id,user_id,revision")
    .single();
  const aProject = requireQuery(aResult, "Actor A project create");
  check(Boolean(aProject?.id), "Actor A create returned no project identifier");
  created.push({ owner: actorA, id: aProject.id, label: "Actor A" });
  check(
    aProject.user_id === aId && aProject.revision === 1,
    "Actor A first revision/owner mismatch",
  );

  const bReadA = requireQuery(
    await actorB.from("actor_projects").select("id").eq("id", aProject.id),
    "Actor B read A",
  );
  check(bReadA.length === 0, "RLS BREACH: B can read A private project");

  const bWriteA = requireQuery(
    await actorB
      .from("actor_projects")
      .update({ title: "forbidden" })
      .eq("id", aProject.id)
      .select("id"),
    "Actor B update A",
  );
  check(bWriteA.length === 0, "RLS BREACH: B can update A private project");

  const forged = await actorB
    .from("actor_projects")
    .insert({ user_id: aId, title: marker + "-spoof" })
    .select("id");
  // If this forbidden operation unexpectedly succeeds, track it for cleanup
  // before failing. Only an isolated staging environment is allowed here.
  if (forged.data?.[0]?.id) {
    created.push({ owner: actorA, id: forged.data[0].id, label: "Forged owner" });
  }
  check(
    Boolean(forged.error) && forged.error.code === "42501",
    "RLS BREACH: B did not receive expected RLS rejection for forged user_id",
  );

  const bResult = await actorB
    .from("actor_projects")
    .insert({
      user_id: bId,
      title: marker + "-B",
    })
    .select("id,user_id,revision")
    .single();
  const bProject = requireQuery(bResult, "Actor B project create");
  check(Boolean(bProject?.id), "Actor B create returned no project identifier");
  created.push({ owner: actorB, id: bProject.id, label: "Actor B" });
  check(bProject.user_id === bId, "Actor B owner mismatch");

  const aReadB = requireQuery(
    await actorA.from("actor_projects").select("id").eq("id", bProject.id),
    "Actor A read B",
  );
  check(aReadB.length === 0, "RLS BREACH: A can read B private project");

  const link = await actorB
    .from("actor_auditions")
    .insert({
      user_id: bId,
      project_id: aProject.id,
      title: marker + "-wrong-link",
    })
    .select("id");
  check(
    Boolean(link.error) && link.error.code === "23503",
    "Owner-project composite FK did not reject cross-account audition association",
  );

  const revisionForgery = await actorB
    .from("actor_project_revisions")
    .insert({
      project_id: bProject.id,
      user_id: bId,
      revision: 99,
      title: "forged",
      role_name: "",
      status: "active",
      notes: {},
    })
    .select("project_id");
  check(
    Boolean(revisionForgery.error) && revisionForgery.error.code === "42501",
    "Authenticated actor could write a forged revision row",
  );

  const ownUpdate = await actorA
    .from("actor_projects")
    .update({
      title: marker + "-A-updated",
    })
    .eq("id", aProject.id)
    .eq("revision", 1)
    .select("id,user_id,revision")
    .single();
  const updated = requireQuery(ownUpdate, "Owner update");
  check(
    updated && updated.user_id === aId && updated.revision === 2,
    "Owner update failed or revision not server-incremented",
  );

  const stale = requireQuery(
    await actorA
      .from("actor_projects")
      .update({
        title: marker + "-STALE",
      })
      .eq("id", aProject.id)
      .eq("revision", 1)
      .select("id"),
    "Stale update",
  );
  check(stale.length === 0, "Revision conflict overwrote a newer project");

  const revisions = requireQuery(
    await actorA
      .from("actor_project_revisions")
      .select("revision")
      .eq("project_id", aProject.id)
      .order("revision"),
    "Owner revision history",
  );
  check(
    revisions.length === 2 && revisions[0].revision === 1 && revisions[1].revision === 2,
    "Server-owned revision history missing or incorrect",
  );

  const hiddenHistory = requireQuery(
    await actorB.from("actor_project_revisions").select("revision").eq("project_id", aProject.id),
    "B read A history",
  );
  check(hiddenHistory.length === 0, "RLS BREACH: B can read A version history");

  passed = true;
  process.stdout.write("PASS: real two-account staging project RLS, owner FK, and revisions.\n");
  process.stdout.write(
    "NOTE: real-token positive audition reads, login transitions and Android QA still required.\n",
  );
} finally {
  const cleanupErrors = [];
  for (const record of created.reverse()) {
    try {
      await cleanUp(record.owner, record.id, record.label);
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : "Unknown cleanup failure");
    }
  }
  await Promise.allSettled([actorA.auth.signOut(), actorB.auth.signOut()]);
  if (cleanupErrors.length) {
    process.stderr.write(cleanupErrors.join("\n") + "\n");
    process.exitCode = 1;
  }
}
if (!passed) process.exitCode = 1;

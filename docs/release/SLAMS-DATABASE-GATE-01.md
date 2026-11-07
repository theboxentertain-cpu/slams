# SLAMS release blocker 1: database schema and migration verification

**State at authoring:** NOT RESOLVED / PRODUCTION SQL WRITES FORBIDDEN.

SLAMS Lovable project `64914af9-5120-4ab2-bf0b-13e6ee092b40` reports a Supabase database enabled. Attempts to inspect the database through its Lovable database connector returned the free-tier action-limit error. The query was **not executed**. There is no confirmed deployed schema, migration version, direct RLS result, or live backup. No migration has been applied through this work.

## Verified code findings

1. GitHub `drizzle/migrations/meta/_journal.json` lists migrations 0000–0006, but JSON is **a proposal catalog**, not a deployed migration ledger.
2. 0004 sets account-scoped RLS, ownership-immutable project revisions and an append-only history trigger. However, it also grants authenticated users DELETE on `actor_projects` and creates an owner-delete policy. Direct deletion can erase a project and its history. The UI uses archive/restore, not direct delete.
3. Migration 0007 removes project DELETE grants/policy without altering user records. **Proposed only**; not installed in a real DB.
4. 0005 defines owner-linked audition files via composite `(user_id,project_id)` FK; 0006 requires `actor_auditions(user_id,id)` uniqueness and defines owner-linked immutable script sides.
5. Existing `scripts/rls.sql` tests the foundation migrations 0000–0002 only. The expanded disposable PostgreSQL runner now installs and tests 0004–0007 as a separate phase. This is NOT a substitute for live two-account RLS.

## Exact release sequence (STOP when a gate fails)

- **A — Establish actual database:** Connect a read-only SQL console to the **SLAMS** Supabase project, not Frame Zero or any other workspace. Confirm the project identity and run `scripts/actor-db-preflight.sql`, which reads catalog metadata only. Confirm database migration ledger/table *and its actual applied entries*, including drift/partial applications. No customer/user data needs to be queried or shared.
- **B — Backup:** Prove a current restorable backup exists, plus identify production vs isolated staging. Do not send credentials in ChatGPT.
- **C — Apply missing migrations to a disposable/staging database:** Under migration administration, reconcile ledger with repository history. The academic migration 0003 is a separate proposal and may not safely apply automatically. Do not blindly execute `drizzle-kit migrate` or run the entire journal. Review each dependency and checksum before a one-time migration decision. Where valid, apply actor-work migrations **0004 then 0005 then 0006 then 0007**, transactionally, with change review and rollback procedures. Never replay installed migrations.
- **D — Database-level tests:** Run `bash scripts/test-rls.sh` in Docker. This now tests two actors, no-owner reads, project/side/audition edits, composite foreign-key spoofing, immutable source text, server revisions, project history, anon denial, and DELETE hardening in a disposable PostgreSQL 17 container with network disabled.
- **E — Live verification:** Re-run `actor-db-preflight.sql` against staging and compare catalog policy/trigger/constraint details with the expected model. Only then conduct the separate **blocker 2** real authenticated user A/B/anonymous API tests using their real sessions; the SQL role-simulation is not proof of production identity behavior.
- **F — Release approval:** Merge and deploy only once there is an explicit pass sheet documenting actual migration ledger, recovery/backup, isolation tests, Android RTL/accessibility and release owner approval.

## Non-negotiable stop conditions

- Unknown/partial deployed migration, divergence from migration checksums, missing `public.actor_projects`/auditions/sides table, RLS disabled, anon read privileges on actor private tables.
- No verified live backup, wrong account/project, RLS/ownership test failure, missing server triggers, revision collision.
- Authenticated DELETE on `actor_projects` after deployment of 0007.
- A database quota limit or connector error is **not** a security pass; mark as blocked, do not guess.

## Evidence required to close Blocker 1

- Actual deployment identity and applied migration rows (without secrets or personal actor data).
- Catalog output demonstrating tables, RLS policies, owner FKs, triggers and no unauthorized DELETE.
- Successful Docker migration/SQL-integrity CI run.
- Confirmation migration is installed in intended **staging**, not production, before any further live operations.

Until this evidence exists, Blocker 1 stays open. Blockers 2 (real session RLS) and 3 (Android RTL/accessibility) remain separate.

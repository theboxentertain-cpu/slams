# SLAMS — Actor at Work database release gate

**Current status (2026-11-07): BLOCKED FOR PRODUCTION SCHEMA CHANGES.**
**Cleared:** actual Lovable Cloud backend identification, live migration ledger inventory,
byte-for-byte migration checksum reconciliation, and legacy RLS presence inspection.
**Uncleared:** verified restorable backup, an isolated disposable staging database,
real authenticated A/B cross-owner testing, and explicit production release approval.

## Actual live backend — verified read-only

- Lovable project: `64914af9-5120-4ab2-bf0b-13e6ee092b40` (SLAMS).
- Existing Lovable-managed Supabase backend reference (project configuration):
  `edrchrzqsrfrlcfbnxhs`. Do not assume this database is accessible through
  the user's separate Supabase account.
- Separate user-owned Supabase project `bfoukjcissyardeokfev` is a **different,
  initially empty project**. **Never treat it as SLAMS production or switch the
  app's backend to it as a migration shortcut.**
- Current database: PostgreSQL 17.11, accessible for read-only SQL through the
  connected Lovable project.
- Actual `drizzle.__drizzle_migrations` ledger, verified on 2026-11-07:
  - id 1, tag `0000_sprint01b_foundation`, SHA-256
    `db2e37b4fff52904e009a075655318b69343d11215c79f0f7ec06987a1b51adc`
  - id 2, tag `0001_validate_actual_unit_progress`, SHA-256
    `2d105d575f3b84d1f2dbe93d9d19c558ff050a03847c9921ed029e5585109ff1`
  - id 3, tag `0002_curriculum_reviewed_material`, SHA-256
    `4f2820cfad7fa38e202add86c2b39f3d9273d5c9c5077fb998e57ffc232722a9`
- These three ledger hashes were independently SHA-256 recomputed over the exact
  corresponding GitHub migration file contents and **all three match**.
  `src/test/applied-lovable-migration-integrity.test.ts` protects them from
  accidental edits in subsequent pull requests.
- Live tables `profiles`, `audition_prep`, `passport_entries`, `unit_progress`,
  `schools` and `curriculum_courses` exist with RLS enabled. The existing
  `audition_prep` and `passport_entries` tables each have four role-scoped
  owner policies (SELECT/INSERT/UPDATE/DELETE).
- `actor_projects`, `actor_project_revisions`, `actor_auditions`, `actor_sides`
  and `academic_policies` are absent. New Actor at Work screens **cannot be
  assumed to persist against this backend yet**.
- The earlier Lovable free-plan SQL query quota briefly blocked queries;
  subsequently **live read-only ledger and catalog queries succeeded**.
- No production schema/data writes, migration, backup restoration, or staging
  provisioning have been performed during this audit.

## Isolated Supabase staging rehearsal (2026-11-07)

- The **separate** Supabase project `bfoukjcissyardeokfev` is authorized
  **staging only**, not the Lovable production database.
- Initial staging baseline: PostgreSQL 17.11, zero app tables, auth users,
  storage buckets and storage objects.
- Applied reviewed SQL `0000`, `0001`, `0002`, `0004`, `0005`,
  `0006`, `0007`, and subsequently `0008` role-grants hardening under
  **Supabase's staging migration ledger**.
  Academic `0003` remains deferred and was **not** applied.
- Verified after initial actor migrations: 17 public app tables, all with RLS,
  expected actor tables and triggers present, 8 schools, 36 terms,
  zero real users / actor projects / audition records. No private exported SQL
  or production user data was imported. This is a version-controlled **schema
  rehearsal**, NOT a restored production-data clone.
- **Critical staging security observation:** Supabase's default public-schema
  table privileges left `anon` and `authenticated` with `TRUNCATE` and
  other excess grants even though the migration files specified narrower
  intended `GRANT` lists; RLS does not control TRUNCATE. The signup
  SECURITY DEFINER trigger function was also directly executable by clients,
  triggering two security advisor warnings.
- A staging-first `0008_slams_role_grants_hardening.sql` explicitly revokes
  the excess grants on all 17 existing app tables, regrants only intended
  operations and revokes direct trigger-function execution. It also tightens
  new-object default privileges for the postgres role. **Apply and verify
  this correction in staging and re-run security advisors before any release.
  **Staging 0008 applied successfully (2026-11-07).** Post-apply verified:
  zero client-role TRUNCATE/TRIGGER on all 17 app tables, no client DELETE
  on any Actor at Work table, only SELECT on project revisions, internal
  trigger EXECUTE revoked, and **zero Supabase security advisor findings**.**
  Other Supabase-managed default grants (supabase_admin) are not modified.
- The staging migration ledger is `supabase_migrations.schema_migrations`,
  **not** the original production Drizzle ledger. Do not fabricate Drizzle
  history, and **never use migrate-all** while deferred `0003` is present.
- Remaining: staging-backed RLS role tests using two *real, disposable*
  Supabase auth accounts, validation of a recoverable database-export restore,
  and production backup/release approval. Production has received no DDL.

## Backup and environment gate — still open

1. In Lovable, open the **existing SLAMS project** → Cloud → Database →
   Backups. Confirm an available UTC backup timestamp. **Do not click Restore**.
   Daily backups exist as a product feature, but existence/freshness of an
   actual SLAMS restorable snapshot has not been independently checked.
2. Export a private independent snapshot via More → Cloud → Overview →
   Advanced settings → Export project data → Export data → Database → Export.
   Download and store the resulting file securely; **it may contain users and
   password hashes. Do not upload this archive into GitHub or chat.**
   Database export does not include separately stored files or application
   secrets. Export availability, integrity and restoreability are not yet proven.
3. Prepare an **isolated non-production environment** with the schema,
   sanitized fixtures, and a tested restore. A separate empty Supabase project
   may be evaluated *only as staging* after explicit environment designation;
   it is not a clone, and must never become the production app backend by
   accident.
4. Lovable's Test/Live environment feature is closed for new Cloud projects,
   so do not count on that feature as an existing staging environment.

Official documentation:
- https://docs.lovable.dev/features/database
- https://docs.lovable.dev/features/advanced-settings
- https://docs.lovable.dev/features/environments

## Migration rollout — no automatic apply

- Source proposals are `0004_actor_projects_versioned`,
  `0005_actor_auditions`, `0006_actor_sides_anchored`, then
  `0007_actor_projects_no_delete`.
- `0003_academic_progression_placement` remains **DEFERRED** with the
  Conservatory. Never execute a generic migrate-all command that may apply it.
- Validate exact source SQL, dependencies, trigger owner, default PUBLIC
  function permissions, schema privileges, database ownership, migration
  registration/ledger handling, and recovery before applying to staging.
- Run disposable PostgreSQL tests, read-only staging preflight, rolled-back
  SQL role simulations and a separate authenticated-user A/B/API isolation test.
- Require regression tests for legacy audition preparation and Passport,
  account switching, stale revision conflicts, and Android RTL/accessibility.
- Only after complete staging evidence and release approval may a controlled
  production migration plan be authorized. No unreviewed schema writes.

## Important security review

The existing `public.handle_new_user` function is SECURITY DEFINER with
`search_path=public`; review its ownership and function safety separately.
This observation is **not** proof of exploitation, and unrelated functions
must not be changed during the Actor at Work rollout without their own review.

---
## Previous release audit (historical)

**State at authoring:** NOT RESOLVED / PRODUCTION SQL WRITES FORBIDDEN.

SLAMS Lovable project `64914af9-5120-4ab2-bf0b-13e6ee092b40` reports a Supabase database enabled. Earlier **read-only** `information_schema` / `pg_catalog` inspection succeeded and confirmed legacy `audition_prep` and `passport_entries` with owner-scoped RLS policies, and **absence** of `actor_projects`, `actor_project_revisions`, `actor_auditions`, and `actor_sides`. The `drizzle.__drizzle_migrations` **ledger table** exists. Further read-only queries needed to examine its **actual entries/hashes** were blocked by the Lovable free-tier action quota; those later queries were **not executed**. Thus neither the applied migration history nor live two-account RLS has been verified. No migration or live database write has been performed through this work.

## Verified code findings

1. GitHub `drizzle/migrations/meta/_journal.json` lists migrations 0000–0007, but JSON is **a proposal catalog**, not a deployed migration ledger. The deferred academic progression migration `0003` must not be applied indirectly while rolling out Actor at Work.
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

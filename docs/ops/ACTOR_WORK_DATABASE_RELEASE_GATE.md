# SLAMS — Actor at Work database release gate
**Status:** **BLOCKED**. Read-only inventory performed on 2026-11-07; no live schema writes or production RLS tests performed.
**Scope:** Proposed `0004_actor_projects_versioned.sql` and `0005_actor_auditions.sql`. This work does **not** advance the Conservatory.

## 1. Evidence from connected Lovable Supabase (read-only)
- Project: SLAMS, Lovable project `64914af9-5120-4ab2-bf0b-13e6ee092b40`. Database enabled, PostgreSQL 17.11 (role `postgres` for inspection).
- Present: `public.audition_prep`, `public.passport_entries`, `public.profiles`, curriculum hierarchy and progress. The two legacy actor-owned tables have RLS enabled and four authenticated owner-only SELECT/INSERT/UPDATE/DELETE policies each.
- **Absent:** `public.actor_projects`, `public.actor_project_revisions`, `public.actor_auditions`. App hooks for new separate projects and multi-audition records therefore cannot save to the connected database.
- Drizzle migration ledger table `drizzle.__drizzle_migrations` **exists**. Its actual entries, schema and checksums were **NOT** inspected; the Lovable free-plan database action quota stopped further read-only queries. Do not infer applied migration versions from table presence.
- Functions `actor_projects_before_write`, `actor_projects_record_revision`, `actor_auditions_before_write` were absent at inspection.
- On-disk `drizzle/migrations/meta/_journal.json` includes 0000–0005, but 0003 is explicitly a **proposal-only academic migration** (Conservatory held last). Journal inclusion is not evidence of deployment.
- `drizzle/schema.ts` is intentionally blank. Do not use schema push/generation to repair existing production tables.
- The GitHub CI tests are mocked or source-level; they do not prove production database permissions or mobile behavior.

## 2. NO-GO conditions (all must be cleared)
- [ ] Confirm migration ledger entries / hashes, existing structure, and any partially installed DDL using `scripts/db/actor-work-preflight-readonly.sql`. Compare with the local journal and executed SQL history.
- [ ] Confirm staging environment is disposable/sanitized; take tested restorable backup and restore proof (backup is not a script checkbox).
- [ ] Backend owner approves the `0004` / `0005` code, triggers, function privileges, row-security policies, composite owner-project FK, optimistic revision and immutable identity constraints.
- [ ] Demonstrate that only `0004`, followed by `0005`, can be applied as **targeted, reviewed SQL**. **Never run all pending Drizzle journal entries**: doing so may also apply the deferred `0003_academic_progression_placement.sql`.
- [ ] Apply proposed SQL to **staging only**, after inspecting/approving the exact SQL and current schema. Document execution output and any errors.
- [ ] Run `scripts/db/actor-work-staging-rls.psql` using two distinct, disposable staging users. Its transaction rolls back test rows, but this simulates Supabase JWT claims under SQL; it is **not** real-token app verification.
- [ ] Separately test two **real authenticated user sessions** against staging REST API/SDK: no cross-user project, revision or audition reads; no forged writes; cross-owner project association rejected; legitimate owner writes confirmed.
- [ ] Confirm legacy `audition_prep` and `passport_entries` still work and existing data remains unchanged. Test auth sign-out/account switch, stale revision conflict and unavailable-schema failure.
- [ ] Record screenshots/logs of RTL/LTR UI, guest/login transitions and error handling; no claim of production readiness before separate real Android tests.
- [ ] Review production lock impact, expected database size, rollback/recovery and required maintenance window. Obtain explicit deployment authorization from the database owner.
- [ ] Only after the staging/evidence gates pass: approve a production migration sequence with clear audit log and rollback procedure. Do not silently import guest work or make destructive schema changes.

## 3. SQL changes proposed by the repository (NOT deployed)
**0004**
- Creates actor_projects and append-only actor_project_revisions.
- Composite unique `(user_id,id)`; revision row FK `(user_id,project_id)`, RLS owner-only SELECT on history.
- BEFORE trigger increments server-owned revision, prevents identity/owner changes.
- AFTER SECURITY DEFINER trigger records revisions; function `search_path=''` and qualified `public.` table. Review trigger owner, execution role and security context in staging.
- Authenticated role can SELECT/INSERT/UPDATE/DELETE own projects; cannot directly write history; no anon table grants.

**0005**
- Requires 0004's composite unique key; creates `actor_auditions`.
- Composite FK `(user_id,project_id)` requires an audition and its attached project to share an owner; nullable project is permitted.
- BEFORE trigger increments revision and freezes owner/identity; authenticated SELECT/INSERT/UPDATE only. No client DELETE.
- No modification to `audition_prep` or `passport_entries`.

**Schema gaps to examine:** FORCE ROW LEVEL SECURITY is not enabled by 0004/0005; this is normally acceptable for authenticated roles but database-owner bypass exists. Verify policy and operational expectations. Confirm table and function ownership, grants, Supabase API exposure, trigger execution, FK error handling and realistic upload limits. Do not treat source review as equivalent to executed RLS tests.

## 4. Repeatable verification commands (authorized operator)
```bash
# Read-only schema/ledger inventory. Use an approved read connection.
psql -X -v ON_ERROR_STOP=1 "$STAGING_DB_URL" -f scripts/db/actor-work-preflight-readonly.sql

# Only once approved SQL 0004/0005 is applied to an isolated staging DB:
psql -X -v ON_ERROR_STOP=1 \
  -v confirmed_nonproduction=yes \
  -v actor_a="$STAGING_ACTOR_A_UUID" \
  -v actor_b="$STAGING_ACTOR_B_UUID" \
  "$STAGING_DB_URL" -f scripts/db/actor-work-staging-rls.psql
```
Do **not** commit credentials, passwords, service-role keys, real test identities or DB URLs. The staging harness has `ON_ERROR_STOP` and a final `ROLLBACK`; failure aborts its open transaction and must be investigated before a second run.

## 5. Rollout boundary and stop conditions
- **No production SQL** has been issued in this work. The connected live database is unchanged.
- If the audit ledger is inconsistent with 0000–0002, or if 0003 is pending, stop and reconcile before trying to run a migration tool.
- If any simulated or real two-user RLS assertion fails, **stop the release**; fix and re-run on clean staging.
- If the auth/test service has insufficient privileges, do not bypass RLS to make tests pass.
- If script-side PR adds `0006_actor_sides.sql`, it needs a **separate follow-up migration review**; it does not authorize auto-apply of the full journal.
- Preserve Conservatory-last lock. No academic migrations should be applied indirectly.
- Final decision requires **documented approval and observed production deployment**, not just test green badges.

**Related:** [GitHub issue #33](https://github.com/theboxentertain-cpu/slams/issues/33)

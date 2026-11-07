# SLAMS — Lovable Cloud original backend migration reconciliation
**Audit date:** 2026-11-07  
**Release state:** **NO-GO FOR PRODUCTION DDL** until the backup / staging / real-auth gates pass.  
**Authorized source:** Original Lovable project `64914af9-5120-4ab2-bf0b-13e6ee092b40` (Cloud-managed Supabase). Project environmental reference `edrchrzqsrfrlcfbnxhs`.  
**Do not target:** Standalone, empty Supabase project `bfoukjcissyardeokfev` as if it were the existing SLAMS backend.

## Verified read-only evidence
1. Lovable account and project are connected; Cloud DB reports enabled and PostgreSQL 17.11.
2. Live `drizzle.__drizzle_migrations` has **exactly three rows**, with IDs 1, 2, 3. Comparison of SHA-256 of **the full GitHub migration SQL files** with the live ledger produced **three exact matches**:
   
   | Migration | SHA-256 matches live ledger |
   | --- | --- |
   | `0000_sprint01b_foundation.sql` | `db2e37b4fff52904e009a075655318b69343d11215c79f0f7ec06987a1b51adc` |
   | `0001_validate_actual_unit_progress.sql` | `2d105d575f3b84d1f2dbe93d9d19c558ff050a03847c9921ed029e5585109ff1` |
   | `0002_curriculum_reviewed_material.sql` | `4f2820cfad7fa38e202add86c2b39f3d9273d5c9c5077fb998e57ffc232722a9` |
3. Exactly 13 public application tables observed: `audition_prep`, `curriculum_assessments`, `curriculum_courses`, `curriculum_exercises`, `curriculum_imports`, `curriculum_lessons`, `curriculum_terms`, `curriculum_workshops`, `curriculum_years`, `passport_entries`, `profiles`, `schools`, `unit_progress`. **Every one** has `relrowsecurity=true` in PostgreSQL catalog.
4. RLS policies for the legacy actor-owned `audition_prep`, `passport_entries`, `profiles` and `unit_progress` have `auth.uid()` ownership predicates; curriculum hierarchy has public SELECT policies. This is a policy inventory, **not** a real-user privacy certification.
5. `actor_projects`, `actor_project_revisions`, `actor_auditions` and `actor_sides` are **absent**. Migration `0003` academic progression is also not installed. No migration `0004`–`0007` has been installed.
6. The workspace project list contains one project, original SLAMS. **No separate Lovable staging project** exists in that workspace.
7. A later schema/trigger detail query failed once from an incorrect column name and its corrected retry was rejected by Lovable's free-tier MCP query limit. Therefore **column/trigger/FK detail reconciliation remains incomplete**. No mutation executed in either attempt.

## Environment constraints, verified against official Lovable documentation
- Lovable Cloud backend is **not** the user's standalone Supabase project and does not supply its managed database credentials in the personal Supabase dashboard.
- Lovable Cloud has **daily database snapshots** accessible in the project UI: **Cloud → Database → Backups** (retention up to roughly 14 days). A backup's **existence, timestamp, export and restore integrity have not yet been verified for this project**. Do not assume a restore has been tested.
- Lovable's built-in Test/Live environments are **closed to new projects since 2026-03-24**; this October 2026 project cannot newly opt in. See https://docs.lovable.dev/features/environments.
- Lovable Cloud **remix** creates a separate Cloud project with copied backend schema but **no user data**. It is a possible sanitized staging route, but **has not been created**; any additional Cloud usage/charges should be reviewed and authorized first. See https://docs.lovable.dev/features/cloud.
- Official backup documentation: https://docs.lovable.dev/features/database.

## Targeted staging-only migration order
- Do **not** invoke a generic Drizzle journal migrate command. `0003_academic_progression_placement.sql` is explicitly deferred until the Conservatory work.
- After a real isolated staging database is available and its starting schema is verified: review/apply **`0004_actor_projects_versioned.sql`, then `0005_actor_auditions.sql`, then `0006_actor_sides_anchored.sql`, then `0007_actor_projects_no_delete.sql`**. Do not skip or alter this order.
- Verify owner-scoped RLS for all four tables, revision triggers, immutable source/owner, composite FKs, no authenticated DELETE, and cross-owner/anonymous denial using **two real disposable staging accounts**. The disposable PostgreSQL simulation in CI is not a live Supabase session test.
- Verify app hooks, account switching and stale-revision behavior, and Android RTL/accessibility before any production release.

## Remaining gates
- [x] Correct original Lovable backend identified
- [x] Read-only migration ledger fetched
- [x] Three installed migration hashes match GitHub SQL exactly
- [x] 13 existing public app tables enumerated; RLS enabled on all
- [ ] Full trigger/column/constraints/grant catalog inspection complete
- [ ] Daily backup snapshot and restorable/exportable backup proved
- [ ] Isolated staging Cloud project provisioned and backend identity confirmed
- [ ] Staging `0004`–`0007` applied and audited; `0003` excluded
- [ ] Two actual authenticated user sessions and anonymous cross-account tests pass
- [ ] Android device, RTL and accessibility regression passes
- [ ] Production owner approves deployment and rollback/recovery procedure

**No live schema changes, restores, backup claims, staging creation or migration ledger edits were made by this audit.**

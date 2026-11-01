# Sprint 01B engineering closure review

Review date: November 1, 2026. Inspected `main` at `34bfc86ab675889c0c05dee7b4db5bca67eb5b8c` (merge of PR #1). Working branch: `chore/sprint-01b-closure-sprint-02-plan`.

## Closure decision

Local build, type, application-regression and database-policy checks pass. Sprint 01B is **not fully signed off**: full-repository lint is still failing, live email confirmation/recovery and independent two-account verification remain outstanding, and the account-deletion policy below is a tested proposal rather than a deployed change. See the [blocker list and live verification protocol](sprint-01b-blockers.md).

The earlier [stabilization report](sprint-01b-stabilization.md) records the Passport fixes already merged into main. `roadmap.md` also contains historical browser/backend claims from another run; those are not evidence of tests performed in this review. This review did not execute browser automation, mailbox flows or live backend mutations.

## Current verification

Runtime: Node 24.19.0, Bun 1.3.11, installed frozen-lockfile dependencies; PostgreSQL 17 in disposable Docker containers for SQL checks.

| Command/check                                                             | Current result                        | Evidence and limits                                                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                                                                | PASS: 72 tests, 8 files               | No failures or skips; includes Passport import, audition, session, routing, school and scripted-scene regressions                                      |
| `npm exec tsc -- --noEmit`                                                | PASS, exit 0                          | Strict settings unchanged                                                                                                                              |
| Clean `npm run build`                                                     | PASS, explicit exit 0                 | Prior `.output` and `node_modules/.nitro` were moved to a temporary backup before building; fresh client, SSR and Nitro/Cloudflare output generated    |
| `npm run lint`                                                            | FAIL: 823 errors, 7 warnings          | All 823 errors are existing Prettier formatting diagnostics; 6 React Refresh warnings and 1 unused-disable warning; files itemized in the prior report |
| `bash scripts/test-rls.sh`                                                | PASS, repeated in two fresh databases | Existing 33 RLS checks plus 39 new deletion/retention checks; simulated Supabase roles/claim context, not live JWTs                                    |
| `bash -n scripts/test-rls.sh`; `git diff --check`                         | PASS                                  | Runner syntax and patch whitespace                                                                                                                     |
| Browser/Android/Lovable visual checks                                     | NOT RUN                               | Interface audit uses source and inspection of existing image files                                                                                     |
| Live email/authentication, actual two-account RLS, hosted migration state | NOT VERIFIED                          | Backend/API destinations are still absent from the running allowlist; no two confirmed test-account sessions supplied                                  |

Build diagnostics retained: Vite advises that `vite-tsconfig-paths` overlaps its native path support; Nitro warns that `inlineDynamicImports` is ignored when `codeSplitting` is set. Neither prevented the successful clean build. Do not remove plugins bundled by Lovable to silence them.

The initial batched clean-build invocation reported exit 1 despite a log ending in successful output generation, with no compiler error. A standalone build and a second build after clearing generated output both returned explicit exit 0. No source build/type error was reproduced; no application-code workaround was introduced. The successful clean invocation is the verification evidence, not the mere existence of build files.

## Necessary engineering change

The SQL runner's Unix-socket readiness check could accept PostgreSQL's temporary initialization server, then invoke `psql` while that server was shutting down. This occurred during the first deletion test attempt (`No such file or directory` for the PostgreSQL socket). The runner now waits for TCP readiness on the final database server inside the network-isolated container. The original RLS checks and new deletion checks then passed on two fresh runs. Container data is removed on exit, and no host port is published.

No application source, routes, styles, artwork, curriculum, credentials, generated integrations, dependency manifests, lockfiles or registered migrations are changed by this closure work. The additions are the runner repair, tested SQL proposal and review documents.

## Account-deletion audit

| Data                                       | Current relationship to `auth.users`        | Effect of hard deletion today                                                                  |
| ------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `profiles.id`                              | Existing FK with `ON DELETE CASCADE`        | Profile removed                                                                                |
| `passport_entries.user_id`                 | No FK; RLS scopes access                    | Rehearsal/reflection rows can become orphans                                                   |
| `audition_prep.user_id`                    | No FK; RLS scopes access                    | Audition notes can become orphans                                                              |
| `unit_progress.user_id`                    | No FK; RLS scopes access                    | Unit progress can become orphans                                                               |
| Schools, hierarchy, curriculum imports     | Shared content, no account ownership        | Must remain intact                                                                             |
| Browser demo records and Director settings | Browser storage, separate from cloud tables | A server-side account deletion cannot clear these; do not erase unrelated browser demo records |

RLS isolation and referential cleanup solve different problems: an orphan can remain inaccessible through normal authenticated policies while still being retained by the database. The disposable test first reproduces all three orphan cases before installing the proposal. It cannot establish the live orphan count.

No account-deletion endpoint or client admin capability was found. Do not add a browser service-role key or expand generated integrations to implement deletion. Soft deletion/ban/sign-out are not hard deletion and would not invoke a foreign-key cascade. Inventory other deployed tables, storage objects and retention obligations separately; the repository alone cannot establish their absence in production.

## Proposed cleanup migration — not scheduled or deployed

Files:

- [Read-only preflight](proposals/account-deletion-preflight.sql): aggregate orphan counts and existing foreign-key definitions. It needs an authorized role with visibility of all rows; an ordinary user's RLS-filtered count is insufficient.
- [Proposed migration](proposals/account-deletion-cleanup.sql): add three `user_id -> auth.users(id) ON DELETE CASCADE NOT VALID` constraints in one transaction with bounded lock/statement timeouts.
- [Regression SQL](../scripts/account-deletion.sql): reproduce the current failure, apply the proposal only to a disposable database, and test its behavior.

`NOT VALID` deliberately preserves historical orphan rows without scanning them during installation. It still enforces new owner relationships and cascades future hard deletions of existing users. It is **not** a declaration that historical integrity is fixed. No blanket `DELETE WHERE user_id NOT IN (...)`, reassignment, invented auth user or automatic purge is included. Existing owner indexes/primary keys cover the three child-side lookups.

The proposal is outside `drizzle/migrations` and absent from its journal. Running the application or its normal build cannot apply it. Only the network-isolated SQL test runner loads it. Do not promote it to a deployable migration until the retention semantics and production rollout are approved.

### Operator rollout proposal

1. Confirm which environment/database is targeted, inventory hosted schema/RLS drift, and compare existing constraints with the read-only preflight. Run the aggregate query as an authorized operator; keep any later row-level investigation out of public logs. Schedule a maintenance window appropriate to table size and concurrent account operations.
2. Decide and approve hard-deletion semantics, any applicable retention requirements, and the treatment of previously orphaned records. Verify a restricted backup/PITR recovery process before adopting cascade behavior; a removed constraint cannot recover already-deleted data.
3. Promote the tested constraint SQL through the normal migration review process. Its transaction should either add all three constraints or none; lock/statement timeout is a stop condition, not a reason to disable verification. Existing equivalent/differing constraints need explicit reconciliation; the proposal intentionally fails on a duplicate name instead of silently assuming equivalence.
4. Review historical orphan candidates against a consistent backup and deletion/restore history. Missing `auth.users` rows can also reflect an incomplete restore: absence alone is insufficient authorization to destroy progress. A separately approved cleanup would use an exact reviewed owner/record manifest, recheck ownership absence in the deletion transaction, assert the expected affected counts and retain only the approved, access-controlled recovery material for its approved lifetime. No executable historical purge is supplied in this PR.
5. Once counts are zero or historical records have been repaired under the approved policy, separately run `ALTER TABLE ... VALIDATE CONSTRAINT ...` for the three named constraints. Tests prove validation currently fails when legacy orphans remain. Record validation/row counts and independently confirm an actual test-account deletion and an unaffected second account in a nonproduction backend first.
6. Before a committed hard deletion, transaction rollback restores cascaded rows (tested). After commit, recovery requires the approved backup/PITR procedure. Rolling back just the schema means dropping only the three new foreign keys; it does not restore deleted accounts or data. Preserve all existing RLS policies and the profile FK.

### Proposal regression coverage

The 39 new checks verify baseline orphan reproduction; installation preserves all rows; constraints remain staged; legacy orphans prevent validation; new missing-owner relationships are rejected; authenticated users cannot delete auth accounts or spoof another owner; RLS remains scoped; deleting A removes A's profile and all three progress types; B and all 8 schools/36 terms survive; legacy orphan rows survive; transactional rollback restores the account and progress; deleting a profile alone does not delete its auth user/progress.

Progress fixtures bypass only the unrelated published-unit trigger during privileged fixture creation or the isolated FK-denial probe. The trigger is restored before deletion tests, and the original suite separately checks rejection of nonexistent units. No curriculum content is authored or imported.

## Next work

Complete the live protocol, agree on orphan retention, and review the [Sprint 02 visual blueprint](sprint-02-visual-blueprint.md). Visual implementation and migration promotion each require their own review; this change implements neither a redesign nor a live deletion policy.

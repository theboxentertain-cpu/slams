# Sprint 01B closure verification and account-deletion proposal

Verified November 1, 2026 on current fetched `origin/main` **`e2d2481`** (includes the earlier Director's Office PR). Separate engineering branch: `fix/sprint-01b-deletion-proposal`. The earlier [stabilization report](sprint-01b-stabilization.md) describes the merged Passport/import and identity fixes; those fixes remain unchanged.

## Engineering verification

| Executed check                                                 | Result                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm test`                                                     | **95 passed**, 11 files; no skipped tests                                                        |
| `npm exec tsc -- --noEmit`                                     | Passed                                                                                           |
| `npm run build` in a fresh worktree with no prior output       | Passed; client, SSR and Nitro/Cloudflare output                                                  |
| `npm run lint`                                                 | **Failed: 788 existing Prettier errors and 7 warnings**, unchanged from the main-branch baseline |
| `bash scripts/test-account-deletion.sh`                        | Passed on disposable PostgreSQL 17; also executes the existing complete RLS regression           |
| `bash -n scripts/test-account-deletion.sh scripts/test-rls.sh` | Passed                                                                                           |
| `git diff --check`                                             | Passed                                                                                           |

No genuine application build/type error was reproduced. The existing nonfatal bundler-option/path-resolution advisories do not justify changing Lovable's framework configuration. No application code, routes, artwork, curriculum, authentication, credentials, generated integrations, dependencies or active migrations were changed on this engineering branch.

The necessary runner fix waits for PostgreSQL's final TCP listener inside the isolated container. The old Unix-socket readiness probe could succeed against the image's temporary initialization server immediately before it restarted; this caused a real connection failure during this run. Both SQL runners now avoid that race. No ports are exposed, and the container has `--network none`.

## Deletion audit

`profiles.id` already references `auth.users(id) ON DELETE CASCADE`. `passport_entries.user_id`, `audition_prep.user_id` and `unit_progress.user_id` have no auth-user foreign keys in the checked-in migrations. Their RLS policies restrict owners, but do not remove rows when a user is permanently deleted. The regression reproduces all three orphan types using synthetic users, before testing the proposed fix.

No browser account-deletion workflow or Supabase Storage upload/bucket use was found in application source. Permanent administrative deletion and soft deletion must be distinguished: a soft-deleted `auth.users` row still exists, so a foreign-key cascade alone does not implement a soft-deletion retention policy. Browser-local guest records also have no authenticated owner and must not be indiscriminately erased. This proposal covers the three database-owned record tables and permanent user deletion only.

The live number of orphaned rows is **unknown**. This count-only query can be run by a trusted database operator without exporting private records:

```sql
BEGIN READ ONLY;
SELECT 'passport_entries' AS source, count(*) AS orphan_count
FROM public.passport_entries p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id=p.user_id)
UNION ALL
SELECT 'audition_prep', count(*) FROM public.audition_prep p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id=p.user_id)
UNION ALL
SELECT 'unit_progress', count(*) FROM public.unit_progress p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id=p.user_id);
ROLLBACK;
```

### Tested proposal — not applied to the live database

The SQL lives under `ops/proposals/account-deletion/`, **outside automatic migration discovery**. Neither application startup nor the test runner connects to a supplied database URL. Each phase refuses to execute unless its separate session opt-in is set by an operator. These guards support review; they are not substitutes for database privileges or a retention decision.

1. [01-prevent-orphans.sql](../ops/proposals/account-deletion/01-prevent-orphans.sql) proposes three `ON DELETE CASCADE NOT VALID` foreign keys. New references must have an existing owner and future permanent deletion removes that owner's rows. Existing orphan rows stay intact; validation is deferred. This phase alone changes future permanent-deletion semantics and needs review before promotion into active migrations.
2. [02-quarantine-and-validate.sql](../ops/proposals/account-deletion/02-quarantine-and-validate.sql) is a separately approved maintenance operation. It locks owner/source tables, copies each complete orphan row plus an archive timestamp into an owner-only schema while removing it from the active table, then validates all three constraints. Moves, archive creation and validation share one transaction; any failure rolls everything back. The schema has RLS with no policies and no schema/table grants to public, anonymous, authenticated or service-role application users. Existing archives cause failure rather than being overwritten. There is no automatic archive expiry or hard purge.

Before either phase is promoted: reconcile actual hosted definitions and existing constraints; inspect count-only inventory; approve permanent-deletion and archive-retention policy; verify backup/restore; choose a maintenance window; review row volumes, lock impact and the platform's permission to reference/lock `auth.users`; and test in staging. Each phase is a one-time migration, not an idempotent startup script. A failed transaction can be retried; an already committed phase must be tracked rather than rerun blindly. The 5-second lock timeout aborts if locks cannot be acquired. Once acquired, the quarantine can still take substantial time on a large table.

Rollback planning matters: removing the new foreign keys can stop future cascades, but cannot recreate already cascaded records. Archived legacy rows retain every source field and are recoverable only through a separately reviewed operator process; do not recreate deleted identities or reassign their records automatically. Backups and a retention/erasure decision are prerequisites for live execution. Quarantine itself is still sensitive personal data and must stay out of exposed APIs, logs and analytics. Its eventual deletion/expiry policy is deliberately unresolved.

### Regression coverage actually executed

`scripts/test-account-deletion.sh` creates a fresh network-isolated PostgreSQL 17 container, applies all three existing migrations through the existing RLS audit, tests both approval guards, then executes `scripts/account-deletion.sql`. The container/data are removed on exit. Synthetic privileged unit-progress fixtures temporarily bypass only the published-content trigger; it is restored before assertions, and the final test verifies it remains enabled. No curriculum is authored or published.

The tests verify:

- All three current orphan cases and the existing profile cascade.
- Legacy preservation in phase one, refused validation while orphans remain, new invalid-owner rejection on all three tables, and RLS restrictions on forged/stale-owner requests.
- Complete field preservation in the archive, no other owner's data changed, valid foreign keys afterward, archive isolation from anonymous/authenticated/service-role application users, and no client permission to delete auth users.
- An injected failure on the third move, after Passport and audition rows have moved: every earlier move and the archive DDL roll back, constraints stay unvalidated, and the unchanged proposal succeeds on retry. Expected injected SQL errors in the test log are asserted rollback coverage, not ignored final failures.
- A subsequent permanent deletion cascades only that owner's profile/Passport/audition/progress; the independent user's records, all eight schools, 36 terms and content guard survive.

## Remaining blockers and live verification

1. **Repository lint:** 788 Prettier errors plus six React Refresh warnings and one unused-disable warning remain in unchanged files. Reproduce exact file/line diagnostics with `npm run lint`; no rules were suppressed and no broad formatting change was mixed into this proposal.
2. **Live backend access:** the configured Supabase/Lovable host is blocked by the running network policy. A saved environment draft is not an applied policy. Disposable PostgreSQL roles and mocked SDK tests do not verify deployed migrations, PostgREST, JWT validation, signup triggers, grants or backend behavior.
3. **Email and identity lifecycle:** use actual confirmed test users to verify signup/email delivery/confirmation links, trusted redirect allowlists, login, token refresh/expiry, recovery/reset, sign-out and cross-tab identity changes. No emails were sent or live sessions used in this closure run.
4. **Two independent accounts:** confirm A and B independently, using isolated browser profiles. Save/import unique and colliding Passport IDs; retry failed/partial imports; verify readback before local cleanup; switch users during pending reads/writes; and prove A cannot read, insert for, transfer to, update or delete B's Passport, audition or unit progress. Verify anonymous restrictions, actual server-side curriculum publication/term gates and account milestone counts. Do not substitute service-role requests for end-user RLS checks. No live two-account verification is claimed.
5. **Deletion policy and deployment:** both cleanup phases remain unapproved proposals outside active migrations. Actual orphan inventory, archive retention/erasure, backup/restore, schema/grant review and staging verification are still required. No destructive live changes were applied.
6. **Runtime preview/deployment:** the existing `npm run preview`/TanStack output-path mismatch and local workerd's older compatibility-date support are documented in the [office report](directors-office-implementation.md). The successful clean build is not proof of a deployed Cloudflare/Lovable runtime. No production deployment or new browser test is claimed for this engineering branch.
7. **GitHub API:** active policy returns Forbidden from `api.github.com`; branch pushes work, but automatic PR creation may remain blocked. No merge is authorized or performed by this work.

The later supplied-reference visual revision is isolated on `feat/directors-office`; its own report covers 101 tests, the 92-check browser runs and generated screenshots. This engineering branch intentionally contains only the cleanup proposal, regression harness, readiness fix and closure report.

# Sprint 01B stabilization verification

Branch: `fix/sprint-01b-passport-import`. Base: `c2c087e` (main at inspection).
Validated on November 1, 2026 with Node 24.19.0 and Bun 1.3.11.

## Fixes

- Passport imports previously removed all submitted IDs, even when `ON CONFLICT DO NOTHING` skipped them. Cleanup now requires an owner-scoped readback matching every Passport field and the timestamp. Conflicting or incomplete versions sharing an ID remain local; exact duplicates count as one persisted entry.
- Imports deduplicate submitted IDs, retain data on write/read/storage failures, and recover from lost write responses. Cleanup reads current local storage so concurrent edits and new records survive. Corrupt/inaccessible storage fails closed.
- Late Passport and audition completions are rejected after an identity transition or unmount. Passport reads include an explicit owner filter; RLS remains the security boundary. Private hook data is hidden while identity is loading.
- Audition imports require a returned owner-scoped row. Concurrent inserts cannot overwrite cloud notes, and updates to an empty cloud row are conditional on its last-read timestamp. Identical earlier imports can be retried; concurrent local edits remain in the browser.
- SessionProvider remains the single identity owner/listener. Cross-tab sign-out, expiry and account replacement now cancel and clear private query caches before committing the next identity. Obsolete initial reads and overlapping transitions cannot resurrect an old user.
- Passport status includes the confirmed count for partial imports. Routes, visual design, curriculum, generated Supabase integration files, dependencies and lockfile are unchanged.

## Verified checks

| Check                                                | Result                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm test`                                           | 72 passed across 8 test files; no failures or skipped tests                            |
| `npm exec tsc -- --noEmit`                           | Passed                                                                                 |
| `npm run build`                                      | Passed (client, SSR and Nitro/Cloudflare outputs)                                      |
| ESLint on all changed TypeScript/TSX files           | Passed with no errors or warnings                                                      |
| `bash scripts/test-rls.sh`                           | Passed against disposable PostgreSQL 17 with all three checked-in migrations           |
| `bash -n scripts/test-rls.sh` and `git diff --check` | Passed                                                                                 |
| `npm run lint`                                       | Failed: 823 pre-existing formatting errors and 7 pre-existing warnings, itemized below |

Local HTTP smoke checks also passed: the homepage, Scene, Passport and auth routes returned expected SSR content.

The new regression tests exercise the real hooks with deferred Supabase responses and localStorage. They cover duplicate and conflicting IDs, failed writes/verification, partial imports, lost-response retries, per-field mismatches, concurrent local edits, storage failures, StrictMode, unmounts, account switches, audition confirmation/concurrency and session cache ordering.

The build emits an existing advisory that `vite-tsconfig-paths` overlaps Vite's native path resolution, plus a warning that `inlineDynamicImports` is ignored when `codeSplitting` is specified. Neither fails the build; the Lovable/Nitro plugin configuration is preserved.

## Authentication and RLS audit

- Initial identity uses `auth.getUser()` and rejects errors. SDK identity callbacks remain synchronous; cancellation/router work runs outside the auth callback. Explicit sign-out still cancels and clears before `auth.signOut()`.
- Browser writes derive `user_id` from the session, not form input. `saveUnitProgress` independently verifies the user and rejects browser-supplied owners with a strict schema.
- Server auth middleware verifies bearer claims with `getClaims`, creates a request-scoped client carrying that bearer token, and derives identity from `sub`. The global client middleware attaches the session token; CSRF middleware is registered for server functions.
- Checked-in policies enable RLS for profiles, Passport, audition prep and unit progress. SELECT/DELETE use `auth.uid()` ownership; INSERT and UPDATE require the same owner, including UPDATE `WITH CHECK`. Anonymous roles have no private-data policies. Public curriculum structure is intentionally readable. Curriculum writes are service-role only; database triggers reject progress for nonexistent/unpublished units and publishing unreviewed material.
- Privileged Supabase client remains in `client.server.ts`; no browser-admin import endpoint was found. Curriculum import planning is used only by tests, with actual execution reserved for a trusted operator. No credentials were printed, added, or changed; only existing public backend configuration is used.
- `scripts/test-rls.sh` runs PostgreSQL in a disposable container with no network or exposed ports, mounts only the SQL and migrations, and removes the container/data on exit. SQL simulates Supabase roles and `auth.uid()` via a test claim; it checks two-user isolation, forged ownership, transfer attempts, read/update/delete restrictions, cross-owner ID collisions and anonymous restrictions. A privileged temporary progress fixture bypasses the content trigger only during insertion; the trigger is restored before ownership tests and nonexistent-unit rejection is tested with the trigger enabled. No changes are applied to a live backend.

## Outstanding integration verification and limitations

1. The running network policy blocks the configured Lovable Cloud backend (proxy tunnel returns HTTP 403). Its exact hostname is saved in the environment draft, but that draft has not been applied. A successful local PostgreSQL audit does **not** prove those migrations/policies are deployed or that hosted Supabase grants, JWT enforcement, signup triggers or PostgREST behavior match the repository. Re-run against the deployed backend with two separate test accounts, including own/foreign reads, spoofed inserts, ownership updates/deletes, and a cross-owner duplicate import.
2. Live signup/email confirmation, sign-in, token expiry/refresh, recovery redirect allowlists/email delivery, password reset and cross-tab sign-out remain unverified. No authenticated test accounts or session credentials were supplied. Public/publishable backend settings alone cannot validate these flows. Do not use service-role credentials to stand in for user-isolation checks.
3. Browser end-to-end flows inside Lovable, including the generated preview auth broker and real multi-tab identity changes, remain unverified. Hook tests use SDK mocks, and the SQL audit simulates the claim context rather than validating actual JWTs. The preview broker restricts trusted editor origins/request IDs; this PR preserves its generated implementation.
4. Private table `user_id` columns (Passport, audition prep and unit progress) have no auth.users foreign key in the checked-in migrations. RLS still restricts access, but deletion of an auth user can leave orphaned progress. Account-deletion retention/cleanup policy needs a separate decision and migration; this PR does not silently delete records.
5. Conflicting Passport records sharing an ID are deliberately retained, and retries will keep them until the conflict is reconciled. Incomplete/malformed records are also retained. No automatic destructive conflict resolution or new export UI is introduced.
6. GitHub Git access works, but the running policy blocks `api.github.com` (both REST and GraphQL return Forbidden). That hostname was added to the environment draft without dropping the existing backend hostname. Apply the network settings to allow PR creation; saving the draft alone neither applies nor publishes it.

## Remaining repository-wide lint diagnostics

Baseline before changes: 889 errors and 9 warnings. All remaining errors are `prettier/prettier` in unchanged files. Six warnings are `react-refresh/only-export-components`; `src/routes/work.tsx` has one unused ESLint-disable warning. No rules were disabled to make the checks pass. Reproduce exact line-level diagnostics with `npm run lint`.

| File                                              | Formatting errors | Warnings |
| ------------------------------------------------- | ----------------: | -------: |
| `src/components/CurriculumUnit.tsx`               |                26 |        0 |
| `src/components/SystemStub.tsx`                   |                 3 |        0 |
| `src/components/slams.tsx`                        |                22 |        0 |
| `src/components/ui/badge.tsx`                     |                 0 |        1 |
| `src/components/ui/button.tsx`                    |                 0 |        1 |
| `src/components/ui/form.tsx`                      |                 0 |        1 |
| `src/components/ui/navigation-menu.tsx`           |                 0 |        1 |
| `src/components/ui/sidebar.tsx`                   |                 0 |        1 |
| `src/components/ui/toggle.tsx`                    |                 0 |        1 |
| `src/data/scene.ts`                               |                10 |        0 |
| `src/data/schools.ts`                             |                15 |        0 |
| `src/integrations/supabase/auth-attacher.ts`      |                 7 |        0 |
| `src/integrations/supabase/auth-middleware.ts`    |                41 |        0 |
| `src/integrations/supabase/client.server.ts`      |                13 |        0 |
| `src/integrations/supabase/client.ts`             |                21 |        0 |
| `src/integrations/supabase/cron-auth.ts`          |                14 |        0 |
| `src/integrations/supabase/previewAuthStorage.ts` |                29 |        0 |
| `src/integrations/supabase/types.ts`              |               396 |        0 |
| `src/lib/auth-utils.ts`                           |                 1 |        0 |
| `src/lib/curriculum-import.ts`                    |                 9 |        0 |
| `src/lib/curriculum-schema.ts`                    |                61 |        0 |
| `src/lib/curriculum.functions.ts`                 |                10 |        0 |
| `src/lib/unit-progress.ts`                        |                 8 |        0 |
| `src/routes/__root.tsx`                           |                 3 |        0 |
| `src/routes/auth.tsx`                             |                14 |        0 |
| `src/routes/baseline.tsx`                         |                 2 |        0 |
| `src/routes/conservatory.$school.tsx`             |                19 |        0 |
| `src/routes/conservatory.index.tsx`               |                 4 |        0 |
| `src/routes/director.tsx`                         |                 2 |        0 |
| `src/routes/index.tsx`                            |                 8 |        0 |
| `src/routes/lab.tsx`                              |                 2 |        0 |
| `src/routes/lounge.tsx`                           |                 2 |        0 |
| `src/routes/matrix.tsx`                           |                 2 |        0 |
| `src/routes/reset-password.tsx`                   |                 6 |        0 |
| `src/routes/scene.tsx`                            |                28 |        0 |
| `src/routes/stuck.tsx`                            |                 9 |        0 |
| `src/routes/work.tsx`                             |                10 |        1 |
| `src/test/auth-utils.test.ts`                     |                 1 |        0 |
| `src/test/foundation.test.ts`                     |                13 |        0 |
| `src/test/scene-regression.test.tsx`              |                 9 |        0 |
| `src/test/schools.test.tsx`                       |                 3 |        0 |

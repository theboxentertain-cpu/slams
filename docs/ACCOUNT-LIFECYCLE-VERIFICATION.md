# Account lifecycle verification

The Settings account tab supports immediate deletion of an email-and-password account and its owned cloud data. There is no 30-day recovery period. Browser-only guest records are separate and are not silently imported or deleted.

The POST server function accepts the exact phrase `DELETE MY ACCOUNT`, the current password, and an `expectedUserId` assertion binding the form to the account displayed when it was submitted. Identity comes from an access token independently checked with Auth `getUser`, followed by fresh password verification for that same user. A mismatch with the untrusted expected ID stops the request, and the cleanup target always comes from verified Auth identity. Other fields, including a caller-supplied target user ID, are rejected. Passwords are not placed in URLs, logs, browser persistence or query caches. Production requests require HTTPS. Managed server admin credentials remain in the server module; the browser never receives the service role key.

Before deletion begins, the server requires its managed admin binding, the service-only deletion-job table, all foundation tables and the private `actor-script-sources` bucket. Only truly absent newer Actor tables (`42P01`/`PGRST205`) may be skipped. Missing credentials, unavailable services and failed password verification stop cleanup. Email/password-less accounts require administrator-assisted verification; the UI states this limitation.

After verification, a durable pending job locks authenticated database and Storage access, including requests carrying an older still-unexpired JWT. All refresh sessions are revoked. The server enumerates and removes only the verified user's source-folder objects, deletes dependent owned rows with explicit ownership filters, verifies zero owner-row counts and an empty source prefix, then permanently deletes the Auth user last. Pending jobs are never cleared on failure. Retrying repeats idempotent storage/row deletes and resumes the same cleanup. If the final receipt update fails after confirmed Auth deletion, the result reports the deleted account with `receiptPending: true`; an operator must reconcile the pending receipt.

The final verification catches work that appears before its read. It does not prove that a write or upload authorized before the pending-job gate cannot finish afterward. That in-flight race must be exercised against the managed backend before release; full closure is not yet proven. Keep the release gate closed if late resources can survive the verified cleanup.

## Automated checks

`npx vitest run src/test/account-lifecycle.test.ts src/test/account-deletion-ui.test.tsx src/test/session-isolation.test.tsx src/test/architecture-cleanup.test.tsx`

Coverage includes missing admin credentials, inactive Auth users, same-user fresh password verification, preflight-before-mutation, the durable lock and cleanup sequence, partial-failure retry, owner-filtered child-first deletion, missing-table versus permission failures, paginated nested Storage cleanup, untrusted paths, unavailable UI, exact confirmation, password clearing, confirmed-success sign-out and overlapping account transitions. These tests use mocks; they do not delete real accounts or prove production behavior.

## Required disposable-account verification before release

1. Confirm the managed deployment has the server admin binding and the lifecycle migration/RLS gate. An unavailable deployment must show the unavailable message and perform no cleanup.
2. Use two disposable invited accounts. Populate projects and project history, auditions, sides plus private source originals, scenes, rehearsals, journal history, Passport and progress. Record the second account's rows and objects separately.
3. Attempt wrong-password and incorrect-phrase deletion. Verify both accounts and all data remain intact. Verify server and network logs do not record password bodies or credentials.
4. Confirm deletion on the first account. Verify its source objects and every owned table row are absent, Auth user absent, and the service-only job completed. Verify the second account's rows/objects remain unchanged. The service role key must be absent from shipped browser bundles.
5. Before expiry, replay the first account's saved JWT against table reads/writes and Storage. Every operation must be denied by the active-account gate, even though Supabase JWTs can outlive refresh-session revocation.
6. Introduce a controlled cleanup failure using a test deployment. Verify the Auth user remains, the job stays pending, database/Storage access is denied, the UI reports incomplete cleanup, and retry finishes after the failure is resolved. Race an already-started upload and write against deletion, then check for residual rows and source objects after the requests settle.
7. Exercise signup/invitation, verification, sign-in, password reset, session expiry, account switching, cross-tab sign-out and deletion on physical Android Chrome. Verify password re-entry, keyboard/focus, pending/error screens and signed-out private-cache isolation.

No production account was deleted as part of implementation. Production-backed deletion, pending-job recovery and real Android evidence are release gates; local test success is not a release approval.

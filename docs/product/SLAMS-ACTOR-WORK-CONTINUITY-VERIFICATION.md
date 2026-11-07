# Actor at Work continuity — implementation and release evidence

Date: 2026-11-07. Source baseline: `65cc905`. Branch: `feat/actor-work-continuity`.

**SOURCE IMPLEMENTED; PRODUCTION RELEASE BLOCKED.** The existing Lovable project and backend remain unchanged. This change does not publish the app, install production SQL, restore production data, or certify physical Android behavior.

## Implemented behavior

- Existing projects, auditions, character files and breakdowns retain their owners and independent revision-checked saves. Editor changes are protected during router navigation, browser Back/reload and local file selection. Confirmed saves clear warnings; failed saves retain text.
- Project journals provide project selection, explicit create/edit/archive/restore, server-generated read-only revision history and contextual audition/rehearsal links. Loading history stages a draft; it does not save it.
- Personal scenes retain their project/audition and immutable script-side version. Manual text rehearsals support cloud draft save/resume, actor-entered actions/observations, direction, retakes, reflection and immutable completed review. Returns reopen the original project/editor/audition. Saved historical context survives subsequent audition relinking.
- Source imports accept paste, strict UTF-8 TXT, text PDFs and DOCX. Extraction stays in the browser; PDF uses a local worker. DOCX ZIP inflation/XML parsing is bounded on the main thread (2 MB XML, expansion/count/ratio guards); this remains an Android performance acceptance item. Scanned/encrypted PDFs, entities, active DOCX content and malformed documents are rejected with a text fallback.
- Raw imports have a 10 MB limit; extracted previews are bounded to 200,000 characters and 5,000 lines. The actor selects and explicitly reviews an excerpt before saving within the existing per-side 25,000-character, 60 KB, 400-line and 40-annotation limits. The original file remains private with SHA-256 provenance; extracted/edited text is a separately approved snapshot.
- New source versions preserve the original parent and stable source group. No annotation is silently rebased or copied. Existing sides retain their IDs/text and acquire legacy provenance. Stable insertion IDs and readback/hash recovery handle lost upload and save acknowledgements.
- Browser clients cannot delete or overwrite original files. Uncertain or rejected saves may leave private originals retained for retry or server-side account cleanup; this deliberately prioritizes preservation over automatic garbage collection.
- Account deletion uses a server-only admin binding, authoritative Auth validation, same-account password reauthentication, displayed-account intent verification, a durable pending marker, session revocation, owner-scoped file/data cleanup and an emptiness check before Auth deletion. Missing bindings/schema/storage fail closed. Partial failures remain pending for retry/support.
- A pending deletion serializes against application and private-source metadata writers and denies further access. Validated Auth foreign keys prevent late legacy orphan inserts. Actual managed Storage upload-vs-deletion behavior remains a separate live gate.

The existing authored `Stay` scene, original guest audition record and Passport history are preserved. User scripts generate no partner intelligence, acting diagnosis, grades or academic credit. UI copy is English/Arabic; actor-written text is never translated.

## Proposed database packages

Run only an explicitly reviewed, hash-pinned allowlist. Existing production `0000`–`0002` bytes are unchanged. **Never migrate-all; academic `0003` remains deferred.**

1. Existing Actor at Work dependencies `0004` → `0005` → `0006` → `0007` → `0008`.
2. `0009_actor_work_continuity`: immutable source/version metadata; owner-linked scenes, rehearsals, journals and revision triggers; completion/context validation and narrow grants.
3. `0010_account_lifecycle_guard`: validated legacy Auth FKs; service-only deletion receipts; restrictive active-account policies and per-owner writer/deletion serialization. Existing legacy orphans cause validation to fail; they are never silently removed or assigned a guessed owner. Authenticated writes require READ COMMITTED isolation, the standard PostgREST mode.
4. `0011_actor_script_storage`: private source bucket and restrictive owner/immutability policies, plus source metadata writer serialization. No client DELETE of originals, even under another broad Storage policy.

The typed extensions use the same authenticated client, not a different runtime backend. New schema absence produces an explicit unavailable state. Privileged account deletion requires a managed server-side service binding; no admin key or cleanup implementation is included in browser bundles.

## Verification boundaries

- Full repository lint repairs keep all rules enabled. Existing Fast Refresh warnings are reported separately from errors.
- Application tests cover identity replacement, immutable source/readback, lost acknowledgements, version conflicts, journal history, contextual takes and draft protection. Architecture checks account for all 47 responsibilities, including the sides route; structural coverage does not establish full blueprint acceptance.
- `scripts/test-rls.sh` applies the allowlisted proposals only to an isolated disposable PostgreSQL instance. Its Storage tables emulate policy behavior; they do not simulate the Storage HTTP service.
- `scripts/test-account-deletion-race.sh` uses independent SQL connections to prove prior writers delay the deletion marker and queued writes fail after pending commits. It is network-isolated and never accepts a remote database target.
- `scripts/db/test-backup-recovery-runner.sh` passes using **synthetic data**. Matching the documented row counts is by construction, not evidence that the owner's private Android export was recovered.
- `scripts/actor-script-import-browser-smoke.py` executes the real browser parser and PDF worker with five synthetic document checks: PDF, bilingual DOCX, exact CRLF TXT, scanned PDF rejection and malformed PDF rejection. It blocks external requests. Desktop Chromium at a phone viewport is not physical Android evidence.
- CI now includes architecture ownership tests and the deletion race test alongside full lint/types/tests/build and existing disposable database/recovery-runner tests.

Final local results: full Vitest **407 tests / 63 files passed**; eight independent architecture-auditor tests passed; 47/47 owner coverage passed while full product compliance remains incomplete; TypeScript and production build passed; full ESLint passed with zero errors and ten Fast Refresh warnings. The final source-save retry hardening was additionally rerun against its 13 hook tests, TypeScript and a fresh production build. Browser import smoke passed five real Chromium checks. Disposable SQL and independent-connection deletion race suites passed. Synthetic backup-runner tests passed. Browser output inspection found no service-role binding or account-cleanup implementation in public chunks. `git diff --check` passed; applied SQL and Stay data have empty diffs.

These results are repeated in the PR description. No simulated test is described as production-backed persistence or real account lifecycle evidence.

## Mandatory production and beta gates

The production read-only audit found only the three foundation migrations installed, 13 RLS-enabled public application tables, excessive client TRUNCATE/TRIGGER/other grants, and direct client execution privileges on internal trigger functions. Proposed hardening has not changed those live grants.

Before any production migration: verify a current native Lovable backup and supported isolated restore procedure, reconcile schema/ledger/checksums, review the exact SQL, rehearse with two real staging accounts and secure credentials, and approve the recovery/rollout package. Keep work in the existing Lovable workspace; do not make a Codespace transfer necessary or restore over production. If safe isolated native recovery is unavailable, record BLOCKED and keep release closed.

After approved schema rollout, keep beta closed while controlled production accounts prove create/edit/reload, cross-device retrieval, isolation, conflict recovery, script original retrieval, source revisions, linked rehearsals, journals, and account deletion. Restore representative new data and private files as well as legacy data. Check that deletion is respected after recovery and document backup retention.

Configure invitation-only enrollment through the managed Auth service before beta access; do not rely on hiding a signup button. Preserve existing authorized accounts. No signup setting or invitation has been changed here.

Physical Android must pass the owner-run checklist in `docs/ops/ACTOR_WORK_ANDROID_ACCEPTANCE.md`. Until persistence, recovery, lifecycle, privileges and real device evidence pass, the app remains unpublished and the invited beta remains closed.

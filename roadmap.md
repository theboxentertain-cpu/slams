# SLAMS Sprint 01B — Foundation Repair

## Current verification request
- [ ] November 2 clean production-build verification — BLOCKED: no fresh production-build result or supported non-publishing build trigger is available; manual builds are reserved to the platform harness. Historical successful build logs do not verify this run. Existing regression suite executed: 163 tests passed across 19 files; no app, backend, or publishing changes made.
- [x] Inspect current preview signals: automatic build OK at 2026-11-01 03:49:23 UTC; no current compiler failure reproduced
- [x] Rerun full automated tests: 32 passed across 5 files; independent typecheck/production build remain unverified below
- [x] Recheck desktop/mobile: 104 browser assertions passed; zero uncaught page errors; navigation, scene/Director, managed session, cloud saves and consent verified
- [x] Recheck live access policies: owner/spoofed/anonymous/nonexistent-unit probes passed; RLS enabled on four private tables; one account, zero email-confirmed accounts
- [x] Report this run separately; temporary cloud Passport records removed and existing audition notes restored

- [x] DB schema: profiles (+signup trigger), passport_entries, audition_prep, unit_progress, curriculum hierarchy (schools→assessments) with GRANTs + RLS
- [x] Seed 8 schools / 36 terms from existing data (no fabricated course content)
- [x] Auth UI: /auth (signup, signin, forgot password), /reset-password, session-aware header, sign-out
- [x] Cloud persistence for Passport + audition prep with opt-in local→cloud import
- [x] Versioned validated curriculum JSON import architecture (zod schema + validator)
- [x] Demo banner copy update (signed-in vs signed-out)
- [x] Automated tests: 32 pass across auth helpers, schools, migration/import, routes and scene regression
- [x] Automatic TypeScript check exits 0; preview reports build OK
- [ ] Real curriculum content import — blocked on reviewed authored material
- [ ] Email-confirmation/password sign-in/recovery E2E — blocked on an available confirmation/recovery link; managed-session restoration is verified instead

## Continuation
- [x] Repair foundation test fixture indexing using nonempty tuples, preserving strict compiler settings
- [x] Verify desktop/mobile navigation, all Director modes, nine scene obstacles, branches/retakes, local/cloud Passport and audition refresh persistence
- [x] Verify live RLS: 14 owner/spoofed-write/anonymous/nonexistent-unit checks pass
- [ ] True two-account isolation — blocked on two usable confirmed accounts (current database: one account, zero email-confirmed); nonowner UUID probes are not a substitute
- [x] Centralized session-aware navigation and sign-out verified in the browser
- [x] Opt-in Passport import and audition import-conflict retention verified
- [x] Validator tests and nonexistent-unit rejection verified; no lessons imported
- [x] Complete leaf-route sharing metadata without changing visuals
- [ ] Separate production build — not run manually because platform instructions reserve builds to the harness; preview build OK is not claimed as production verification
- [x] Browser regression: 66 core checks + 8 extended checks passed; no uncaught page errors in core run
- Verification used the existing test account and saved clearly named regression Passport entries and audition notes in it.
- Current November 1 run cleaned up its own temporary cloud Passport entries and restored prior cloud audition notes; no design, application source, database policies, or curriculum were changed.
- [ ] Independent TypeScript rerun — reserved to the platform harness; this run exposes build OK but no separate TypeScript exit result
- [ ] Signup confirmation, successful password login and completed password recovery — no usable mailbox confirmation/recovery link available; validation, invalid login, recovery request and missing-link rejection verified

# SLAMS Sprint 01B — Foundation Repair

- [x] DB schema: profiles (+signup trigger), passport_entries, audition_prep, unit_progress, curriculum hierarchy (schools→assessments) with GRANTs + RLS
- [x] Seed 8 schools / 36 terms from existing data (no fabricated course content)
- [x] Auth UI: /auth (signup, signin, forgot password), /reset-password, session-aware header, sign-out
- [x] Cloud persistence for Passport + audition prep with opt-in local→cloud import
- [x] Versioned validated curriculum JSON import architecture (zod schema + validator)
- [x] Demo banner copy update (signed-in vs signed-out)
- [~] Tests: auth helpers done (9 tests); migration/import logic done; RLS verified live via signed-in cloud save; still missing: dedicated scene regression test, multi-user isolation test
- [x] Typecheck + tests (21 pass) + browser verification (signed-out, signup, signed-in, refresh, sign-out, cloud save)
- [ ] Remaining: real curriculum content import (blocked on authored content), Passport entry cloud write E2E via full rehearsal, email-confirmation-aware E2E sign-in test

## Continuation
- [ ] Centralize session-aware navigation and safe sign-out
- [ ] Await cloud writes, expose failures, retain rejected local imports, prevent audition import overwrite
- [ ] Strengthen curriculum validation and wire actual-unit progress with database existence checks
- [ ] Run automated rehearsal/migration/validator tests and database multi-user RLS checks
- [ ] Run desktop/mobile browser regression and document verified vs blocked checks

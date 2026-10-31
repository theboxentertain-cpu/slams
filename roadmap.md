# SLAMS Sprint 01B — Foundation Repair

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
- [ ] True two-account isolation — blocked on a second confirmed account (database currently has one); nonowner UUID probes are not a substitute
- [x] Centralized session-aware navigation and sign-out verified in the browser
- [x] Opt-in Passport import and audition import-conflict retention verified
- [x] Validator tests and nonexistent-unit rejection verified; no lessons imported
- [x] Complete leaf-route sharing metadata without changing visuals
- [ ] Separate production build — not run manually because platform instructions reserve builds to the harness; preview build OK is not claimed as production verification
- [x] Browser regression: 66 core checks + 8 extended checks passed; no uncaught page errors in core run
- Verification used the existing test account and saved clearly named regression Passport entries and audition notes in it.

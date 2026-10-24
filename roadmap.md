# SLAMS Sprint 01B — Foundation Repair

- [ ] DB schema: profiles (+signup trigger), passport_entries, audition_prep, unit_progress, curriculum hierarchy (schools→assessments) with GRANTs + RLS
- [ ] Seed 8 schools / 36 terms from existing data (no fabricated course content)
- [ ] Auth UI: /auth (signup, signin, forgot password), /reset-password, session-aware header, sign-out
- [ ] Cloud persistence for Passport + audition prep with opt-in local→cloud import
- [ ] Versioned validated curriculum JSON import architecture (zod schema + validator)
- [ ] Demo banner copy update (signed-in vs signed-out)
- [ ] Tests: auth helpers, migration/import logic, RLS verification, routes, scene regression
- [ ] Typecheck + tests + browser verification; report blockers (email confirmation prevents scripted E2E sign-in)

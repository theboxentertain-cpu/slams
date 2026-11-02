# SLAMS C01 — Source reconciliation and Meisner Y1/T1 editorial pilot

**Date:** November 2, 2026. **Status:** NON-PUBLISHED EDUCATIONAL DRAFT. No program completion, mastery or credential is authorized.

## What has been recovered

The original SLAMS internal Content 02 (34-term) architecture is organized:
School → Year → Term → Course → Workshop → Lesson → Exercise.
The original Content 03 Meisner Y1/T1 v0.9 contains:
- 3 courses and 3 workshops
- **9 complete, originally authored lesson manuscripts**
- **6 full exercise scripts**
- Director/media writing and a term assessment with instructor-review requirements
- `meisner-t01-w01-l01` through `meisner-t01-w03-l03` and corresponding exercise IDs
- `publication_authorized=false`, `term_graduation_allowed=false`, and null official repetition quotas

The later independent 124-page eight-school compendium and 265-page exercise manual use a **different 36-term, 432-unit structure**, with a separate 12-unit Meisner Y1/T1 outline. They are additional reference material, **not** an approved replacement of Content 02/03. The existing app exposes a provisional 36-term map; C01 does not change that map or migrate identifiers without a reviewed crosswalk.

**Important quantitative warning:** The original 34-term architecture has 306 lesson IDs + 204 exercise IDs (=510 different records); the newer manual has 432 combined lesson/lab units. These figures cannot be equated.

## Source protection

Original full lesson and exercise manuscripts remain in the private SLAMS source packages. This pull request intentionally commits only concise editorial identifiers and objectives to the public app repository. **Do not commit the 73KB original Content 03 manuscript JSON to this public repository without explicit owner authorization and rights review.**

Original source files:
- `SLAMS_CONTENT_02_34_TERM_ARCHITECTURE/09_MEISNER_FIRST_TERM_BUILD_CONTRACT.md`
- `SLAMS_CONTENT_03_MEISNER_TERM_01/05_LOVABLE_IMPORT_MEISNER_T01.json`
- `SLAMS_CONTENT_03_MEISNER_TERM_01/01_NINE_COMPLETE_LESSON_MANUSCRIPTS.md`
- `SLAMS_CONTENT_03_MEISNER_TERM_01/02_SIX_FULL_EXERCISE_SCRIPTS.md`
- `SLAMS_CONTENT_03_MEISNER_TERM_01/03_TERM_ASSESSMENT_AND_RUBRIC.md`
- `SLAMS_CONTENT_04_PROGRESSION_ASSESSMENT_ENGINE.zip`
- `SLAMS_ACADEMIC_AUDIT_265_PAGE_MANUAL.md`

## Implemented in this PR

- Read-only, source-derived lesson/exercise inventory on Meisner Year 1 Term 1.
- Optional unsaved solo observation/reflection preparation; no grader or synthetic partner.
- Preservation of existing live catalog availability checks, publication gates, auth, progress, Passport, and school routes.
- Explicit warnings: qualified educator review required, partner work cannot be certified solo, no term graduation.
- Regression tests asserting nine/six IDs, parent associations and refusal to publish.

## Required next gates (not completed)

1. Crosswalk 34-term Content 02 IDs against the later 36-term/432-unit compendium; resolve discrepancies with the product owner and educational reviewer.
2. Confirm every source-based methodological and institutional claim using dated first-party references.
3. Independently review all nine original Meisner lessons, six exercises, rubric, safeguards, rights, and accessibility alternatives.
4. Calibrate the assessment with a qualified practitioner; keep pass thresholds nullable until approved.
5. Build real consent-aware partner practice, evidence submission, human review and progression without treating self-report or a timer as proof.
6. Store approved manuscripts only through an appropriate rights-controlled delivery mechanism.
7. Run TypeScript, Vitest, production build, browser/device checks and live backend tests. They are **not executed by this connector-based PR authoring run**.

**No migrations or credential changes. No existing progression gates bypassed.**

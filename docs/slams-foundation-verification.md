# SLAMS foundation — architecture and verification

November 1, 2026. Branch: `feat/slams-foundation`, based on approved office revision `ac66a0f`. Review base: `feat/directors-office`; current fetched main is `e2d2481`, which contains the earlier office version. No history rewrite, merge, deployment or database migration is part of this work.

This implements the **foundation first** scope selected from the attached 17-part master directive: shared navigation, required page/tab architecture, and integration with the approved office. Meisner teaching content remains gated. Later curriculum, professional-workflow, recording and multiplayer milestones are not represented as complete.

## Architecture discovered and preserved

The existing application uses React 19, TanStack Start/Router/Query, Tailwind, Radix, the Lovable Vite configuration and Nitro/Cloudflare output. SessionProvider remains the only identity owner/subscriber. Passport and audition preparation retain signed-out browser storage, signed-in owner-scoped cloud persistence and explicitly confirmed imports. All eight school identities, their provisional year distributions and 36 terms remain canonical. Living Scene retains its fixed dialogue and nine scripted tactic/intervention combinations.

No changes were made to the persistence/import hooks, identity lifecycle, curriculum pack/schema/import pipeline, generated Supabase integrations, credentials, migration journal, SQL, dependencies or lockfile. No curriculum was authored. Existing draft Stuck Desk suggestions were moved unchanged into a reusable data module, retaining their faculty-review disclaimer.

The shared application shell wraps the existing nested route outlet **inside** the existing SessionProvider. It adds one five-link navigation bar, a keyboard skip link and measured bottom clearance. The common Page header and office use the same profile menu. Existing auth, recovery and page metadata are retained; functional and error pages expose a focusable content target. No duplicate provider, competing navigation bar or new application was introduced.

## Navigation and routes

Exactly five persistent destinations: **Office `/`**, **Schools `/conservatory`**, **Rehearse `/rehearsal`**, **Work `/work`**, **Stuck Desk `/stuck`**. Descendants highlight their actual world; supporting/account pages do not falsely highlight Office. The bar respects safe areas and its measured height, including enlarged text.

All tab selections use validated `?tab=` values with safe defaults. Browser Back restores selection. Required tab labels and order are centralized in `src/lib/foundation.ts`.

| Destination          | Route                                           | Tabs / behavior                                                                                                            |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Office               | `/`                                             | Desk, Work Wall, Rehearsal Corner; three equal world entrances                                                             |
| Conservatory         | `/conservatory`                                 | All Schools / In Progress / Completed                                                                                      |
| School               | `/conservatory/$school`                         | Overview / Curriculum / Practice / Assessments / Progress                                                                  |
| Year                 | `/conservatory/$school/years/$year`             | Canonical year and term links                                                                                              |
| Term                 | `/conservatory/$school/years/$year/terms/$term` | Available course links, provisional requirements and catalog states                                                        |
| Curriculum unit      | `/conservatory/$school/units/$kind/$unitId`     | Course, workshop, lesson, exercise or assessment; correct school/ancestor resolution and reviewed-publication availability |
| Rehearsal Studio     | `/rehearsal`                                    | My Scenes / New Scene / Sessions                                                                                           |
| Living Scene         | `/scene`                                        | Existing working scripted rehearsal; parent link to Rehearsal Studio                                                       |
| Actor at Work        | `/work`                                         | Auditions / Projects / Characters / Self-Tapes                                                                             |
| Audition File        | `/work/audition`                                | Brief / Script / Character / Preparation; original working form in Preparation                                             |
| Character File       | `/work/character`                               | Biography / Relationships / Objectives / Behavior / Notes                                                                  |
| Scene Breakdown      | `/work/breakdown`                               | Beats / Objectives / Obstacles / Tactics                                                                                   |
| Self-Tape Studio     | `/work/self-tape`                               | Setup / Takes / Review / Export                                                                                            |
| Project Journal      | `/work/journal`                                 | Scenes / Notes / History                                                                                                   |
| Stuck Desk           | `/stuck`                                        | Describe / Scene / Identify; existing expandable draft interventions                                                       |
| Diagnosis            | `/stuck/diagnosis`                              | Observations / Possible Causes                                                                                             |
| Intervention         | `/stuck/intervention`                           | Technique Options / Instructions; existing draft suggestions                                                               |
| Retry                | `/stuck/retry`                                  | First Attempt / New Attempt / Compare                                                                                      |
| Saved Fixes          | `/stuck/saved`                                  | History / Useful Exercises                                                                                                 |
| Actor’s Baseline     | `/baseline`                                     | Prepare / Perform / Reflect / Next Steps                                                                                   |
| Performance Lab      | `/lab`                                          | Takes / Compare / Notes                                                                                                    |
| Technique Matrix     | `/matrix`                                       | Compare / Apply / Cautions                                                                                                 |
| Rehearsal Lounge     | `/lounge`                                       | Sessions / Partners / Shared Scenes                                                                                        |
| Passport             | `/passport`                                     | Journey / Evidence / Portfolio / Badges; existing records/import/delete behavior retained in Journey                       |
| Progress             | `/progress`                                     | By School / By Skill / History                                                                                             |
| Director             | `/director`                                     | Existing profile, seven expressions, ON / QUIET / OFF                                                                      |
| Settings             | `/settings`                                     | Account / Privacy / Language / Accessibility                                                                               |
| Help                 | `/help`                                         | Accurate guide to available features and data behavior                                                                     |
| Account and recovery | `/auth`, `/reset-password`                      | Existing functional authentication UI                                                                                      |

Preserved school slugs: `stanislavski`, `meisner`, `adler`, `practical-aesthetics`, `chekhov`, `laban`, `strasberg`, `viewpoints`. Invalid schools, year/term combinations, unit kinds and malformed UUIDs are rejected. When catalog loading fails, school/year structure remains navigable with an explicit retry state. Failed catalog loading does not become a false “empty course” or a fabricated missing lesson. Actual published unit contents and healthy hosted catalog behavior still require live backend verification.

## Working behavior versus scaffolds

| System                           | Genuinely functional now                                                                                                        | Still unavailable / in development                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Office                           | Three connected views, books, typed hotspot destinations, coaching panel, profile menu, motion/sound preferences                | New school paintings, wardrobes, twelve-expression expansion and detailed character animation                             |
| Conservatory                     | Eight book entrances, year/term hierarchy, existing published-material rendering and progress controls, availability gates      | Reviewed Meisner pilot, detailed educational sections, new prerequisites, assessment criteria and whole-school completion |
| Living Scene                     | All nine scripted combinations, practice notes, retake, reflection, confirmed Passport save                                     | Resumable drafts, personal scripts, recording and AI evaluation                                                           |
| Audition preparation             | Original fields, saves, explicit local import, read-only brief/character summary of the actor’s own notes                       | Multiple files, deadlines, dedicated Character File, script storage and project history                                   |
| Stuck Desk                       | Original four draft suggestions and scene-practice links                                                                        | Saved intake, diagnosis, linked attempt comparison and saved fixes                                                        |
| Passport                         | Existing rehearsal records, reflections, imports and deletion                                                                   | Recording attachments, portfolio projects, qualification badges and assessment evidence                                   |
| Progress                         | Loaded rehearsal count, complete owner-scoped unit-record counts, mapped school activity, real history and eligible resume link | Skill scores, school-completion certification, inferred next curriculum requirements                                      |
| Settings                         | Existing account management and shared browser-local Director/motion/sound controls                                             | Recording permissions, Arabic/RTL, captions, voice, mature-language filter, notifications and account export/deletion     |
| Baseline / Lab / Matrix / Lounge | Required destinations/tabs, clear availability, functional links to current rehearsal/schools                                   | Guided baseline, take playback/comparison, reviewed method comparisons, live partners/shared scenes                       |

The work form was moved into a reusable component and its canonical detail destination. Preparation stays mounted while tabs change, preserving unsaved edits; Brief and Preparation share one audition-state owner so confirmed account saves immediately update the summary. Inputs are disabled during save/import to prevent edits being overwritten by a pending completion. New unfinished systems do not display fake forms, save actions, projects, online actors or recordings. English remains the available interface language. Unsupported settings are explained rather than presented as functional switches.

### Genuine progress and resume

Private metadata reads explicitly filter `unit_progress` by the current user, use identity-keyed query caches and cancellation signals, and hide results during loading, errors, sign-out and account changes. Reads paginate with stable keys and an exact count; incomplete, duplicate or count-changing page sets fail closed instead of yielding misleading totals. This is metadata access through the existing client and RLS, not a new privileged endpoint.

Resume requires a stored **started** record matching an available published/reviewed unit and its parents. A school’s Progress pane restricts resume to that school. Missing, completed, unknown-kind, unpublished or inaccessible records do not produce a resume link. New save handling invalidates the existing unit query plus account summary and office milestone queries only after confirmed success.

School activity is attributed only through actual catalog matches. Unmapped records do not establish school completion. The Completed filter explains that reviewed completion requirements are absent. Skill scoring is unavailable. Passport-derived counts describe loaded records; this work does not change the existing Passport retrieval API or claim that it implements unlimited server pagination. Parent availability is enforced for navigation/resume; no new server-side prerequisite or qualification system is claimed.

The clapperboard remains **Start rehearsal** because completed Passport records are not resumable rehearsal drafts.

## Office objects, components and assets

| Object                                 | Actual destination/action                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| Eight desk books                       | Full-screen mobile selector; original eight school routes and full Conservatory |
| Acting Coach                           | Accessible coaching dialog; Director preferences and `/director` link           |
| Clapperboard / corner stage            | `/scene`                                                                        |
| Arched rehearsal entrance              | `/rehearsal`                                                                    |
| Annotated screenplay / bad-acting wall | `/stuck`                                                                        |
| Casting folder / scene notes           | `/work`                                                                         |
| Technique board                        | `/matrix`                                                                       |
| Actor portfolio                        | `/passport`                                                                     |
| Progress sheet / bell                  | `/progress`                                                                     |
| Mirror / camera / chair                | `/baseline` / `/lab` / `/lounge`                                                |

The six shortcut tiles were replaced by three equal world entrances. Supporting features remain reachable through room objects and the profile menu. Two real touch conflicts were found and fixed: the new bad-acting wall covered the casting folder, and transparent character bounds intercepted the rehearsal-window sign. The expanded browser regression clicks labels as well as object centers at narrow and desktop widths.

New reusable responsibilities include AppShell/ProfileMenu, URL-controlled SectionTabs, explicit availability panels, school/year/term/unit presentations, workspace pages, the extracted audition form, training/progress summaries, shared preferences and CoachPanel. Existing book, character, prop and common Page components are reused. File routes remain TanStack file routes; the generated route tree reflects those additions.

The approved Director hero, matching expression atlas, office, desk, paper, book vectors and licensed Caveat font are reused without replacing source artwork. No new character or school illustration was generated. CSS adds the arched entrance, shared navigation, functional controls, school accents and responsive object placement. New screenshots are verification artifacts, not production scene substitutes. School environment paintings, wardrobe variants, additional expressions, advanced character motion and Arabic typography remain future production assets/work.

## Executed verification

| Check                                 | Result                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Baseline tests / TypeScript / build   | 101 tests passed; TypeScript/build passed                                                                                 |
| Final automated tests                 | **115 passed across 15 files**, no skipped tests                                                                          |
| TypeScript                            | Passed                                                                                                                    |
| Clean production build                | Passed after removing ignored `.output`; client, SSR and Nitro/Cloudflare output                                          |
| Changed-file ESLint                   | Passed with no errors or warnings                                                                                         |
| Full repository lint                  | **664 existing formatting errors and 6 React Refresh warnings** in unchanged files; baseline was 788 errors / 7 warnings  |
| Diff whitespace check                 | Passed                                                                                                                    |
| Development browser                   | 228 foundation checks and 89 office/rehearsal checks passed, zero uncaught page errors                                    |
| Compiled-worker foundation suite      | **237 checks passed**, zero uncaught page errors, including error-page skip-link focus and unsaved audition tab retention |
| Expanded compiled-worker office suite | **115 checks passed**, zero uncaught page errors                                                                          |

New automated coverage exercises resume eligibility and publication ancestry, owner filters/cancellation, stale account responses, unknown/error counts, pagination beyond 1,000 records, refusal of partial results, tab validation, summary invalidation after successful versus failed saves, unsaved audition-tab retention, and shared confirmed cloud state between the form and brief. Existing import, audition, session-isolation and rehearsal regressions are retained. Office assertions were updated for the intentional navigation and coaching-panel changes.

The browser suites exercise every listed tab, direct loading, browser Back, the eight school/year structures, invalid hierarchy, profile focus, shared preferences, reduced motion, 320/360/390/412/768/1440px layouts, 200% root text sizing, 48px primary targets and measured bar clearance. The office suite additionally tests real navigation through props and their labels, all nine rehearsal branches, silent takes, actual local Passport and audition save/reload, and the genuine persisted-record reaction.

These runs use isolated signed-out Chromium contexts, not live accounts. Synthetic unit metadata is confined to tests and is never packaged as teaching content. Browser JSON, screenshots and optional lab evidence are generated under `/workspace/slams-foundation-verification`.

Reproduce with externally installed Playwright/system Chromium (no production dependency added):

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3103 \
SLAMS_ARTIFACT_DIR=/tmp/slams-foundation-verification \
node scripts/verify-foundation.cjs
# Use the same variables with scripts/verify-office.cjs for the office/rehearsal suite.
```

Final screenshots: [Office portrait](screenshots/foundation-office-mobile.png), [Office desktop](screenshots/foundation-office-desktop.png), [eight schools](screenshots/foundation-schools-mobile.png), [Work](screenshots/foundation-work-mobile.png), [Work Wall](screenshots/foundation-work-wall-mobile.png), and [Rehearsal Corner](screenshots/foundation-rehearsal-corner-mobile.png). Fixed navigation appears at the viewport edge in full-page captures; the tests separately verify scroll clearance and actual control activation.

Committed machine-readable evidence: [237 foundation checks](verification/foundation-browser.json), [115 office/rehearsal checks](verification/foundation-office-browser.json), and [synthetic performance sample](verification/foundation-performance.json).

One local lab sample used Chromium at 390×844, 2× density, 4× CPU slowdown, 80ms latency and 750KB/s download. First contentful paint was 716ms; load was 2,364ms. Across 90 transition frames, median interval was 16.7ms and the 95th percentile was 33.3ms; two intervals exceeded 50ms. The four existing WebP images totaled 1,254,678 bytes. This single synthetic sample is not a physical Android benchmark, field metric or release performance guarantee.

### Local compiled-runtime limitation

The existing `npm run preview` output-path mismatch remains. Verification uses external Wrangler 4.156.0 against `.output/server/wrangler.json` with **local-only** `--compatibility-date 2026-10-30`, because installed workerd does not support Nitro’s generated `2026-11-01` date. Local fallback `Request.cf` metadata is used when its metadata request is blocked. Neither production configuration nor framework plugins were changed. The runner is restarted after a rebuild to avoid stale hashed-asset references. Passing these checks is not a deployed Lovable/Cloudflare verification.

## Remaining release blockers — not verified

1. **Lint:** the existing 664 formatting errors and six warnings remain. No rules were suppressed. Formatting touched files removed 124 baseline formatting errors and the previous unused-disable warning.
2. **Live backend:** deployed catalog, reviewed lessons, actual end-user JWT/RLS behavior, progress writes, cloud persistence/imports and cross-device behavior need backend access and independent confirmed accounts. Mocked tests and guest browser checks do not establish these.
3. **Identity/email:** signup confirmation/delivery, recovery redirects, login, token refresh/expiry and actual cross-tab account transitions still need live verification. No emails or authenticated backend writes were made.
4. **Curriculum:** the reviewed Meisner Year 1 Term 1 pilot is absent. Teaching content, prerequisites, academic assessment criteria, structured lesson sections and advancement remain gated; navigable pages do not make these complete.
5. **Device/accessibility/performance:** physical Android, TalkBack, platform text scaling, landscape, contrast across all states and intermittent networks need testing. Chromium/root-font emulation is not a physical device audit or production performance guarantee.
6. **Unfinished tools and assets:** recording/storage/consent/export, partner infrastructure, professional records and history, Arabic/RTL, additional settings and school illustrations remain future milestones as identified above.
7. **Deployment and PR access:** preview-output and intended-runtime-date verification remain open. GitHub API access has previously returned Forbidden; a branch push is not proof that a PR exists. No automatic merge or deployment is performed.

Account-deletion proposals and their retention decisions remain on the separate engineering branch. This foundation does not promote or apply them.

## File manifest

Modified existing files:

```text
scripts/verify-office.cjs
src/components/CurriculumUnit.tsx
src/components/office/DirectorsOffice.tsx
src/components/office/OfficeDirectory.tsx
src/components/office/RehearsalCorner.tsx
src/components/office/WorkWall.tsx
src/components/office/office-data.ts
src/components/slams.tsx
src/routeTree.gen.ts
src/routes/__root.tsx
src/routes/auth.tsx
src/routes/baseline.tsx
src/routes/conservatory.$school.tsx
src/routes/conservatory.index.tsx
src/routes/lab.tsx
src/routes/lounge.tsx
src/routes/matrix.tsx
src/routes/passport.tsx
src/routes/reset-password.tsx
src/routes/scene.tsx
src/routes/stuck.tsx
src/routes/work.tsx
src/styles.css
src/test/office.test.tsx
```

Added files:

```text
docs/screenshots/foundation-office-desktop.png
docs/screenshots/foundation-office-mobile.png
docs/screenshots/foundation-rehearsal-corner-mobile.png
docs/screenshots/foundation-schools-mobile.png
docs/screenshots/foundation-work-mobile.png
docs/screenshots/foundation-work-wall-mobile.png
docs/slams-foundation-verification.md
docs/verification/foundation-browser.json
docs/verification/foundation-office-browser.json
docs/verification/foundation-performance.json
scripts/verify-foundation.cjs
src/components/foundation/AppShell.tsx
src/components/foundation/AuditionWorkspace.tsx
src/components/foundation/ProgressPage.tsx
src/components/foundation/SchoolPages.tsx
src/components/foundation/SectionTabs.tsx
src/components/foundation/SettingsPage.tsx
src/components/foundation/SupportPage.tsx
src/components/foundation/TrainingSummary.tsx
src/components/foundation/WorkspacePages.tsx
src/components/office/CoachPanel.tsx
src/data/stuck.ts
src/foundation.css
src/lib/foundation.ts
src/lib/office-preferences.ts
src/lib/training.ts
src/routes/conservatory.$school.index.tsx
src/routes/conservatory.$school.units.$kind.$unitId.tsx
src/routes/conservatory.$school.years.$year.tsx
src/routes/conservatory.$school.years.$year_.terms.$term.tsx
src/routes/help.tsx
src/routes/progress.tsx
src/routes/rehearsal.tsx
src/routes/settings.tsx
src/routes/stuck.diagnosis.tsx
src/routes/stuck.index.tsx
src/routes/stuck.intervention.tsx
src/routes/stuck.retry.tsx
src/routes/stuck.saved.tsx
src/routes/work.audition.tsx
src/routes/work.breakdown.tsx
src/routes/work.character.tsx
src/routes/work.index.tsx
src/routes/work.journal.tsx
src/routes/work.self-tape.tsx
src/test/audition-tabs.test.tsx
src/test/progress-foundation.test.tsx
src/test/training-foundation.test.tsx
src/test/unit-summary-refresh.test.tsx
```

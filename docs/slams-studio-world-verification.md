# SLAMS — cinematic Office and connected studio screens

Review branch: `feat/slams-office-world`, stacked on `feat/slams-welcome` (`e07f00f`). This pass implements the supplied Office/Work Wall references and the subsequently requested visual treatment of the existing screens. It does not create a replacement app or merge/deploy anything.

## What changed

- **Director’s Office:** retained reclining Director artwork, eight physical school books on the desk, actual coaching controls, brass navigation signs, manuscript, clapperboard and Passport. The three keyboard/swipe-connected views remain. Preferences, sound opt-in, reduced motion and focus restoration remain functional.
- **Work Wall:** a matching pointing Director, pinned audition/technique/script/Passport objects and real shortcuts into the rehearsal corner, Living Scene, saved reflections and audition preparation. The reference’s nonexistent library/schedule destinations were not invented.
- **Shared studio world:** theatrical room/curtains, illustrated chapter headings, school book identities, paper working surfaces, leather/brass tabs and crimson actions now connect the Conservatory, all eight school entrances, school/year/term/unit pages, rehearsal, Living Scene, work/audition files, Stuck Desk, Passport, progress and support/settings pages.
- **Eight-school library:** large individually selectable original covers; two columns on phones and four on larger screens. A monochrome wear layer preserves the burgundy/cobalt/emerald/black-and-mustard/violet/orange/crimson/teal palette. Existing school slugs, focus text, structures, filters and gates are retained.
- **Truthful account/progress display:** the profile uses the current account’s optional Auth `display_name`, or a neutral account/guest fallback. The Journey strip displays only successfully loaded rehearsal and curriculum counts; unknown values remain unknown. It does not copy the reference’s example name, 27%/47% scores, activity counts, badges or lesson resume. The existing resume component still requires a saved started unit with reviewed, published content.
- **Clear storage copy:** the guest banner names browser-local rehearsal reflections and audition notes, rather than suggesting curriculum progress is saved for guests. Signed-in copy describes account saves without exposing backend implementation details in the product flow.

No curriculum, scene dialogue, grading, authentication implementation, store/import logic, query ownership, database policy, generated integration, dependency or credential changes. The first-visit welcome behavior and existing five-route primary navigation are preserved. Unavailable tools remain visibly in development; the supplied mockups are not treated as evidence of implemented capabilities.

## Artwork and composition

New original illustration masters and their WebP exports:

| Asset                          | Master                                        |  Runtime size |
| ------------------------------ | --------------------------------------------- | ------------: |
| Pointing Director              | `design/office-source/director-work-wall.png` | 390,408 bytes |
| Reading/annotating Director    | `design/office-source/director-reading.png`   | 548,528 bytes |
| Total new runtime illustration |                                               | 938,936 bytes |

Reused: the approved reclining/portrait Director, office room, desk, aged paper, expression atlas, eight original book covers/motifs, wordmark and existing fonts. New chapter headings reuse the same reading character across schools with each school’s actual cover identity; eight independently illustrated school-specific character poses have **not** been created. The full-body Office pose remains consistent; existing expression close-ups and factual saved-record reactions remain in coaching controls. No claim of performance analysis is made.

All titles, forms, progress values, books and actions are real HTML/components over separate illustrations. Secondary room modules remain lazy. Pointing/reading images are requested only in their relevant mounted views/pages. There is no flattened UI image, video simulation, 3D engine or added animation library.

## Verification

| Check                                           | Result                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm test`                                      | **128 passed**, 18 files, no skipped tests                                                                     |
| `npm exec tsc -- --noEmit`                      | Passed                                                                                                         |
| ESLint on 20 changed TS/TSX/CJS files           | Passed, no errors or warnings                                                                                  |
| Clean production build after removing `.output` | Passed: client, SSR and Cloudflare/Nitro output                                                                |
| Full `npm run lint`                             | **664 pre-existing formatting errors, 6 React Refresh warnings**; remains red                                  |
| `git diff --check`                              | Passed                                                                                                         |
| Compiled-worker browser acceptance              | **948 passed**: 449 studio-world, 115 Office/rehearsal, 237 foundation, 147 welcome; zero uncaught page errors |

Two added automated regression cases verify loaded-zero versus unknown Journey counts and rejection of stale rehearsal counts after a failed load. Existing import failure/partial/retry, identity isolation, training and scripted-scene tests all passed.

The browser scripts exercise Office objects and labels, book selection, focus restoration, swipes, reduced motion, actual scripted scene branches, local Passport/audition persistence, welcome/auth validation, first/returning entry, all page/tab contracts, unsaved audition drafts, and the shared navigation. The new `scripts/verify-studio-world.cjs` additionally checks object-center obstruction at 320/360/390/412/768/1440px, twelve working route families at 320/390/768/1440px, all eight school identities/covers, enlarged text and reduced motion. It waits for real session/local-record hydration before asserting guest values.

The additional geometry checks exposed a tablet Rehearsal Corner overlap: the stage entrance covered the Baseline mirror. Its desktop/tablet entrance now sits below the mirror. Narrow-screen props and labels were also separated from the book collection. No forced clicks or disabled assertions were used to hide these failures.

Browser checks run in isolated signed-out contexts against the actual compiled localhost worker, not mocked screenshots. No live signup, confirmation email, authenticated cloud save or deployed RLS test was performed. Separately installed Playwright/system Chromium and external Wrangler are used; no app dependencies were added.

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-studio-world \
node scripts/verify-studio-world.cjs
```

The existing preview mismatch remains: TanStack preview expects `dist/server/server.js`, while Nitro emits `.output/server/index.mjs`. Compiled acceptance uses external Wrangler 4.156.0 with a **local-only** `2026-10-30` compatibility override, because the installed workerd predates the generated `2026-11-01` date. It uses fallback local `Request.cf` metadata when the metadata fetch is blocked. Nonfatal path-resolution/bundler-option build advisories remain. This is not deployment or intended-date production-host verification.

## Review artifacts

Final compiled screenshots and machine evidence are saved alongside this report before branch publication. Full-page screenshots show scrollable content; the fixed navigation appears at the captured viewport’s bottom rather than the document’s bottom.

- [Office, phone](screenshots/studio-world-desk-mobile.png) · [desktop](screenshots/studio-world-desk-desktop.png)
- [Work Wall, phone](screenshots/studio-world-wall-mobile.png) · [desktop](screenshots/studio-world-wall-desktop.png) · [Rehearsal Corner](screenshots/studio-world-corner-mobile.png)
- [Conservatory, phone](screenshots/studio-world-conservatory-mobile.png) · [desktop](screenshots/studio-world-conservatory-desktop.png) · [Meisner school](screenshots/studio-world-school-mobile.png) · [term](screenshots/studio-world-term-mobile.png)
- [Rehearsal Studio](screenshots/studio-world-rehearsal-mobile.png) · [Living Scene](screenshots/studio-world-scene-mobile.png)
- [Actor at Work](screenshots/studio-world-work-mobile.png) · [audition preparation](screenshots/studio-world-audition-mobile.png) · [Stuck Desk](screenshots/studio-world-stuck-mobile.png)
- [Passport](screenshots/studio-world-passport-mobile.png) · [progress](screenshots/studio-world-progress-mobile.png) · [Matrix availability](screenshots/studio-world-matrix-mobile.png) · [settings](screenshots/studio-world-settings-mobile.png)

Machine evidence: [449 studio-world checks](verification/studio-world-browser.json), [115 Office checks](verification/studio-world-office-browser.json), [237 foundation checks](verification/studio-world-foundation-browser.json), [147 welcome checks](verification/studio-world-welcome-browser.json). Complete [test](verification/studio-world-tests.txt), [build](verification/studio-world-build.txt) and [remaining lint diagnostics](verification/studio-world-lint.txt) are retained.

One [final synthetic mobile performance sample](verification/studio-world-performance.json) used Chromium 390×844 at 2× density, 4× CPU slowdown, 80ms latency and 750KB/s download. First contentful paint was **816ms**, and load was **2,990ms**. Five initial WebPs totaled **1,725,100 bytes**. The desktop Director, secondary Work Wall character and reading character were not requested on the initial phone Office. This is one local sample, not a physical Android result, LCP measurement or production performance guarantee; the illustration budget remains a device/network review item.

## Files and routes

Added `StudioHeading`, `OfficeDirector`, `OfficeJourney`, `office-cinematic.css`, `studio-world.css`, the two illustrated masters/exports, the studio-world browser script and this report/evidence. Updated the shared `Page`/action classes, profile identity presentation, existing section tabs, Office/Work Wall/directory/coaching composition, school/work/support/progress screens, root artwork preloads, Passport/scene presentation props and Office regression cases. No new route or data schema was needed.

Connected destinations remain `/conservatory` and its eight existing school/year/term/unit families; `/rehearsal`, `/scene`, `/work`, `/work/audition`, `/stuck`, `/passport`, `/progress`, `/matrix`, `/baseline`, `/lab`, `/lounge`, `/director`, `/settings` and existing support/workflow links. The supplied example lesson names and progress states are not seeded into any route.

## Remaining release requirements

1. **Live backend verification:** confirmed email signup/recovery/callback allowlists, two independent confirmed accounts, cross-account denial under deployed RLS, cloud imports/persistence, published curriculum gates and authenticated progress/resume still require backend access and authorized test accounts. Unit mocks and guest-browser tests are not substitutes.
2. **Content and unfinished systems:** reviewed curriculum, school-completion rules, skill/competence assessment, media recording/playback, coach voice, real-time partners, project libraries/schedules and other disclosed tools remain separate implementation work. No fake controls or fabricated results were added. Arabic/RTL, social-provider setup, cloud actor-profile sync and approved legal-policy URLs remain the earlier welcome-flow requirements.
3. **Physical/device/hosting checks:** actual Android hardware, TalkBack, device text scaling, landscape, intermittent networks, production rendering and intended-date runtime compatibility remain unverified. Synthetic Chromium measurements are not device or production guarantees. Illustration/brand/delivery-rights review and optional individual school character poses remain creative follow-ups.
4. **Engineering baseline:** repository-wide lint and the preview/runtime limitations above remain. Account-deletion orphan cleanup belongs to the separate, tested but unapplied Sprint 01B engineering proposal; this visual branch contains no SQL and applies no destructive live changes.
5. **Delivery:** a pushed review branch is distinct from an opened PR. GitHub API access is blocked by the current environment network policy; the final delivery message reports the actual PR attempt separately. No automatic merge or deployment.

Earlier reports: [welcome](slams-welcome-verification.md), [foundation](slams-foundation-verification.md), [Office](directors-office-reference-verification.md), [Sprint 01B stabilization](sprint-01b-stabilization.md).

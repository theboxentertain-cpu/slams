# Conservatory, Baseline and lesson design verification

The workspace reconnected on November 3 and the pending reference-image pass was resumed from refreshed main `aa06ca673efa745498504ee2b35e06de15184205`, on `feat/conservatory-baseline-design`. Main already contains the earlier premium visuals, first-rehearsal flow, Meisner editorial pilot and academic safeguards. This branch preserves those changes and does not stack an unmerged implementation.

The Conservatory now uses eight distinct illustrated school cards, scenic school headings, parchment metadata and red/brass actions. Baseline has the pointing Director scene and a shared optional introduction for studio/welcome entry, with actual saved self-description when present. Reviewed unit pages use an open reading sheet and real activity panel; the existing Meisner editorial workshop gets readable lesson blocks and a collapsible draft-term inventory.

The references’ example scores, verdicts, recommendations, video controls, AI partners and completion percentages were not added. The simplified first-rehearsal entry remains. Editorial practice remains session-only, pending teacher review and non-credit. No authored training data, database, identity, storage, dependency or backend implementation was changed.

## Before and after

These are actual compiled Chromium captures, converted to WebP without resizing or layout edits. Full-page captures retain the fixed studio bar at the viewport bottom; the page scrolls beneath it.

| Page                          | Latest main before                                                                  | This branch after                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Conservatory, phone           | [Before](verification/training-design/screenshots/before-schools-390.webp)          | [After](verification/training-design/screenshots/after-schools-390.webp)          |
| Conservatory, desktop         | [Before](verification/training-design/screenshots/before-schools-1440.webp)         | [After](verification/training-design/screenshots/after-schools-1440.webp)         |
| Meisner school, phone         | [Before](verification/training-design/screenshots/before-school-390.webp)           | [After](verification/training-design/screenshots/after-school-390.webp)           |
| Meisner term/lessons, desktop | [Before](verification/training-design/screenshots/before-term-1440.webp)            | [After](verification/training-design/screenshots/after-term-1440.webp)            |
| Baseline, phone               | [Before](verification/training-design/screenshots/before-baseline-390.webp)         | [After](verification/training-design/screenshots/after-baseline-390.webp)         |
| Welcome Baseline, phone       | [Before](verification/training-design/screenshots/before-welcome-baseline-390.webp) | [After](verification/training-design/screenshots/after-welcome-baseline-390.webp) |

An additional [legacy self-report fixture](verification/training-design/screenshots/baseline-legacy-self-report-fixture-390.webp) demonstrates the saved-data state. It is explicitly injected browser-test data, not the owner’s identity, a generated assessment or production seed.

## Verification results

| Check                                    | Result                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Full test suite                          | **213 passed**, 28 files                                                                                  |
| TypeScript                               | Passed                                                                                                    |
| Changed/new TS/TSX/CJS ESLint            | **17 files passed**                                                                                       |
| Clean production build                   | Passed: client, SSR and Cloudflare/Nitro output                                                           |
| Compiled browser acceptance              | **589 checks passed**, zero uncaught browser errors                                                       |
| Whitespace / protected functional source | Clean; no changes in `src/lib`, `src/data`, `src/integrations`, database directories or package manifests |
| Full repository lint                     | **895 pre-existing formatting errors, 6 warnings** remain; starting main had 1,137 errors and 6 warnings  |

The **399 new training checks** cover all eight school identities, correct distinct atlas cells, real filters/routes, scenic headings and 320/360/390/412/768/1440px reflow; the same five-destination navigation; loading/empty/legacy Baseline data; optional welcome entry; Director ON/QUIET/OFF, note placement, enlarged text and reduced motion; authored lessons and written classification; solo preparation versus the human-partner path and its participation conditions; private reflection/notes; silent Living Scene takes; and existing library focus restoration. There were no hydration errors, signup/recovery attempts or cloud record/progress writes.

The existing Office suite passed **115 checks**, including actual scripted rehearsal branches, local Passport/audition persistence, route mappings, keyboard/swipe navigation and dialog focus. The existing PR B suite passed **75 checks**, preserving the recently merged first-rehearsal entry and simplified optional settings flow.

The new Baseline/unit tests cover factual self-report states, failure/loading suppression, publication gates, account/activity states, started-only progress, legacy unassessed completion and confirmed-save invalidations. They do not seed reviewed curriculum or award credit.

Fresh main had one suite that could not load and TypeScript errors in two test files. The repairs remove a duplicate deferred-save helper, type the Meisner answer/navigation fixtures as readonly tuples, and disambiguate an existing disclosure query. All assertions and application behavior are retained. Before those repairs, main reported 189 passing tests with one failed suite; the final suite includes all existing tests plus 13 new presentation/data-fidelity cases.

Evidence: [baseline tests](verification/training-design/baseline-tests.txt), [baseline types](verification/training-design/baseline-types.txt), [baseline lint](verification/training-design/baseline-lint.txt), [final tests](verification/training-design/tests.txt), [types](verification/training-design/types.txt), [changed-file lint](verification/training-design/changed-lint.txt), [full lint](verification/training-design/lint.txt), [build](verification/training-design/build.txt), [399 training checks](verification/training-design/training-browser.json), [115 Office checks](verification/training-design/office-browser.json), [75 first-use checks](verification/training-design/pr-b-browser.json).

## Boundaries and reproduction

`npm run build` produced the clean application output. Local browser acceptance used external Wrangler 4.156.0 with a **local-only** `2026-10-30` compatibility override because installed workerd predates the generated date. No production runtime setting was changed. The existing `vite preview` path mismatch remains outside this visual pass.

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-training-design \
node scripts/verify-training-design.cjs
```

Browser checks use isolated guests and Chromium 154.0.8037.57. They do not establish physical Android/TalkBack, OS text scaling, deployed RLS, authenticated cloud persistence, production performance or qualified teaching review. Server curriculum availability was not fabricated; reviewed-unit rendering/activity gates are tested with explicit unit fixtures, while browser practice uses the actual editorial preview already present on main.

See [art specifications and CSS ownership](product/SLAMS-TRAINING-ART-DIRECTION.md). The original 47-page audit and academic release gates remain in force. No automatic merge, deployment or database mutation is authorized by this report.

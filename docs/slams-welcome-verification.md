# SLAMS cinematic welcome journey — implementation and verification

Verified on 2026-11-01. Review branch: `feat/slams-welcome`, based on `feat/slams-foundation` (`66d1ee7`). This is a stacked welcome-flow change; it does not merge, deploy, change credentials or apply database migrations.

## Implemented behavior

The five supplied references now have working, responsive screens with the existing SLAMS branding, a consistent reclining Director, warm paper/chalkboard surfaces, crimson actions and the original office environment. Text, forms, navigation and all eight school books remain accessible HTML components over separate illustration layers.

| Screen                | Route and behavior                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Studio welcome        | `/` for first-time signed-out visitors; also `/welcome`. Eight-book collection opens the existing accessible school selector. Feature links lead to real sections.                                                         |
| Account choice        | `/welcome/account`. Existing email sign-in/signup, guest setup, account-benefits disclosure and an Office skip link.                                                                                                       |
| Account form          | `/auth?mode=signup&flow=welcome` or `mode=signin`. Existing Supabase SDK methods and confirmation/recovery redirects, with optional name, password confirmation, accessible visibility controls and pending-email notices. |
| Actor setup           | `/welcome/setup`. Optional self-reported experience and goals, English availability, working reduced-motion and Office-sound preferences.                                                                                  |
| Baseline introduction | `/baseline?flow=welcome&tab=prepare`. Clearly identifies the unfinished assessment and leads to the actual text-only Living Scene at `/scene`, the schools, audition preparation or the Office.                            |

Returning visitors retain the Director’s Office. The non-sensitive `slams_studio_entered=1` cookie remembers entry for one year; the root loader uses it for server rendering. Existing signed-in users also retain the Office. The browser recognizes the presence of legacy Passport, audition, Director and Office-preference keys without parsing or changing their records. On a legacy device without the new cookie, recognition happens after hydration. With cookies blocked, entry still works in the current tab. This preference never establishes identity or grants access.

Direct links remain available. Entering a normal studio route remembers entry, and the five-item studio navigation returns outside the welcome journey. Profile → **Welcome & actor setup** can replay the flow. The shared skip link and measured navigation clearance remain functional.

## Data and authentication boundaries

- `SessionProvider` remains the sole identity owner. Existing sign-out/query cancellation, cloud persistence, local imports, all eight curricula and Living Scene scripts are unchanged.
- Setup uses the versioned `slams.actor-setup.v1.<owner>` device-local namespace, derived from the current session ID or `guest`. It waits for identity readiness, hides another owner’s values during transitions, preserves drafts across same-identity refreshes, validates saved data and reports storage failures without deleting a prior saved copy. These preferences are not cloud profile synchronization or evidence of acting ability.
- The optional name is sent as `display_name` in existing Auth signup metadata. No profile table, RLS policy or generated integration is changed. Sign-in, signup and recovery still use the existing SDK and redirect targets. Pending email confirmation does not fabricate a session.
- Search parsing bounds the welcome destination while retaining SDK callback parameters. Password mismatch is rejected before any signup request. Inputs/actions disable while requests are pending, and abandoned requests cannot navigate after the form unmounts.
- The original Passport and audition keys are untouched by setup. Guest-to-cloud import behavior and its existing regression suite remain intact.

## Artwork and reference decisions

New original illustration masters are retained in `design/welcome-source/`; runtime WebPs are in `src/assets/welcome/`. The portrait was generated as a continuity edit of the same reclining character, using the supplied visual references.

| Runtime artwork           |            Size |
| ------------------------- | --------------: |
| `director-reclining.webp` |   427,262 bytes |
| `director-portrait.webp`  |   511,804 bytes |
| `chalkboard.webp`         |   351,008 bytes |
| Total new runtime artwork | 1,290,074 bytes |

The mobile/desktop character uses a responsive picture source. The root preloads the room and the appropriate character for the entry state and viewport. The landing screen does not load the chalkboard. Existing room artwork, paper texture, eight book covers, vector motifs, fonts and wordmark are reused. No additional dependency or flattened UI screenshot was introduced.

Reference capabilities that do not exist are disclosed rather than simulated: Google/Apple sign-in, Arabic/RTL, recording, recording captions, coach voice and guided baseline assessment. The available sound setting controls existing Office sounds; it is not coach audio. No skill score, training recommendation or curriculum content is invented. Approved Terms/Privacy copy and URLs were not supplied or found, so fake legal links and a nonfunctional consent checkbox were not added.

Final compiled-worker screenshots:

- [Welcome, mobile](screenshots/welcome-landing-mobile.png) · [desktop](screenshots/welcome-landing-desktop.png)
- [Account choice](screenshots/welcome-account-mobile.png)
- [Signup](screenshots/welcome-signup-mobile.png)
- [Actor setup](screenshots/welcome-setup-mobile.png)
- [Baseline introduction](screenshots/welcome-baseline-mobile.png)

## Executed checks

| Check                                                           | Result                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm test`                                                      | **126 passed**, 18 files, no skipped tests                                                 |
| `npm exec tsc -- --noEmit`                                      | Passed                                                                                     |
| ESLint on changed source/test/script files                      | Passed, no warnings or errors                                                              |
| `git diff --check`                                              | Passed                                                                                     |
| Clean `npm run build` after removing `.output`                  | Passed: client, SSR and Cloudflare/Nitro output                                            |
| Full `npm run lint`                                             | **664 existing Prettier errors and 6 React Refresh warnings**; repository lint remains red |
| Actual Chromium against compiled local worker: welcome          | **147 checks passed**, no uncaught page errors                                             |
| Actual Chromium against compiled local worker: Office/rehearsal | **115 checks passed**, no uncaught page errors                                             |
| Actual Chromium against compiled local worker: foundation       | **237 checks passed**, no uncaught page errors                                             |

The 11 added automated cases cover account/guest setup isolation, identity refresh and transitions, storage failures, malformed data, the entry cookie, password mismatch, signup metadata/confirmation behavior, recovery, password visibility and bounded callback search. Existing import, session-isolation, progression and scripted-scene regression cases also passed.

The **499 browser checks** exercise fresh entry, returning/legacy entry, unblocked deep links, the school dialog and restored focus, actual auth-form validation without sending an email, setup persistence, reduced motion, all five welcome screens at 320/360/390/412/768/1440px, enlarged text, no horizontal overflow, 44px targets and character/masthead clearance. Returning-user suites explicitly set the entry cookie; fresh-user behavior is tested independently. Existing scripted rehearsal branches, quiet coaching during takes, Passport and audition save/reload, route hierarchy, tabs and shared navigation passed again.

Machine evidence: [welcome](verification/welcome-browser.json), [Office](verification/welcome-office-browser.json), [foundation](verification/welcome-foundation-browser.json). Browser scripts are `scripts/verify-welcome.cjs`, `scripts/verify-office.cjs` and `scripts/verify-foundation.cjs`; separately installed Playwright and system Chromium are required:

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-welcome-verification \
node scripts/verify-welcome.cjs
```

One [synthetic performance sample](verification/welcome-performance.json), Chromium 390×844 at 2× density, 4× CPU slowdown, 80ms latency and 750KB/s download, measured first contentful paint at **532ms** and load at **2,103ms**. The initial three WebPs totaled **1,050,704 bytes**; neither the desktop Director nor the chalkboard was requested. This is not a physical Android measurement or a production guarantee.

The existing `npm run preview` integration still expects `dist/server/server.js` while Nitro emits `.output/server/index.mjs`. Compiled-browser checks instead used external Wrangler 4.156.0 on localhost:3101, with a **local-only** `2026-10-30` compatibility override because installed workerd predates the generated `2026-11-01` date. Blocked metadata access used fallback local `Request.cf` data. Existing path-resolution and bundler-option build advisories remain nonfatal. This verifies the local compiled output, not deployment or the intended production compatibility date.

## Files changed

- Added `components/welcome/WelcomeFrame`, `WelcomePages`, `AccountForm`, `welcome.css`, the three artwork masters and their runtime WebPs.
- Added the `/welcome` route group, `lib/actor-setup`, `lib/studio-entry`, its public cookie-reading server function and bounded `lib/welcome-auth` search parsing.
- Updated the root entry, auth wrapper, baseline welcome variant, `AppShell`, generated route tree and stylesheet import. The existing auth form was extracted into the shared component, not replaced by a demo.
- Added three automated-test files and the welcome browser script; updated existing browser scripts for returning-user entry and the replay menu item.
- Added this report, six screenshots and four machine-evidence files. No dependency manifests, credentials, database migrations, curriculum, stores or SessionProvider changes.

## Remaining release requirements

1. **Live backend:** email signup/confirmation/recovery and callback allowlists, independent confirmed two-account isolation, deployed RLS, cloud imports/persistence, published curriculum gates and authenticated progress still require authorized backend access and real test accounts. Browser tests used isolated guests; SDK unit mocks do not prove live behavior.
2. **Unfinished capabilities:** social provider configuration, cloud actor-profile synchronization, Arabic/RTL, media/coach audio, the guided baseline assessment and other gated tools require separate implementation. No enabled fake controls were added. Approved legal policy text/URLs and final illustration rights/brand review remain product inputs.
3. **Device/accessibility:** physical Android, TalkBack, device text scaling, landscape, intermittent networks and production-host rendering still need verification. Chromium emulation and reduced-motion checks do not replace these.
4. **Engineering baseline:** full-repository lint and the existing preview/runtime issues above remain. The account-deletion orphan issue and safe, unapplied proposal remain documented in the separate Sprint 01B engineering work; this welcome branch does not alter deletion policy.
5. **Delivery:** no merge, deployment or live destructive database action was performed. GitHub API access is restricted in this environment; pushed branch and PR status must be reported separately.

Earlier evidence: [foundation report](slams-foundation-verification.md), [Office report](directors-office-reference-verification.md), [Sprint 01B stabilization](sprint-01b-stabilization.md). The welcome report supersedes earlier test counts for this branch only.

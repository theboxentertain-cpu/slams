# SLAMS premium art and page presentation

Implemented the user’s November 2 request against main `844d7632e59b55015f755db16ca0cfdb556bca5f`. Reference image 1 guides the warmer, more naturalistic illustrated Director; the other references guide parchment actions, brass framing, tactile books, theatrical darkness and burgundy navigation. Original source artwork is retained. No database, identity, storage, curriculum or scene-content implementation was changed.

The Office now presents the new Director/mug illustration, a real next-rehearsal or eligible training-resume card, four task entrances, eight-book library, factual journey counts and contextual supporting tools. Work Wall and Rehearsal Corner keep their mapped controls. Welcome/account/setup and the existing school, rehearsal, Work, Stuck Desk, Passport and support pages inherit the shared visual treatment. The five primary destinations remain unchanged.

Example names, percentages, levels and lesson names from the references were not copied into user data. School structures remain provisional and content availability stays explicit. This change does not close the outstanding 47-page product contracts.

## Screenshots

Actual Chromium captures, converted to WebP without resizing or layout edits. Full-page images capture fixed navigation at the viewport bottom; the content is scrollable beneath it.

| Page            | Before                                                                  | After                                                                  |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Office, phone   | [Latest main](verification/premium/screenshots/before-office-390.webp)  | [New Office](verification/premium/screenshots/after-office-390.webp)   |
| Office, desktop | [Latest main](verification/premium/screenshots/before-office-1440.webp) | [New Office](verification/premium/screenshots/after-office-1440.webp)  |
| Welcome, phone  | [Latest main](verification/premium/screenshots/before-welcome-390.webp) | [New welcome](verification/premium/screenshots/after-welcome-390.webp) |

Additional compiled captures: [account choice](verification/premium/screenshots/after-account-390.webp), [school](verification/premium/screenshots/after-school-390.webp), [rehearsal](verification/premium/screenshots/after-rehearsal-390.webp), [Work](verification/premium/screenshots/after-work-390.webp), [Passport](verification/premium/screenshots/after-passport-390.webp), [opened Director note](verification/premium/screenshots/after-coach-on-mobile.webp).

## Verification

| Check                              | Result                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Full unit suite                    | **178 passed**, 21 files                                                                           |
| TypeScript                         | Passed                                                                                             |
| ESLint on changed TS/TSX/CJS files | Passed, no diagnostics                                                                             |
| Clean production build             | Passed, client/SSR/Cloudflare output                                                               |
| Compiled Chromium checks           | **737 passed**, no uncaught page errors                                                            |
| Full repository lint               | Same as starting main: **682 formatting errors, 6 warnings**                                       |
| Functional source preservation     | No changes in `src/lib`, `src/data`, `src/integrations`, database directories or package manifests |

The compiled browser suites cover:

- **413 shared-world checks:** all three Office views at 320/360/390/412/768/1440px; unobstructed scene controls; twelve existing page families at 320/390/768/1440px; eight school identities/covers; enlarged text and reduced motion.
- **115 Office checks:** real route mappings, profile/sign-in flow, room restoration, keyboard navigation, eight-school modal focus restoration, swipe suppression, motion/sound preferences, all nine scripted rehearsal branches, local Passport and audition persistence.
- **147 welcome checks:** first/returning entry, actual account choice, password validation without signup requests, local guest setup, Baseline introduction, existing-record preservation, direct rehearsal links and responsive controls.
- **62 premium checks:** actual artwork delivery, atlas geometry, real task-card routes, factual next action, provisional library metadata, ON/QUIET/OFF and silent-take behavior, note placement, 200% root text, eight page-family screenshots and no hydration errors.

Eight new unit cases verify that the Office card resumes only a real eligible started unit and handles guests, missing/completed/unavailable work, loading and catalog failure without fabricated progress. The lazy-room regression now waits up to five seconds for its real dynamic import instead of relying on a one-second full-suite timing assumption.

The responsive checks exposed an unframed Work Wall help link after retiring the old styles; it now has its own readable parchment layout. Object hit tests center controls before measuring obstruction because nearest-edge scrolling can leave a fully in-viewport control beneath fixed navigation. No forced clicks or removed assertions were used.

Evidence: [tests](verification/premium/tests.txt), [types](verification/premium/types.txt), [changed-file lint](verification/premium/changed-lint.txt), [build](verification/premium/build.txt), [baseline lint](verification/premium/baseline-lint.txt), [current lint](verification/premium/lint.txt); browser reports for [shared world](verification/premium/studio-world-browser.json), [Office](verification/premium/office-browser.json), [welcome](verification/premium/welcome-browser.json) and [premium presentation](verification/premium/premium-browser.json).

## Reproduction and limits

Build with `npm run build`. Compiled acceptance used external Wrangler 4.156.0 against `.output/server/wrangler.json`, with a **local-only** `2026-10-30` compatibility override to match the installed workerd. The generated application date remains `2026-11-02`. No deployment or runtime-configuration change was made. The existing `vite preview` path mismatch remains outside this visual change.

Run each browser script with the separately installed Playwright module, system Chromium and `SLAMS_BASE_URL` pointing at the compiled local server:

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-premium \
node scripts/verify-premium.cjs
```

The other suites are `verify-office.cjs`, `verify-welcome.cjs` and `verify-studio-world.cjs`. No app dependency was added. Browser contexts were isolated guests; live account creation, email, authenticated cloud writes, deployed RLS, physical Android/TalkBack and production performance were not verified. Existing unavailable curriculum/tools remain disclosed.

Artwork specifications and CSS ownership are recorded in [premium art direction](product/SLAMS-PREMIUM-ART-DIRECTION.md). This branch is for review and must not be automatically merged or deployed.

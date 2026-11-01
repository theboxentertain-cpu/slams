# Director's Office — supplied-reference revision

November 1, 2026. Review branch: `feat/directors-office`. This revision follows the supplied portrait composition and the user's approval to match it closely. It builds on the [initial implementation and audit](directors-office-implementation.md); the earlier report's artwork sizes and performance figures describe that earlier version.

## Result and scope

The home now uses the reference's large ivory/crimson wordmark, warm theater loft, seated Director, black glasses and red pencil, signature mug, Wall of Bad Acting, rehearsal sign, parchment Conservatory plaque, eight upright books and six paper shortcut controls. The bottom navigation follows the reference and works with the existing three office views. The theatrical picture remains a layered scene with independently accessible controls, rather than a flattened navigation screenshot.

The Director and room artwork were generated using the supplied image as a visual reference. A matching seven-expression/full-body atlas was generated from the new character master. Original generated PNGs are retained for editing; the earlier office artwork and original `studio-bg.jpg` are retained. No existing artwork was discarded. The book covers retain their eight distinct colors and original SVG motifs, with live type, covers, spines, pages and opened interaction states.

Progress opens a genuine saved-record summary rather than an invented route or completion percentage. It distinguishes browser-local rehearsals from account milestones and displays an em dash when a count cannot be verified. The bell opens this summary; its red marker appears only for an actual Passport read error. The account icon opens the existing auth/account page. Editorial topics on the Wall of Bad Acting come from the supplied reference; they are not new curriculum or judgments of a user's performance.

Horizontal swipes can begin on the physical navigation objects without activating their links. Ordinary taps and keyboard activation retain native behavior. Both dialogs restore focus to their particular opener, including the bottom navigation. Device reduced motion, user motion/sound preferences, existing Director modes, real count-based expressions, and last-view restoration remain supported.

No curriculum, scene dialogue, routes, database schema, storage/import behavior, SessionProvider, Supabase credentials, generated integrations, package manifest or lockfile changed in this revision. Shared character notes use the matching expression atlas and retain the existing silence-during-takes behavior. In-development destinations remain clearly labeled.

## Source and runtime assets

| Retained source in `design/office-source/` | Runtime in `src/assets/office/` | Runtime bytes |
| ------------------------------------------ | ------------------------------- | ------------: |
| `director-reference.png`                   | `director-reference.webp`       |       392,390 |
| `director-reference-atlas.png`             | `director-reference-atlas.webp` |       511,416 |
| `office-reference.png`                     | `office-reference.webp`         |       272,784 |
| `desk-reference.png`                       | `desk-reference.webp`           |       323,388 |
| `aged-paper.png`                           | `aged-paper.webp`               |       266,116 |

The five images total 1,766,094 bytes. Only the room and seated hero are explicitly preloaded (665,174 bytes). The desk and nine-sliced paper are separate reusable assets; editing PNGs are excluded from application imports. Secondary office views remain lazy-loaded. A local 51,220-byte Caveat font supplies the reference's handwritten signs; its OFL license is included at `src/assets/office/fonts/Caveat-OFL.txt`. This adds no external font request or production dependency.

The book illustrations and prop vectors are implemented artwork, not claims of hand-painted image-generation outputs. Separate painted open-book/page-turn sequences, additional full-body poses, voice recordings and app-store exports were not produced; the current functional book states use CSS/SVG. Physical-device art/performance approval remains a release gate.

## Files and connections

Added `BadActingWall.tsx`, `OfficeDirectory.tsx` and `OfficeProgress.tsx`; updated the office controller, character renderer, book collection, home preloads, test file and optional browser regression. `src/office-reference.css`, imported after the existing office stylesheet, contains the scoped reference composition and responsive states. Asset masters, optimized WebPs and the licensed local font are included.

| Control                                              | Actual destination or behavior                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Director                                             | `/director`                                                                 |
| Clapperboard / rehearsal sign / Rehearsal navigation | `/scene`                                                                    |
| Annotated script / bad-acting wall / Stuck Desk      | `/stuck`                                                                    |
| Book collection / Conservatory navigation            | Accessible eight-book dialog; `/conservatory` and each original school slug |
| Actor at Work / casting board                        | `/work`                                                                     |
| Technique Matrix / diagram board                     | `/matrix`                                                                   |
| Passport / portfolio                                 | `/passport`                                                                 |
| Performance Lab / camera                             | `/lab`                                                                      |
| Mirror / empty chair                                 | `/baseline` / `/lounge`                                                     |
| Progress shortcuts / bell                            | Verified counts dialog with real Passport, Conservatory and auth links      |
| Account icon                                         | `/auth`                                                                     |
| Office / three view tabs / swipes                    | Existing home and the desk, work wall and rehearsal corner                  |

All eight original slugs remain: Stanislavski, Meisner, Adler, Practical Aesthetics, Chekhov, Laban, Strasberg and Viewpoints. Term gates, reviewed curriculum loaders, assessment behavior and progress persistence are unchanged.

## Executed verification

- `npm test`: **101 tests passed across 11 files**, no skipped tests. Six new cases cover real/unknown/error progress counts, account navigation, bottom-nav dialog focus and motion preferences.
- `npm exec tsc -- --noEmit`: passed.
- ESLint on changed TS/TSX/CJS files: passed without warnings or errors. `git diff --check`: passed.
- `npm run build`: passed for client, SSR and Cloudflare/Nitro output. Existing path-resolution and bundler-option advisories remain nonfatal.
- Full `npm run lint`: **788 existing formatting errors and 7 warnings** in unchanged files. No rule suppression or broad formatting rewrite was used.
- Actual Chromium against the development server: **92 checks passed, zero uncaught page errors**.
- Actual Chromium against the compiled local Cloudflare worker: **92 checks passed, zero uncaught page errors**, with the local runtime caveats below.

Final screenshots: [portrait office](screenshots/directors-office-reference-mobile.png) and [desktop office](screenshots/directors-office-reference-desktop.png). Additional book, work-wall, rehearsal-corner and character screenshots plus `browser-results.json` were generated at `/workspace/slams-office-verification/reference-production`.

A single lab sample of this revised build used a 390×844 Chromium viewport at 2× density, 4× CPU slowdown, 80ms latency and 750KB/s download. First contentful paint was 648ms and load was 2,312ms. Over 90 view-transition frames, the median interval was 16.7ms, the 95th percentile 33.3ms, and one interval exceeded 50ms. These are synthetic local measurements, not physical Android results or a production performance guarantee. The four initially requested WebP images totaled 1,254,678 bytes; the expression atlas was not downloaded on the initial desk view.

The browser regression checks 320/360/390/412/768/1440px layouts, horizontal overflow and 44px scene/header/tab/navigation targets; all real object routes; the eight school links; keyboard/Escape/focus restoration; motion/sound preferences; swipes without unintended navigation; the actual auth form; all nine scripted rehearsal combinations and silence during takes; a real local rehearsal save/Passport reload; and actual audition-preparation save/reload. The new Progress checks verify both the initial zero and a saved rehearsal after reload. It uses isolated signed-out contexts and never writes to a live account.

Browser command (optional, separately installed Playwright and system Chromium):

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-office-verification \
node scripts/verify-office.cjs
```

## Remaining release blockers

1. Full repository lint remains red with the existing diagnostics above.
2. Live Supabase email confirmation/recovery, two independent confirmed accounts, deployed RLS, cloud import/persistence, published-school loaders/gates and authenticated milestone counts still require backend access and appropriate test users. Unit mocks and signed-out browser tests do not verify these services. No credentials or live database were changed.
3. Physical Android, TalkBack, text scaling, landscape and intermittent-network checks remain. Chromium emulation is not a physical device test. Review contrast, illustration consistency and delivery rights before release.
4. The existing `npm run preview` output mismatch remains: TanStack expects `dist/server/server.js`, while Nitro emits `.output/server/index.mjs`. Local compiled-worker verification uses external Wrangler and the **local-only** compatibility override `2026-10-30`; the installed workerd does not support Nitro's generated `2026-11-01` date. It also uses fallback local `Request.cf` metadata because the metadata fetch is blocked. No deployment or intended-date hosting verification is claimed.
5. GitHub API access is blocked by the active network policy. A pushed review branch does not mean a pull request has been created or merged.
6. Baseline, Performance Lab, Technique Matrix and Rehearsal Lounge retain their existing in-development status. Actual authored content and unfinished tools require their own implementation work.

Account-deletion orphan retention identified in the Sprint 01B audit remains a separate engineering issue; the office UI does not silently change deletion policy or apply a destructive migration.

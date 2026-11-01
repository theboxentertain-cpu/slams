# The Director's Office — implementation and verification

The later [supplied-reference revision and current verification](directors-office-reference-verification.md) updates the character, scene artwork, navigation and test results. Sizes and performance numbers below describe the initial version.

Implemented on `feat/directors-office`, based on main `34bfc86`. This upgrades the existing TanStack/Lovable application; it does not introduce a second application, new route hierarchy, assessment system or backend.

## Audit baseline

The original home was a studio photograph/illustration under stacked navigation cards. Shared UI lived in `src/components/slams.tsx`; all required destinations already had file routes. `/director` and several studio systems were explicitly in-development stubs. The original room illustration existed at `src/assets/studio-bg.jpg`; no character master or expression artwork was present. The old favicon depicted Lovable's mark.

Existing functionality: the eight-school/36-term provisional structure; reviewed public curriculum reads and gated progress; the nine fixed tactic/intervention combinations in Living Scene; authenticated Passport/audition persistence with confirmed imports; signed-out browser storage; SessionProvider identity isolation; sign-in, signup and recovery routes. All of these are retained. The baseline was 72 passing tests, passing TypeScript/build, and 823 repository lint formatting errors plus 7 warnings.

No existing curriculum, authored rehearsal dialogue, stores, session provider, credentials, generated Supabase integrations, database migrations, package manifests or lockfiles were changed. Existing in-development systems remain honestly labeled rather than replaced with fake functionality.

## Implemented experience

- One continuous illustrated office, with desk, work wall and rehearsal corner views. Actual native links/buttons and separate foreground props sit above the architectural painting; the background is not used as an image-map substitute for components.
- Touch swipes, explicit tabs/previous-next controls, and roving keyboard navigation (arrows/Home/End). Secondary views are lazy-loaded and inactive views cannot take keyboard focus. Returning from a destination restores the last office view through session storage.
- A consistent original Director with seven reusable expressions and a full-body master. The existing ON/QUIET/OFF note behavior remains; he stays silent during perform/retake. A static Director object remains available for navigation when comments are off. The character gallery clearly identifies expression illustrations rather than grading an actor.
- Eight physical books stay visible on the desk. Their single large collection control opens an accessible two-column mobile/four-column desktop book close-up. Each has its specified color, original cover motif, dimensional spine/pages, and tactile cover-opening state; all eight link to their original school slug. The modal traps focus, closes with Escape, restores focus to the desk control, and keeps its header/close action visible while books scroll.
- Readable object labels, touch targets at least 44px for scene/header/tab controls, visible focus, device/user motion controls and default-silent opt-in sound. The only sound is a small gesture-triggered synthesized tap; no microphone, recording or autoplay.
- Actual saved rehearsal counts and owner-scoped completed-unit counts can change the Director's expression and add a physical milestone note. Unknown, loading or failed data produces no celebration. No school-specific bookmark or performance judgment is inferred from an aggregate count.

## Connected destinations

| Physical element                | Existing destination                        |
| ------------------------------- | ------------------------------------------- |
| Eight books / full library link | `/conservatory` and `/conservatory/$school` |
| Director                        | `/director`                                 |
| Clapperboard                    | `/scene`                                    |
| Annotated screenplay            | `/stuck`                                    |
| Casting notice board            | `/work`                                     |
| Rehearsal mirror                | `/baseline`                                 |
| Vintage camera                  | `/lab`                                      |
| Technique diagram               | `/matrix`                                   |
| Open actor portfolio            | `/passport`                                 |
| Empty chair                     | `/lounge`                                   |

Preserved school identities: `stanislavski`, `meisner`, `adler`, `practical-aesthetics`, `chekhov`, `laban`, `strasberg`, `viewpoints`. Existing year/term navigation, publication checks, stable IDs and assessments are not altered. The global milestone note counts confirmed completion records without pretending to know the school or quality of the acting.

## Asset system

| Asset                               | Source/runtime implementation                                                                                                                                                                                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Director master + seven expressions | Original generated transparent 1536×1024, regular 4×2 atlas: bored, observant, unimpressed, critical / impressed, proud, exhausted, full-body master. Original PNG in `design/office-source/director-master-atlas.png`; runtime WebP in `src/assets/office/director-atlas.webp` (470,932 bytes) |
| Continuous architectural room       | Original generated 1536×1024 panorama using the existing approved studio illustration as its visual reference; fewer decorative filmmaking props. Original PNG in `design/office-source/office-master-panorama.png`; runtime `office-panorama.webp` (318,800 bytes)                             |
| Foreground desk                     | Original reusable SVG wood/perspective layer in `OfficeArt.tsx`                                                                                                                                                                                                                                 |
| Eight books and opened states       | Original SVG cover motifs and CSS cover/spine/page layers in `SchoolBooks.tsx`; no flattened screenshot buttons or fake lesson pages                                                                                                                                                            |
| Interactive props                   | Original scalable SVG clapperboard, annotated screenplay, casting board, portfolio, diagram, mirror, camera and chair; independent native navigation elements                                                                                                                                   |
| Lighting/transitions/loading        | CSS atmosphere, finite view/prop/cover transitions and live text loading states; disabled by motion preferences. Lighting remains behind labels                                                                                                                                                 |
| Browser brand mark                  | Original charcoal/ivory/crimson SVG monogram, `public/slams-icon.svg`; existing original artwork/favicon files are retained                                                                                                                                                                     |

Only the room/character essentials are preloaded. The two runtime image resources total 789,732 bytes; PNG editing masters are not imported into the runtime. Existing Bodoni Moda/Karla type roles and fallbacks remain. No new production dependency or 3D/animation engine was added.

The supplied creative direction authorized a new Director because no earlier character source was in the checkout. No existing mascot likeness was silently replaced. Illustration consistency and production art approval should still receive human review; the vector props are intentionally vector assets, not claims of separately generated hand-painted illustrations. No core artwork is missing for this implemented experience. Native launcher/store exports, additional poses, voice recordings and actual authored curriculum are outside this implementation.

## Files

- `src/components/office/`: scene controller, Director atlas renderer, central route/book data, vector art, object links, school books, lazy work-wall/corner components and authenticated milestone reader.
- `src/routes/index.tsx`: office home and essential-image preloads; `src/routes/director.tsx`: functional Director preferences/profile and expression gallery.
- `src/components/slams.tsx`: reusable character note, larger mode targets, explicit return-to-office link. Existing behavior remains.
- `src/office.css` / one import in `src/styles.css`: scoped scene, objects, books, responsive composition, reduced motion, dialog and character styling.
- `src/routes/__root.tsx` / `public/slams-icon.svg`: browser icon; providers and root Outlet retained.
- `src/assets/office/`, `design/office-source/`: optimized runtime artwork and retained original editing masters.
- `src/test/office.test.tsx`, `director-presence.test.tsx`, `office-milestones.test.tsx`: new interaction, consent, verified-data and cross-account regression coverage.
- `scripts/verify-office.cjs`: optional Playwright browser regression; no live authenticated backend mutations.

## Executed verification

| Check                                       | Result                                                                                                                                                                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                  | **95 passed**, 11 files, no skipped tests (72 existing + 23 new)                                                                                                                                                 |
| `npm exec tsc -- --noEmit`                  | Passed                                                                                                                                                                                                           |
| `npm run build`                             | Passed; client, SSR and Cloudflare/Nitro output                                                                                                                                                                  |
| ESLint on all changed TS/TSX/CJS            | Passed, no warnings/errors                                                                                                                                                                                       |
| `npm run lint`                              | **788 existing formatting errors, 7 warnings** in unchanged files; no rule suppression. Formatting touched files removed 35 baseline errors                                                                      |
| Chromium against development server         | **83 checks passed**, no uncaught page errors                                                                                                                                                                    |
| Chromium against compiled Cloudflare worker | **83 checks passed**, no uncaught page errors; local compatibility override described below                                                                                                                      |
| Viewports                                   | 320, 360, 390, 412, 768, 1440px; no horizontal page overflow; scene/header/tab touch hit boxes at least 44px                                                                                                     |
| Rehearsal                                   | All 9 existing scripted retake obstacles exercised and distinct; Director absent during both takes; a real signed-out rehearsal saved and survived Passport reload                                               |
| Other local functionality                   | All object destinations rendered their real page; office return/view restoration, audition save/reload, auth form availability, dialog focus/Escape, seven expressions, opt-in sound and reduced motion verified |
| Data isolation                              | Unit tests reject unknown/stale counts, hide failed/loading Passport activity and prevent a late A milestone response leaking into B's display                                                                   |

Browser evidence is generated into `SLAMS_ARTIFACT_DIR` (this run: `/workspace/slams-office-verification/production`), including `browser-results.json`, mobile/desktop office, work-wall, corner, books and Director screenshots. The browser contexts are isolated and signed out; their temporary local records are not written to a live account.

Repeat the browser checks with separately installed Playwright and system Chromium:

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3100 \
SLAMS_ARTIFACT_DIR=/tmp/slams-office-verification \
node scripts/verify-office.cjs
```

### Production runner limitation and verified fallback

The existing `npm run preview` fails before rendering the app: TanStack's preview middleware imports absent `dist/server/server.js`, while the Lovable/Nitro build emits `.output/server/index.mjs`. This is recorded as a preview integration limitation, not dismissed as an office layout failure. No fake `dist` shim, duplicate plugin or dependency override was introduced.

The generated Cloudflare worker was tested with externally installed Wrangler 4.156.0. Its bundled workerd supports dates through **2026-10-30**, while Nitro's generated configuration selects **2026-11-01**. The successful local-worker test therefore used `--compatibility-date 2026-10-30` as a **local-only override**. Neither the production configuration nor the app framework was changed. Wrangler also used its default local `Request.cf` metadata because its metadata fetch is blocked. This is local worker verification, not a deployed Cloudflare/Lovable sign-off or a guarantee of November 1 compatibility.

Build first, then start or restart the local worker: rebuilding while the runner is active can leave its in-memory module/asset manifest referencing old hashed CSS files. This occurred in the final check; a fresh runner against the new output was used for the final successful verification. Do not mistake that stale preview instance for a valid new build.

```sh
WRANGLER_SEND_METRICS=false wrangler dev \
  --config .output/server/wrangler.json --local --port 3101 \
  --compatibility-date 2026-10-30
```

Lab performance sample against that worker: Chromium mobile viewport 390×844 at 2× density, 4× CPU slowdown, 80ms artificial latency and 750KB/s download. First contentful paint was 496ms and load 1,583ms; over 90 sampled frames during a view transition, median interval was 16.7ms, 95th percentile 16.8ms, with zero intervals above 50ms. This single synthetic lab sample is not a physical Android benchmark, field metric or full Web Vitals audit; do not generalize it into a production performance guarantee.

## Remaining production gates

1. Verify on representative physical Android hardware, TalkBack, actual keyboard/gesture navigation, small-height/landscape windows, 200% text scaling and intermittent real networks. Chromium mobile emulation is not a device test.
2. Independently review visual quality, illustration consistency, accessible contrast in every state and delivery rights. Further room/character refinements can use the retained source masters without replacing functionality.
3. Resolve/review the existing preview-output mismatch and verify the intended deployment compatibility date with the actual hosting runtime. `npm run build` passing is not a deployed-runtime test.
4. Apply backend network settings and use two independent confirmed test users for live sign-in/email confirmation/recovery, school loaders, term/assessment gates, cloud persistence, real RLS and authenticated milestone counts. These were not verified live; publishable settings and mocked tests are not proof. No curriculum or private credentials were invented to bypass the blocker.
5. Finish the pre-existing full-repository lint maintenance separately. Six React Refresh warnings and one unused-disable warning remain, along with the formatting errors.
6. The existing baseline/lab/matrix/lounge features are still in development. Their new physical navigation objects do not imply those tools are complete.
7. GitHub API access remains subject to the active network policy; pushing a branch is not evidence of a created PR, deployment or merge.

The office implementation is working and locally reviewable. None of the live/deployment/device checks above is claimed as performed.

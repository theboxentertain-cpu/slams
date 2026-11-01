# Sprint 02 visual implementation blueprint

Status: **review plan, not an approved redesign or implemented UI**. Audited main `34bfc86` on November 1, 2026 using source files and inspection of the two checked-in image assets. No browser, Android-device, screenshot-diff or live-backend validation was performed for this visual audit.

## Identity already present

| Element                     | Current implementation                                                                                                     | Reuse/preserve                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Cinematic Director's Office | `src/assets/studio-bg.jpg`, displayed by `src/routes/index.tsx` under `.studio-veil`                                       | Existing illustrated office is the base artwork, not a placeholder; retain it                  |
| SLAMS wordmark              | `Wordmark` in `src/components/slams.tsx`: Bodoni Moda, heavy serif, ivory with crimson A                                   | Keep its lettering/case, crimson emphasis and accessible label                                 |
| Studio authorship/tagline   | Home reads `MRAHMO STUDIOS PRESENTS` / `The Actor's Pocket Studio`; metadata credits MRAHMO STUDIOS                        | Preserve existing approved in-product copy; do not rename branding as part of engineering work |
| Dark cinematic palette      | `src/styles.css` already defines charcoal, ivory, crimson, supporting amber and translucent dark panels                    | Reuse tokens instead of inventing replacement hex colors                                       |
| Display/body type           | Bodoni Moda / Karla with Georgia / system fallbacks; fonts requested in `__root.tsx`                                       | Preserve roles; typography must remain usable while network fonts load/fail                    |
| Quiet, opt-in Director      | `DirectorToggle`, `DirectorNote`, local `slams.director.v1`; ON/QUIET/OFF; note suppressed for perform/retake              | Keep behavior and stored preference exactly; mascot obeys the same gates                       |
| Primary interaction         | `START REHEARSAL` → `/scene`; crimson primary button with minimum 48px height                                              | Keep primary action prominent and functional                                                   |
| Portal/system structure     | Home's 3 portals, 6 system links, reusable `Page` header, browser-back control and home link                               | Preserve URLs, grouping and access to account state                                            |
| Eight-school identity       | Individual `data-school` accents within the common palette; 8 cards/36 provisional terms                                   | Preserve every name, slug, hierarchy and in-development disclaimer                             |
| Accessibility foundation    | Focus-visible amber outline, reduced-motion CSS, native buttons/links, Director `aria-pressed`, form labels, live statuses | Carry forward; test contrast, touch targets and actual screen-reader behavior before sign-off  |

The locked direction supplied for this sprint is the cinematic office, illustrated Director, charcoal/ivory/crimson palette and Android-first use. No separate signed-off character sheet, composition reference or full design specification is in the repository. Proposed implementation details below remain subject to visual approval; this document does not invent a new mascot appearance.

## Artwork inventory and reuse decisions

| Asset                                            | Observed facts                                                                                                                                   | Decision                                                                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/assets/studio-bg.jpg`                       | 1024×1536 JPEG, 239,620 bytes; existing warm painted office with red curtains, spotlight, Director chair, script pages, reels, pinboard and desk | Reuse the **complete original** as the office master. Chair/spotlight/scripts are baked-in scenery, not separate interactive illustrations. Do not cut them into new navigation or treat image text as curriculum |
| `public/favicon.ico`                             | 256×256 RGBA icon; visual inspection shows Lovable's multicolor heart mark                                                                       | Existing platform artifact, not the locked SLAMS wordmark. Leave unchanged in this PR; replace only with an approved SLAMS icon in a later visual change                                                          |
| `Wordmark` component                             | Rendered text; no separate logo SVG is checked in                                                                                                | Reuse the component. A future export needs typography/licensing/branding review                                                                                                                                   |
| Director mascot                                  | No illustration, sprite, portrait, SVG, model or approved character sheet found                                                                  | Blocking art input: obtain the approved master/reference. Do not generate or substitute stock/generic artwork                                                                                                     |
| Landscape office, Android launcher and share art | No separate assets found; no manifest/service worker found                                                                                       | Do not imply these exist or promise installation/offline support. Commission/export only after approval                                                                                                           |

Office master SHA-256: `3a9330b5defeba35b65ca4ee269c9e08a58aa295b73cc0f7d45bc18dbe01c5cb`. Keep the original untouched. Once composition is approved, derivatives may be generated from that same master with documented dimensions/compression and reviewed crops; no new generic background or fabricated scenery.

The portrait master cannot show its full height in a wide landscape crop. Provide crop comparisons at the target widths before approval; keep the chair/office recognizable and never stretch or algorithmically extend the artwork. If the desired desktop composition requires additional scenery, the missing approved landscape master is an art dependency, not permission to replace the current image.

## Route and behavior preservation contract

| Current route                             | Sprint 02 scope after approval                                                                   | Invariants                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                       | Office landing composition using existing image, wordmark, Director presence and current actions | Rehearsal first; existing account/demo status, portals and systems remain reachable                                                                                       |
| `/director`                               | Director detail/settings presentation within the same visual world                               | Keep the URL; do not invent an AI chat, judging/grading, voice interruption or new route                                                                                  |
| `/scene`                                  | Apply approved visual primitives around the current step content                                 | Preserve explore → perform → response → intervene → practice → retake → reflect → saved, all scripted branches and Passport save behavior; no Director during either take |
| `/conservatory`, `/conservatory/$school`  | Refine existing school cards/page framing only                                                   | Keep all school routes, public server reads, stable IDs, reviewed-publication requirements and honest empty/in-development states                                         |
| `/work`, `/passport`                      | Shared framing/form/action styles                                                                | Preserve authenticated cloud persistence, signed-out local mode, explicit imports, verification/errors/retries and deletion controls                                      |
| `/stuck`                                  | Same framing/typography and existing scene link                                                  | Preserve deterministic existing content; no newly authored lesson                                                                                                         |
| `/baseline`, `/lab`, `/matrix`, `/lounge` | Apply shared page primitives without implying unbuilt tools are complete                         | Preserve the existing in-development status and destinations                                                                                                              |
| `/auth`, `/reset-password`                | Conservative readability/touch improvements using existing components                            | Preserve auth logic, redirect handling, accessible form/status states and secrets separation                                                                              |

School preservation checklist: Stanislavski (`stanislavski`), Meisner (`meisner`), Stella Adler (`adler`), Lee Strasberg (`strasberg`), Michael Chekhov (`chekhov`), Laban / Bartenieff (`laban`), Practical Aesthetics (`practical-aesthetics`), Viewpoints (`viewpoints`). No changes to `src/data/schools.ts`, `src/data/scene.ts`, stable curriculum IDs or cloud records are part of visual work.

## Proposed composition and component work

### Office landing

Keep the current content order and information architecture. Proposed mobile stacking: account/demo status → wordmark/attribution/tagline → primary rehearsal action → existing three portals → nonblocking Director note → six systems. Office imagery stays decorative behind this usable document; essential text/controls remain real DOM elements. No image hotspots, drag-only navigation, new modal onboarding or compulsory Director interaction.

Retain the existing 768px (`max-w-3xl`) content cap. Use 16px side gutters at 320–599px; 24px at larger widths, with 12–16px card gaps and a 24px vertical section rhythm as review targets. Below the existing `sm` breakpoint, keep portals stacked and systems in two columns only if labels fit; from 640px, retain the existing three-column portal/system grids. Preserve school cards' one/two-column behavior. Do not force a desktop dashboard onto a phone.

Review a hero/veil composition at 320, 360, 390, 412, 768 and 1024px, with a visible chair/curtain/spotlight region and readable ivory text. Keep the existing image/gradient while review is pending. Use a charcoal underlay/fallback even with images disabled; background text/posters are decorative, not accessible instructions. Avoid content shifts by reserving media dimensions; do not delay the CTA waiting for artwork.

### Illustrated Director

Integrate only the approved master. Proposed file location after asset review: `src/assets/director/`; proposed presentation-only `DirectorPortrait` component consumed by `DirectorNote` and the existing `/director` page. It must not own session, persistence, routing or scene state. Keep existing note text and local mode hook as the single source of behavior.

Art handoff: approved character sheet/master with known usage rights, transparent portrait export suitable for dark backgrounds, an uncut silhouette and enough resolution for 2× display at a 64–96px mobile portrait or 160–192px detail portrait. Request the character's approved appearance/expression instead of inventing costume, age, ethnicity, likeness or personality. Preserve the approved proportions; no CSS recoloring of character artwork.

| State                | Proposed presentation                                 | Behavior requirement                                                                        |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ON, outside take     | Approved portrait + full existing note                | Secondary to the user's rehearsal/task; no new generated feedback                           |
| QUIET, outside take  | Same portrait at compact size + existing `short` text | No additional dialogue or grading                                                           |
| OFF                  | No portrait/note area                                 | No empty mascot space or hidden control capturing focus                                     |
| `perform` / `retake` | No portrait, note, speech bubble or animation         | The Director never interrupts a take, regardless of saved mode                              |
| Missing/failed art   | Existing text-only note remains usable                | No new placeholder portrait or broken-image UI; final visual release waits for approved art |

A decorative portrait next to the already labeled “The Director” should use empty alt text; the textual aside supplies the accessible identity. If an approved portrait becomes an actual control, give the control a functional label and native keyboard/touch behavior. No autoplay audio, blinking, repeated idle animation, AI judgment or analytics about performance.

### Palette and typography

Keep these existing source values; define any extra component roles by reference to them rather than a parallel theme:

| Role          | Existing token/value                                                 | Planned use                                                                                                 |
| ------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Charcoal      | `--charcoal: oklch(0.2 0.008 60)`; background `oklch(0.17 0.008 60)` | Page foundation and calm readable areas over art                                                            |
| Ivory         | `--ivory: oklch(0.94 0.025 85)`                                      | Main text, wordmark, paper-like highlights                                                                  |
| Crimson       | `--crimson: oklch(0.52 0.19 25)`                                     | Primary rehearsal/action emphasis and existing wordmark A                                                   |
| Amber support | `--amber: oklch(0.76 0.14 70)`                                       | Focus and existing Director cues; keep subordinate to the charcoal/ivory/crimson identity                   |
| Dark panels   | Existing `--card`, `--border`, `.panel`                              | Legible content over the office; measure composition/contrast rather than assuming blur makes text readable |
| Typography    | Bodoni Moda display, Karla body, existing fallbacks                  | Display identity for titles; usable body/forms and loading fallbacks                                        |

Review targets: body/form text at least 16px, supplementary text generally 14px, comfortable line height around 1.5; preserve large display branding without overflowing narrow screens. Existing 10px scene progress labels and compact Director toggles need explicit narrow-screen/type-scale review. Verify actual text/background contrast (4.5:1 normal text, 3:1 large text) and non-text/focus contrast; school accents and crimson are not automatically contrast-approved for every combination. Never communicate error, selected mode or progress using color alone.

## Android-first implementation requirements

| Area                    | Required implementation/verification after approval                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Touch                   | Minimum 48×48 CSS-pixel tap boxes for actions, Director mode, header back/account controls and links used as buttons; existing primary meets 48px, secondary is 44px and compact controls need review. Keep visual glyph size independent of the hit box |
| Small screens           | No document overflow at 320–412px or 200% text scaling; inspect actual `scrollWidth` and clipping rather than trusting existing `overflow-x: hidden`                                                                                                     |
| Browser chrome/keyboard | Use stable content flow and reviewed `svh`/`dvh` where needed; forms, retake text and save/import errors stay reachable with keyboard open. No bottom action overlay over textarea content                                                               |
| Insets                  | Review `env(safe-area-inset-*)` for gesture/navigation bars before adding any fixed UI; current `pb-16` is not proof of device-safe spacing                                                                                                              |
| Navigation              | Native links and existing TanStack routes/history; Android Back works through scene/auth/portal navigation. Do not reset session or saved state for a visual transition                                                                                  |
| Performance             | Reuse the ~240KB image, reserve portrait dimensions, no video/parallax by default; profile `.panel` backdrop blur and fixed background on a representative low/mid-range Android phone. Solid charcoal readability must survive missing images/fonts     |
| Motion/accessibility    | Honor existing `prefers-reduced-motion`; TalkBack order matches DOM/task order, selection and save/error messages are announced; visible focus remains available to keyboard users                                                                       |
| Network/persistence     | Show real save/loading/error states; keep local imports explicit and all unverified records recoverable. Never add a service worker that caches private API responses or advertise offline cloud saves                                                   |
| Delivery                | Responsive web application first. PWA installation, Android packaging, notifications, microphone/camera and offline sync are separate decisions; none is silently added                                                                                  |

## Implementation sequence and review gates

| Phase                               | Concrete output                                                                                                                      | Completion gate                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 0 — Audit (this PR)                 | Asset/route inventory, token map, behavior contracts and blocker list                                                                | Review the blueprint; no visual changes shipped                                                        |
| 1 — Approved art/composition        | Approved mascot master, office crop sheets, favicon/brand decision and mobile/desktop annotated compositions                         | Explicit design approval before JSX/CSS/art integration; no generic substitute while waiting           |
| 2 — Visual primitives               | Update existing shared styles/components; add presentation-only portrait wrapper with reserved dimensions and graceful text behavior | Token/contrast/touch/reduced-motion review; no session/store/data changes                              |
| 3 — Office and Director integration | Approved `/` composition and `/director` presentation using the existing art and destinations                                        | Primary CTA, mode gates, all 3 portals/6 systems and account state remain usable                       |
| 4 — Route consistency               | Apply approved primitives to existing pages, including auth forms conservatively                                                     | Eight schools and all URLs intact; Living Scene and persistence regressions pass                       |
| 5 — Device and live verification    | Real Android/TalkBack/keyboard, responsive screenshots and approved live two-account/email protocol                                  | Record exact executed evidence and unresolved failures; do not label mocked tests as live verification |

## Acceptance matrix for the implementation PR

- Automated: existing 72 application tests, strict TypeScript, clean production build, affected-file lint and SQL regressions must pass. Keep the existing repository-wide lint baseline visible until separately resolved. Add focused component regressions for actual new portrait behavior (ON/QUIET/OFF/take/art-failure), not cosmetic snapshot tests that duplicate implementation.
- Visual: approved comparison images for 320/360/390/412px portrait, 768px tablet, 1024px desktop and a phone landscape case; approved typography/crops, no clipped wordmark, all content readable with fonts/images unavailable, reduced motion and 200% text size.
- Functional: Android Back, all current routes, all eight school cards, every scripted scene branch/retake/reflection, confirmed Passport save, audition edits, explicit import/retry/retained conflicts, signed-out demo and sign-in/out/recovery behavior. No new curriculum is required or authorized by the visual sprint.
- Data/auth: run the separate live email and two-account matrix from the [blocker list](sprint-01b-blockers.md); record an unavailable approved published unit as blocked instead of seeding fake lessons. No unnecessary generated integration changes or credential changes.

This blueprint can be reviewed now. Mascot delivery, approved compositions and device/live verification remain prerequisites for implementation sign-off; source inspection and image-file inspection do not establish browser appearance or backend correctness.

# SLAMS design system and ownership

Identity remains mrahmostudios presents **SLAMS — The Actor’s Pocket Studio**, with the ivory wordmark/crimson A, charcoal foundation, warm amber, burgundy and tactile paper/leather/wood/brass. The user’s visual references authorize the naturalistic Director, matching expressions, eight method-specific scenes and Baseline illustration. Original source artwork remains in the repository. See [premium art direction](SLAMS-PREMIUM-ART-DIRECTION.md) and its [training extension](SLAMS-TRAINING-ART-DIRECTION.md).

Typography: existing Bodoni Moda display, Karla body and locally licensed Caveat handwriting; preserve existing fallbacks and verify actual delivery in production. Handwriting is an accent, not the only way to read a functional label.

Book identities remain burgundy, deep blue, emerald, graphite/mustard, violet, burnt orange, dark crimson and teal. Canonical definitions remain in `components/office/office-data.ts`; no school duration or teaching content is encoded by color.

| Responsibility                          | Current owner                                                    |
| --------------------------------------- | ---------------------------------------------------------------- |
| Brand/base tokens/import order          | `src/styles.css`                                                 |
| Root state/navigation clearance         | `AppShell` and `foundation.css`                                  |
| Shared functional page/heading/actions  | `components/slams.tsx`, `StudioHeading`, `studio-world.css`      |
| Scenic training headings / school cards | `StudioHeading`, `SchoolPortrait`, `training-worlds.css`         |
| Optional Baseline intro / self-report   | `BaselinePage`, `baseline.css`, existing `useActorSetup`         |
| Unit reading / editorial practice style | `CurriculumUnit`, existing Meisner components, `lesson.css`      |
| Real section tabs and availability note | `SectionTabs`; unavailable-only routes now use one `SupportPage` |
| Office composition                      | `DirectorsOffice`, `premium-office.css`                          |
| Office books/dialogs/shared portraits   | Existing Office components, typed `office-data.ts`, `office.css` |
| Welcome composition                     | Existing welcome components and `welcome.css`                    |
| Director/motion/sound settings          | Existing preference/store owners; no duplicate provider          |

The premium pass retires the `office-reference.css` and `office-cinematic.css` imports. `premium-office.css` owns the current Office composition; `office.css` retains shared books, dialogs, controls and portraits. `studio-world.css` and `welcome.css` own their existing page families. `director-life.css` owns section-coach presentation and animation; the existing scripted map and preference hooks still govern behavior. Historical CSS files and artwork are retained but are not additional active layout layers.

The training pass moves the old school-selector rules out of `foundation.css` and `studio-world.css` into `training-worlds.css`, which owns the new illustrated gallery and scenic headings. `baseline.css` and `lesson.css` are scoped to their own page bodies. A compact scenic-header coach uses the same mode/identity/motion owners and central scripted map. The added Baseline note describes self-report; it does not assess talent.

Functional controls use real HTML, descriptive names, keyboard focus and approximately 44–48px minimum targets. Retain reduced-motion behavior, safe-area/measured bottom clearance, readable input sizes and native navigation. A status page has one clear working next action rather than a row of unavailable tabs. Future Work tools live in a native keyboard-accessible disclosure with explicit availability labels.

Illustrations must never imply recording, skill analysis or progress. Keep interactive text outside flattened artwork. New artwork follows the user’s supplied pose, character, lighting and environment references. Future additions need the same continuity and intrinsic-size specification; do not substitute a generic character.

Outstanding design verification: physical Android/TalkBack, device text scaling/orientation, production font/asset delivery, content/illustration rights and representative performance constraints. Chromium emulation alone does not establish these.

PR B welcome composition: existing Director portrait/wide assets and masthead, one dominant entry CTA above optional exploration, a readable dark entry panel, and native disclosure for the eight books. `welcome.css` remains the owner; obsolete step/experience/goal styles and competing landing sizes are removed there. Standard account/settings/baseline art is retained. Automated entry visibility is checked at 320/360/390/412 × 844 and 768/1440 × 1000; smaller-height or enlarged-text layouts may require vertical scrolling.

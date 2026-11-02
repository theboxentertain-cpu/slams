# SLAMS design system and ownership

Identity remains mrahmostudios presents **SLAMS — The Actor’s Pocket Studio**, with the ivory wordmark/crimson A, charcoal foundation, warm amber, burgundy, tactile paper/leather/wood/brass and the same approved illustrated Director. PR A and PR B add no artwork and replace none.

Typography: existing Bodoni Moda display, Karla body and locally licensed Caveat handwriting; preserve existing fallbacks and verify actual delivery in production. Handwriting is an accent, not the only way to read a functional label.

Book identities remain burgundy, deep blue, emerald, graphite/mustard, violet, burnt orange, dark crimson and teal. Canonical definitions remain in `components/office/office-data.ts`; no school duration or teaching content is encoded by color.

| Responsibility                          | Current owner                                                    |
| --------------------------------------- | ---------------------------------------------------------------- |
| Brand/base tokens/import order          | `src/styles.css`                                                 |
| Root state/navigation clearance         | `AppShell` and `foundation.css`                                  |
| Shared functional page/heading/actions  | `components/slams.tsx`, `StudioHeading`, `studio-world.css`      |
| Real section tabs and availability note | `SectionTabs`; unavailable-only routes now use one `SupportPage` |
| Office scene/props/books                | Existing Office components and typed `office-data.ts`            |
| Welcome composition                     | Existing welcome components and `welcome.css`                    |
| Director/motion/sound settings          | Existing preference/store owners; no duplicate provider          |

The Office still has layered legacy/reference/cinematic CSS. PR A removes 21 proven-unused six-item-navigation/modal-progress rules and their unreferenced components; it does **not** claim full CSS consolidation. Further consolidation belongs to a measured polish/reliability change, with screenshot comparison to avoid replacing newer design work.

Functional controls use real HTML, descriptive names, keyboard focus and approximately 44–48px minimum targets. Retain reduced-motion behavior, safe-area/measured bottom clearance, readable input sizes and native navigation. A status page has one clear working next action rather than a row of unavailable tabs. Future Work tools live in a native keyboard-accessible disclosure with explicit availability labels.

Illustrations must never imply recording, skill analysis or progress. Keep interactive text outside flattened artwork. Reuse current approved art; any genuinely needed new production asset requires a continuity/pose/environment/size specification and review, not a generic replacement.

Outstanding design verification: physical Android/TalkBack, device text scaling/orientation, production font/asset delivery, content/illustration rights and representative performance constraints. Chromium emulation alone does not establish these.

PR B welcome composition: existing Director portrait/wide assets and masthead, one dominant entry CTA above optional exploration, a readable dark entry panel, and native disclosure for the eight books. `welcome.css` remains the owner; obsolete step/experience/goal styles and competing landing sizes are removed there. Standard account/settings/baseline art is retained. Automated entry visibility is checked at 320/360/390/412 × 844 and 768/1440 × 1000; smaller-height or enlarged-text layouts may require vertical scrolling.

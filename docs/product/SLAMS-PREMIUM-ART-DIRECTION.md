# Premium studio art direction — November 2, 2026

The user requested the art style of reference image 1 and the premium layout/design of the other attached images. This change starts from main `844d7632e59b55015f755db16ca0cfdb556bca5f`, including the merged blueprint improvements and section-aware coaching. It changes presentation without implementing the remaining blueprint features.

## Art and continuity

| Asset                                          | Specification                                                                                                                                                                                   | Delivery                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `src/assets/premium/director-studio.webp`      | 1536 × 1024. Naturalistic illustrated Director leaning forward with the signature mug; black curls, glasses, red pencil, leather chair, brass lamp, headshot wall and an empty rehearsal stage. | 357,650 bytes; high priority on Office/welcome.           |
| `src/assets/premium/director-expressions.webp` | 1774 × 887; four columns/two rows of square portrait cells. Reading order: bored, observant, unimpressed, critical, impressed, proud, exhausted, master. Same character and lighting.           | 376,922 bytes; shared atlas loaded by `DirectorPortrait`. |

Both assets were generated for this request using the supplied visual references and converted to WebP using ImageMagick. Atlas generation referenced the new hero to preserve character continuity. Original files in `assets/office` and `assets/welcome` are retained unchanged. The original local font/license and eight canonical school-book colors, names, symbols and routes are retained. The signature mug inscription is part of the illustration; controls, headings, account identity, progress and lesson metadata are live HTML.

## Composition

The Office uses a centered masthead, immersive character scene, real Work/Rehearse signs, compact Director control, parchment next-action card, four task cards, eight-book library, factual journey counts and a native disclosure for supporting tools. The next-action card resumes only an actual eligible started curriculum unit; otherwise it opens the existing scripted rehearsal. It never copies the references’ example actor, percentages, levels, lesson names or mastery claims.

The five global destinations remain Office, Schools, Rehearse, Work and Stuck Desk. The four Office task entrances lead to Train, Rehearse, Work and Get Unstuck. Work Wall and Rehearsal Corner retain their mapped controls and restoration behavior. Supporting systems remain contextual and retain their availability disclosures.

Welcome, account/setup, Conservatory/schools/terms, rehearsal/scene, Work/audition, Stuck Desk, Passport/progress, Settings and support pages inherit the new brass framing, readable warm paper, dark theater background, red actions and matching portraits through their existing shared owners. This is a visual extension to existing screens; it does not add reviewed teaching material, recording, analysis, partner matching or assessments.

## Ownership and behavior

- `premium-office.css` owns Office layout. Retired reference/cinematic stylesheet imports no longer compete with it.
- `office.css` owns shared books/dialogs/portrait surfaces; `welcome.css` and `studio-world.css` retain their page families.
- `foundation.css` owns the same five-route bar and bottom clearance. `director-life.css` presents the existing section coach.
- Existing session, curriculum, storage and Director preference owners are unchanged. ON/QUIET/OFF, reduced motion, silent takes, keyboard room navigation, swipe suppression, dialog focus restoration and local saves remain functional.

Verification results and screenshots are recorded in [the implementation report](../slams-premium-verification.md). The 47-page audit still governs product gaps; visual polish does not close unavailable page contracts.

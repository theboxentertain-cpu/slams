# SLAMS visual and UX contract

The [blueprint](SLAMS-47-PAGE-TRACEABILITY.md) governs page responsibilities. This pass preserves the mrahmostudios SLAMS identity, ivory lettering/crimson A, charcoal/burgundy foundation, amber light, paper/leather/wood/brass surfaces and the approved illustrated Director, Office rooms and school books. No asset is replaced, regenerated or flattened into a replacement interface.

## Existing owners

| Responsibility                                        | Owner                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Brand tokens, import order and base typography        | `src/styles.css` and existing local fonts                          |
| Bodoni Moda / Karla / handwriting accents             | Existing font declarations and fallbacks; no new font dependency   |
| Five-item bar, location, profile and bottom clearance | `AppShell`, `foundation.css`                                       |
| Functional page / heading / actions                   | `Page`, `StudioHeading`, existing primary/secondary action tokens  |
| Cinematic shared surfaces                             | `studio-world.css`; existing scenic assets                         |
| Office rooms, objects and books                       | Existing Office components, `office-data.ts`, Office styles/assets |
| Welcome scene and account surfaces                    | Existing welcome components and `welcome.css`                      |
| Director modes / motion / sound                       | Existing store/preference hooks                                    |

Office styling still has accumulated layers; this focused PR does not claim a complete CSS consolidation. Approved art remains independently actionable through real HTML links/buttons, accessible names and keyboard interaction.

## Screen anatomy and behavior

One page title, clear section/context and real Back/Office path; one primary task action; secondary related tools; accurate loading, empty, saving, saved and error states; one persistent five-item bar within the studio. Planned destinations disclose their availability and offer a supported next action. A preference, route visit or term shell does not create progress.

The Scene review now uses existing panel/border/type/action tokens to show the chosen tactic, fixed partner response, intervention, exercise note, obstacle and actor-written retake. Actor text wraps and preserves line breaks. The summary describes inputs and scripted responses; it does not simulate observation or grading. Retake context and repeat navigation use the same input state. Director modes reuse the existing control, while performing notes stay silent.

Help's four task entrances use real links and existing secondary-action styling. The Settings Help entrance stays outside individual tab panels so it is reachable from every settings view. No new page shell, bottom tab or illustration is added.

## Verification boundary

Compiled Chromium checks cover 320, 360, 390, 412, 768 and 1440px, reflow, touch targets, keyboard focus, modal focus restoration, safe-area/bottom-bar behavior, reduced motion and enlarged root text. Screenshots are actual compiled output. Desktop/phone viewport emulation does not establish physical Android, TalkBack, OS text scaling, camera behavior, production font delivery or human usability.

Manual human first-five-minutes research, representative production performance and physical-device acceptance remain NOT RUN. The original welcome hierarchy still needs a shorter, clearer first-action presentation. No commercial-ready claim follows from the layout checks. See [release verification](SLAMS-RELEASE-VERIFICATION.md).

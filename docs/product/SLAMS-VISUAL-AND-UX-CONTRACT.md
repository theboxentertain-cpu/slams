# SLAMS visual and UX contract

The [blueprint](SLAMS-47-PAGE-TRACEABILITY.md) governs page responsibilities. The November 2 premium pass follows the user’s first reference for a more naturalistic illustrated Director and the remaining references for composition. It preserves the mrahmostudios SLAMS identity, ivory lettering/crimson A, charcoal/burgundy foundation, amber light and paper/leather/wood/brass surfaces. Two new WebP assets supply the hero and matching expressions; original source art and canonical school-book identities remain. The interface stays real HTML rather than flattened artwork.

The November 3 [training extension](SLAMS-TRAINING-ART-DIRECTION.md) adds an eight-school scene atlas and Baseline illustration. School cards, scenic headings, self-report panels and real lesson content borrow the latest references’ composition. The sample diagnostic scores, recommendations, videos and completion displays do not become product data. The existing editorial pilot remains non-credit and pending teaching review.

## Existing owners

| Responsibility                                        | Owner                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Brand tokens, import order and base typography        | `src/styles.css` and existing local fonts                         |
| Bodoni Moda / Karla / handwriting accents             | Existing font declarations and fallbacks; no new font dependency  |
| Five-item bar, location, profile and bottom clearance | `AppShell`, `foundation.css`                                      |
| Functional page / heading / actions                   | `Page`, `StudioHeading`, existing primary/secondary action tokens |
| Cinematic shared surfaces                             | `studio-world.css`; existing scenic assets                        |
| Scenic training headings / school gallery             | `StudioHeading`, `SchoolPortrait`, `training-worlds.css`          |
| Baseline body / unit and editorial reading            | `BaselinePage`, `baseline.css`, `CurriculumUnit`, `lesson.css`    |
| Office composition                                    | `DirectorsOffice`, `premium-office.css`                           |
| Shared books, dialogs and portraits                   | Existing Office components, `office-data.ts`, `office.css`        |
| Welcome scene and account surfaces                    | Existing welcome components and `welcome.css`                     |
| Director modes / motion / sound                       | Existing store/preference hooks                                   |

The reference/cinematic Office stylesheet imports are retired. Current composition has one owner, with shared book/dialog styles retained separately. Director mode, motion and sound still use their existing stores. Art remains independently actionable through real HTML links/buttons, accessible names and keyboard interaction.

## Screen anatomy and behavior

One page title, clear section/context and real Back/Office path; one primary task action; secondary related tools; accurate loading, empty, saving, saved and error states; one persistent five-item bar within the studio. Planned destinations disclose their availability and offer a supported next action. A preference, route visit or term shell does not create progress.

The Scene review now uses existing panel/border/type/action tokens to show the chosen tactic, fixed partner response, intervention, exercise note, obstacle and actor-written retake. Actor text wraps and preserves line breaks. The summary describes inputs and scripted responses; it does not simulate observation or grading. Retake context and repeat navigation use the same input state. Director modes reuse the existing control, while performing notes stay silent.

Help's four task entrances use real links and existing secondary-action styling. The Settings Help entrance stays outside individual tab panels so it is reachable from every settings view. Training artwork adds no new bottom destination or Help-specific shell.

## Verification boundary

Compiled Chromium checks cover 320, 360, 390, 412, 768 and 1440px, reflow, touch targets, keyboard focus, modal focus restoration, safe-area/bottom-bar behavior, reduced motion and enlarged root text. Screenshots are actual compiled output. Desktop/phone viewport emulation does not establish physical Android, TalkBack, OS text scaling, camera behavior, production font delivery or human usability.

Manual human first-five-minutes research, representative production performance and physical-device acceptance remain NOT RUN. Welcome retains its working first-rehearsal entry and simplified optional settings flow. No commercial-ready claim follows from layout checks. See [release verification](SLAMS-RELEASE-VERIFICATION.md), the [premium verification report](../slams-premium-verification.md) and [training verification](../slams-training-design-verification.md).

# Conservatory, Baseline and lesson art direction

The latest five supplied references extend the earlier premium art request. This pass starts from main `aa06ca6`, preserving the already merged first-rehearsal flow, premium Office, Meisner editorial pilot and academic/progress safeguards. Original artwork, authored training data, identity, storage and backend code are retained.

## Assets and school identities

| Asset                                            | Specification                                                                                                               | Size          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `src/assets/premium/director-school-worlds.webp` | 1774 × 887; 4 columns × 2 rows of square waist-up scenes; one consistent fictional Director in eight method-specific poses. | 401,200 bytes |
| `src/assets/premium/baseline-director.webp`      | 1536 × 1024; the Director points toward the actor at a brass-lit desk, leaving dark space for real heading text.            | 295,514 bytes |

The artwork was generated from the supplied references and prepared illustrations, then exported as WebP. Full PNG masters remain in the workspace’s `generated_images` directory. No existing asset was deleted or overwritten. All headings, school names, durations, availability, actions and user information are live HTML.

The school atlas follows `BOOK_DESIGNS` order, not a separate curriculum directory:

| Cell | School               | Scene                                           |
| ---- | -------------------- | ----------------------------------------------- |
| 1    | Stanislavski         | Reading and circumstances, burgundy             |
| 2    | Meisner              | Listening beside rehearsal chairs, blue         |
| 3    | Stella Adler         | Imagination and an open hand, emerald           |
| 4    | Practical Aesthetics | Precise action work on a script, charcoal/brass |
| 5    | Michael Chekhov      | Expansive gesture, violet                       |
| 6    | Laban / Bartenieff   | Flowing movement, burnt orange                  |
| 7    | Lee Strasberg        | Quiet inward concentration, crimson             |
| 8    | Viewpoints           | Space and ensemble observation, teal            |

These are fictional Director scenes, not portraits of the historical teachers. Square sprite cells preserve their aspect ratio within cropped card regions. Original book colors, symbols, route slugs, years and term counts remain canonical. Durations are still explicitly provisional.

## Screen responsibilities

The Conservatory has a scenic heading, its three existing functional filters, eight framed landscape cards and contextual Baseline/rehearsal/progress links. Cards use two columns on larger screens and one on phones. The five global navigation destinations are unchanged. Each school/year/term/unit reuses its matching scene and original book identity. Meisner’s overview links directly to its actual first-term editorial preview.

Baseline borrows the reference’s parchment profile and process layout. It is an optional introduction, not a diagnostic. It reads only the existing account-namespaced, device-local self-description when one exists, and distinguishes empty, loading and read-error states. No intake questionnaire was restored to the simplified first-rehearsal flow. The reference’s 76% score, trait bars, strengths, verdict, four-week plan and recommended school are not generated or seeded. Main and welcome share the same factual content and existing rehearsal/Passport/school links.

Unit pages display reviewed, published content as an open reading sheet beside the real account activity panel. Other `CurriculumUnit` callers keep their original disclosure behavior. The only progress action remains **Start unit**; no self-awarded completion, mastery or credit is introduced. Legacy completion remains explicitly unassessed.

The existing Meisner editorial workshop retains all three lessons, written classification feedback, solo preparation, human-partner conditions, exercises, reflection and temporary private-note behavior. Why/demonstration/try/avoid blocks are presented in two columns on desktop and one on phones. The draft term inventory is available in a native disclosure below the interactive workshop. Content, classification logic, participation gates and storage behavior are unchanged. The preview remains pending qualified teaching review, non-credit and separate from published curriculum.

## Ownership and verification

`training-worlds.css` owns the scenic headings and illustrated school gallery. The old gallery rules are removed from `foundation.css` and `studio-world.css`; original Office/library books still use their existing owners. `baseline.css` owns the shared Baseline body and `lesson.css` owns unit/pilot reading surfaces. The optional welcome artwork prop preserves existing defaults.

The compact Director control reuses the central scripted map, existing expression atlas and ON/QUIET/OFF state. Notes stay in normal flow, reduced motion remains honored, and existing take-silencing rules are retained. Artwork does not imply observation, diagnosis or academic assessment.

See [implementation verification and screenshots](../slams-training-design-verification.md). This pass adds no route family, database migration, media capture, AI partner, formal assessment or reviewed curriculum pack. It makes no commercial-readiness or accreditation claim.

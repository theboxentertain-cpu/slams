# Feature truth matrix

Statuses describe actual capabilities. Source behavior and current executed evidence are distinguished from live deployment verification.

| Feature                                                | Status                     | Supported result / remaining boundary                                                                         |
| ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Three Office views/hotspots/eight books                | WORKING                    | Actual routes/dialogs, keyboard/touch controls; existing approved artwork retained                            |
| Welcome/guest entry                                    | WORKING                    | Direct scripted rehearsal entry; optional sign-in/settings/exploration; two activations to acting choices     |
| Actor setup                                            | LIMITED                    | Optional existing motion/sound controls; earlier device/account-namespaced personal preferences preserved     |
| Welcome/guest entry                                    | LIMITED                    | Blueprint keeps Account Choice; optional setup/skip works; first-action hierarchy still needs work            |
| Actor setup                                            | LIMITED                    | Optional device/account-namespaced preferences, not cloud profile sync or assessment                          |
| Five-route studio navigation                           | WORKING                    | Single owner; safe-area clearance and focus behavior retained                                                 |
| Eight school hierarchy                                 | WORKING STRUCTURE          | Existing canonical slugs and provisional 36 terms; not completed teaching                                     |
| Reviewed-unit progression/resume                       | REVIEWED-CONTENT-DEPENDENT | Existing published/reviewed/ancestor gates and genuine saved starts; no invented pilot                        |
| Meisner pilot                                          | BLOCKED                    | Expert-reviewed instructional substance/criteria and live availability still required                         |
| Scripted `Stay` rehearsal                              | WORKING                    | Authored choice/intervention/practice/retake/reflection; fixed partner responses                              |
| Rehearsal save/Passport                                | WORKING, LIVE LIMITED      | Guest save/reload and explicit unsaved continuation verified; real cloud behavior needs live verification     |
| Scripted `Stay` rehearsal                              | WORKING                    | Authored choice/intervention/practice/retake/reflection; new input-preserving repeat/review; fixed responses  |
| Rehearsal save/Passport                                | WORKING, LIVE LIMITED      | Existing guest saves and mocked owner/failed-import tests; real cloud behavior needs live verification        |
| Rehearsal draft resume / own scripts                   | UNAVAILABLE                | Completed reflections are not resumable sessions                                                              |
| Audition preparation                                   | WORKING, LIVE LIMITED      | Existing six-field note save/edit/import; one record, no multi-project library                                |
| Character files/project journal/breakdowns             | UNAVAILABLE                | Explicit statuses and useful alternatives; no disconnected replacement storage                                |
| Self-tape capture/playback/export                      | UNAVAILABLE                | No capture permission, working recording control or export claim                                              |
| Stuck Desk suggestions                                 | LIMITED                    | Existing draft authored options, review disclaimer and real scene link                                        |
| Saved intake/diagnosis/retry/fixes                     | UNAVAILABLE                | No observation/evaluation claimed; compatibility routes retained                                              |
| Baseline                                               | LIMITED INTRODUCTION       | Optional legacy welcome introduction outside default entry; no guided diagnostic or actor classification      |
| Lab / Matrix / Lounge                                  | UNAVAILABLE                | No media comparison, reviewed comparison content or live partner service                                      |
| Passport evidence/portfolio/badges                     | UNAVAILABLE                | Text reflections work; no invented competence achievements                                                    |
| Progress                                               | LIMITED                    | Genuine record counts and available history; unknown counts are not zero, school completion is not inferred   |
| Director                                               | LIMITED                    | Existing expressions, authored/factual comments, ON/QUIET/OFF and silence during takes; no evaluation service |
| English/accessibility controls                         | WORKING SUBSET             | Existing motion/sound/Director preferences; physical assistive-technology checks outstanding                  |
| Arabic/RTL/captions/coach voice/mature-language filter | UNAVAILABLE                | Not offered as working settings                                                                               |
| Email login/confirmation/recovery                      | BLOCKED LIVE VERIFICATION  | Existing SDK paths and unit contracts remain; no live success claimed                                         |
| Independent live account/RLS isolation                 | BLOCKED                    | Unit mocks and two simulated local DB identities do not establish live two-account verification               |
| Auth-user deletion cleanup                             | MISSING ESSENTIAL POLICY   | Orphan-retention issue remains; no destructive live action in PR A                                            |
| Standard preview command                               | BROKEN                     | HTTP 500 from missing Node preview entry; compiled local worker is a separately documented verification path  |

PR A changes navigation ownership and availability presentation. It does not upgrade an unavailable feature to working merely by simplifying its page. Exact checks and remaining failures are in [release gates](SLAMS-RELEASE-GATES.md).

PR B changes first-use navigation and optional settings, using the existing authored scene and save owners. Complete browser denial of the `localStorage` getter currently produces the application error page in the unchanged auth storage adapter; quota/write failure does not gate entry. See [PR B verification](SLAMS-PR-B-VERIFICATION.md) for the bounded evidence and remaining reliability work.

## Shared engines and signature experience status

The [product contract](SLAMS-PRODUCT-CONTRACT.md) retains all nine sections and ten signature names as final-product requirements. An unavailable capability remains in the architecture; a retained name or route does not make it functional.

| Engine / experience        | Current status                     | Evidence / requirement before a stronger claim                                                                                                                               |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Living Scene Engine        | PARTIAL IMPLEMENTATION             | `src/routes/scene.tsx` and `src/data/scene.ts`: one authored text scene with the full practice/retake/reflection/save cycle; no arbitrary script or section-wide integration |
| Actor Development Engine   | PARTIAL FOUNDATION                 | Existing stores, reviewed-unit progress guards and eligible resume; no unified cross-section learning-evidence/mastery/advancement system                                    |
| The Unpredictable Director | CONCEPT; RELATED SCRIPTED PARTS    | Fixed retake obstacles and current Director notes exist; no implemented variable direction experience or observation-based feedback                                          |
| The Listening Trap         | CONCEPT; RELATED SCRIPTED EXERCISE | Existing Meisner observation/repetition prompt; no implemented test exposing predetermined responses or measuring listening                                                  |
| The Bullsh*t Detector      | CONCEPT                            | No supported observation/evaluation of forced emotion or behavior justification; requires evidence boundaries and reviewed criteria                                          |
| No Tears Required          | CONCEPT                            | Existing action-focused prompts are related; no distinct reviewed experience under this name                                                                                 |
| Do the Damn Note           | CONCEPT; RELATED RETAKE WORKFLOW   | An authored intervention and actor retake work; no dedicated note-application/comparison experience                                                                          |
| The Set From Hell          | CONCEPT                            | Authored changing circumstances are related; no implemented controlled pressure-simulation workflow                                                                          |
| The 60-Second Rescue       | CONCEPT; RELATED STUCK SUGGESTIONS | Draft authored Stuck options exist; no timed rescue experience, saved-solution loop or verified outcome                                                                      |
| Three Takes, Three Tactics | CONCEPT                            | Current scene offers three alternative tactics and one retake; no connected three-take comparison                                                                            |
| Unpredictable Partner      | CONCEPT; RELATED FIXED RESPONSES   | Partner responses are predetermined by tactic; no adaptive partner service or live Lounge connection                                                                         |

The structure remains **36 provisional terms across eight schools**, not complete reviewed curricula. Practice evidence → assessment → advancement and the final graduation requirements remain target responsibilities subject to reviewed material. No current saved reflection, raw count or authored response is promoted to a competence assessment by this documentation update.
## Blueprint engine/signature boundaries

The nine original sections and both engines remain required. The [navigation contract](SLAMS-NAVIGATION-CONTRACT.md) places supporting systems contextually without extra global tabs. All 47 supplied responsibilities remain in the [machine map](SLAMS-47-PAGE-MAP.json).

| Engine / signature            | Actual state                   | Gate                                                                                                                   |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Living Scene Engine / P23–P28 | PARTIAL                        | One authored scene; review/repeat/return improved. Stable cross-section scene/session/objective identity still absent. |
| Actor Development Engine      | PARTIAL FOUNDATION             | Current records, publication guards and eligible resume; no unified practice-evidence/assessment/mastery system.       |
| Unpredictable Director        | TARGET                         | Authored obstacles exist; a variable, reasoned direction experience is not implemented.                                |
| Listening Trap                | REVIEW-DEPENDENT               | Current observation prompt is not a validated listening test; reviewed exercise required.                              |
| Bullsh*t Detector             | TARGET                         | No evidence-based observation or evaluation of forced emotion/unsupported behavior.                                    |
| No Tears Required             | REVIEW-DEPENDENT               | Reviewed exercise required; no emotional-display score.                                                                |
| Do the Damn Note              | RELATED PARTS ONLY             | Actor can apply an authored intervention and edit a retake; no observed compliance or dedicated comparison module.     |
| Set From Hell                 | TARGET                         | No implemented controlled professional-pressure simulation.                                                            |
| 60-Second Rescue              | RELATED DRAFT SUGGESTIONS ONLY | No time-bounded remedy experience or verified result.                                                                  |
| Three Takes Three Tactics     | TARGET                         | Three alternative initial tactics and one editable retake are not three distinct saved takes.                          |
| Unpredictable Partner         | TARGET                         | Current partner responses are fixed; no adaptive partner or live service.                                              |

This pass adds no curriculum, AI observation, media capture, multiplayer, diagnosis, assessment credentials, schema or new record model. Complete material and graduation requirements remain review-dependent across the eight schools/36 provisional terms. A rendered availability destination is verified as a gate, not upgraded to functional teaching/media/collaboration.

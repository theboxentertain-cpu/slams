# SLAMS navigation contract

Source: `SLAMS_Page_by_Page_Codex_Blueprint.docx` v1.0, SHA256 `407f1011d479bee731141f3cf0b76f797b075ac65e6840aead6797c94c4211da`. Audited from latest main `755f5ba`; page responsibilities and remaining mismatches are in the [47-page map](SLAMS-47-PAGE-TRACEABILITY.md).

## Five persistent destinations

| Label      | Route           | Owner / purpose                                                                            |
| ---------- | --------------- | ------------------------------------------------------------------------------------------ |
| Office     | `/`             | `DirectorsOffice`: cinematic home, room views, current work and physical entrances         |
| Schools    | `/conservatory` | `ConservatoryPage`: eight school structures and reviewed material where actually available |
| Rehearse   | `/rehearsal`    | `RehearsalHub`: authored scene, scene-library state and completed reflection history       |
| Work       | `/work`         | `WorkHub`: existing audition preparation; professional tools have explicit availability    |
| Stuck Desk | `/stuck`        | `StuckIntake`: authored draft suggestions and real rehearsal entry                         |

`AppShell` is the sole persistent navigation owner; `PRIMARY_NAVIGATION` in `src/lib/foundation.ts` owns the five-item definition. Cinematic welcome routes intentionally omit the studio bar. Office, Schools and Rehearse do not create more original product worlds: the three worlds are Conservatory, Actor at Work and Stuck Desk, with rehearsal shared across them. All nine original sections remain architectural responsibilities.

## Actual Office object map

| Object / room control                    | Actual destination                                              | Page contract / boundary                                                    |
| ---------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Eight school books                       | `SchoolBooks` dialog → selected canonical school or all schools | P08 → P12/P11; focus restores on close                                      |
| Director figure                          | `CoachPanel` dialog → `/director`                               | P07/P45 share one Director identity and mode store                          |
| Desk clapperboard                        | `/scene`                                                        | P23/P24 authored demonstration                                              |
| Rehearsal sign / doorway entrance        | `/rehearsal`                                                    | P21 hub                                                                     |
| Casting sign / casting board             | `/work`                                                         | P31; wall view also accessible with Office room tabs                        |
| Annotated screenplay                     | `/stuck`                                                        | P38/P40 draft interventions                                                 |
| Work Wall technique diagram              | `/matrix`                                                       | P20, explicitly unavailable reviewed comparisons                            |
| Portfolio                                | `/passport`                                                     | P43 actual reflection records                                               |
| Progress sheet / bell                    | `/progress`                                                     | P44 genuine recorded activity; unknown is not zero                          |
| Corner mirror                            | `/baseline`                                                     | P05 optional availability/introduction                                      |
| Corner camera                            | `/lab`                                                          | P29 unavailable capture/comparison; no Record action                        |
| Corner empty chair                       | `/lounge`                                                       | P30 unavailable partner service; no fake participants                       |
| Work Wall scene/character notes          | `/work`                                                         | P31 supported workspace; distinct P34/P35 context is still a gap            |
| Desk / Work Wall / Rehearsal Corner tabs | Same `/` route and explicit room panels                         | P06/P09/P10; optional session-local view restoration, no invented room URLs |

The existing illustrated objects, room views, artwork and hit regions are preserved by this PR. Existing broad browser checks verify keyboard/touch routing, three room views, modal focus restoration and accessibility targets. No new illustration is required for a route or contract number.

## Consolidation and contextual systems

| System / responsibility           | Actual UI form                                                      | Context / remaining boundary                                                                |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Baseline P05                      | `/baseline` availability route; `?flow=welcome` introduction        | Optional welcome / mirror; no working acting diagnostic                                     |
| Performance Lab P29               | `/lab` availability route                                           | Camera / rehearsal Sessions; actual media pipeline required                                 |
| Technique Matrix P20              | `/matrix` availability route                                        | Work Wall / supporting menu; reviewed comparisons and safe active-scene round trip required |
| Rehearsal Lounge P30              | `/lounge` availability route                                        | Empty chair / rehearsal Sessions; partner service required                                  |
| Passport / Journey P28/P43/P44    | Scene save confirmation, `/passport` record list and `/progress`    | Actual records, explicit import and eligible published-unit resume; no inferred mastery     |
| Director / Master's Chair P07/P45 | Office modal and `/director`; existing inline modes now in `/scene` | One illustrated identity, ON/QUIET/OFF, silent takes; no observation service                |

P21/P22 share the Rehearsal Hub. P23–P28 share the existing Scene state machine; the saved record is also rendered in Passport. P31/P33 share one actual preparation summary, not a fictional multi-audition database. P38/P40 share the authored suggestion list. These are deliberate consolidations, not missing page IDs. Requirements absent within them remain FAIL/BLOCKED in the machine map.

All ten signature experiences belong inside these tasks. Living Scene is partially implemented. Unpredictable Director, Listening Trap, Bullsh*t Detector, No Tears Required, Do the Damn Note, Set From Hell, 60-Second Rescue, Three Takes Three Tactics and Unpredictable Partner remain contextual target experiences with the prerequisites stated in the [truth matrix](SLAMS-FEATURE-TRUTH-MATRIX.md). They do not add global tabs.

## Deep links, returns and preserved state

- `/stuck/intervention?tab=principles` and `?tab=exercises` redirect deliberately to `/stuck?tab=describe`; do not resurrect the duplicate suggestion pages.
- Existing support-page `?tab=` values are parsed for compatibility without rendering enabled unavailable controls. Character, breakdown, self-tape, journal, diagnosis, retry and saved-fix URLs remain honest availability destinations.
- Published-unit routes are reused across P15–P18. Invalid schools/years/terms/kinds/IDs fail safely. A link cannot establish reviewed publication or eligible progress.
- Welcome retains P01 → P02 Account Choice from this newer blueprint. The unmerged PR B direct-entry branch is not the base of this PR. Guest/account setup and Office skip remain optional; the layered first-use hierarchy remains an audited mismatch.
- Scene P26 → exercise → retake and P27 → Practice again preserve tactic, intervention, exercise, retake and reflection input in the same mounted flow. Leaving via the explicit unsaved Hub exit discards that in-memory rehearsal and creates no record. No autosave or draft resume is claimed.
- Confirmed scene save P28 now offers Passport, repeat scene and Hub. Failures remain failures; pending saves hide conflicting unsaved/retry actions.
- Settings P46 now reaches Help P47 directly from every tab. Help has canonical Train/Rehearse/Work/Get Unstuck actions and retains real scene/Passport/settings links.

Known return gaps remain: school Year/Term header Back skips an immediate parent despite correct inline parent links; Matrix/intervention and professional-rehearsal context round trips are absent; persistent stable scene/session/objective linkage is incomplete. Navigation coverage does not close these contracts.

## Shared engines and identity

Living Scene stages remain **Explore → Perform → Intervene → Practice → Retake → Reflect → Save**, with optional unsaved continuation. Current `Stay` responses and obstacles remain authored and unchanged. The target requires stable scene/session/objective/tactic context across sections; current records do not implement that full contract.

The Actor Development Engine remains a partial foundation: existing owner-scoped record stores, reviewed publication/ancestor guards and eligible-unit resume. It must eventually connect practice evidence, assessment and appropriate advancement without inventing competence. Keep the canonical eight schools and 36 provisional terms; full legitimate curricula require reviewed material.

`SessionProvider` remains the identity owner. No new auth, cache, progress or storage owner, schema, credential, provider, database mutation or silent import is introduced. Live email, independently confirmed accounts, deployed RLS and cross-device imports remain external verification gates.

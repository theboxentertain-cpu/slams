# SLAMS — 47-page traceability

Source: **SLAMS_Page_by_Page_Codex_Blueprint.docx v1.0**, SHA256 `407f1011d479bee731141f3cf0b76f797b075ac65e6840aead6797c94c4211da`. Base: latest fetched main `755f5ba`; branch `feat/blueprint-page-contracts`.

Page IDs are functional responsibilities. Shared routes, tabs, dialogs and scene stages are deliberate consolidation. No extra route is created for numbering. The machine-readable [map](SLAMS-47-PAGE-MAP.json) retains every supplied layout, required click and acceptance condition alongside actual owners and outgoing interactions.

**Coverage PASS: 47/47. Full contract compliance FAIL. Commercial readiness BLOCKED.** A source-audit PASS is limited to supported/disclosed capabilities. Browser PASS proves the stated surface/click check, not complete target functionality, educational review or live cloud behavior. Unit evidence paths are related test sources, not a claim that every target requirement is tested.

| ID / page | Route / view / actual owner | Functionality / contract result | Primary action / reachable entrance | Browser case / result | Open requirement |
| --- | --- | --- | --- | --- | --- |
| P01 — Cinematic Welcome | `/welcome` · route · WelcomeLanding | PARTIAL / FAIL | Enter the Studio → /welcome/account; from P01 fresh / or /welcome | BP-P01 / PASS | Dominant entry follows books/features; short first-action hierarchy still needs work. |
| P02 — Account Choice | `/welcome/account` · route · WelcomeAccount | PARTIAL / FAIL | Explore as Guest → /welcome/setup; from P01 Enter the Studio | BP-P02 / PASS | Account choice omits an explicit explanation that signing in does not automatically import browser records. |
| P03 — Authentication | `/auth` · route · AccountForm / Auth / ResetPassword | PARTIAL / BLOCKED | Sign in / Create account / Send reset link; from P01/P02/P46 account links | BP-P03 / PASS | Live confirmation, callback-error handling, recovery and independent account transitions require live verification. |
| P04 — Meet the Actor | `/welcome/setup` · route · ActorSetupPage | PARTIAL / FAIL | Continue to Baseline → /baseline?flow=welcome; from P02 guest/auth continuation | BP-P04 / PASS | Training goes through another optional introduction; no direct training or Office skip on this page. |
| P05 — Actor’s Baseline | `/baseline` · gated-route · BaselineWelcome / SupportPage | GATED / BLOCKED | Skip to a first rehearsal → /scene; from P04 welcome flow or P10 mirror | BP-P05 / PASS | Practical diagnostic tasks and justified development pathways unavailable; welcome variant is an introduction only. |
| P06 — Main Director’s Office | `/` · route · DirectorsOffice | WORKING / PASS | Start rehearsal → /scene; visible book/work entrances; from P02 skip; persistent Office; remembered entry | BP-P06 / PASS | No additional gap in bounded implemented/disclosed responsibility. |
| P07 — The Director / Master’s Chair | `/director` · route/modal · CoachPanel / Director | PARTIAL / BLOCKED | Meet the Director and explore controls → /director; from P06 Director figure; profile menu | BP-P07 / PASS | Contextual reviewed-lesson explanation and intervention task binding are not implemented. |
| P08 — Conservatory Bookcase | `/` · modal · SchoolBooks | PARTIAL / FAIL | Open selected school → /conservatory/$school; from P06 eight-book button; P01 book collection | BP-P08 / PASS | Eight canonical books, term metadata and focus restoration work; per-school short descriptions and individual availability indicators are absent from the dialog. |
| P09 — Work Wall | `/` · subview · WorkWall | PARTIAL / BLOCKED | Actor at Work → /work; from P06 Work wall tab/swipe | BP-P09 / PASS | Character/script notes currently open Work, rather than distinct character/breakdown tools; gated tools remain disclosed. |
| P10 — Rehearsal Corner | `/` · subview · RehearsalCorner | PARTIAL / FAIL | Step onto the stage → /scene; from P06 Rehearsal corner tab/swipe | BP-P10 / PASS | Mirror/camera/chair and the scene-stage entrance work; the specified corner clapper/doorway Hub entrance is absent. |
| P11 — Conservatory Library | `/conservatory` · route/tab · ConservatoryPage | PARTIAL / FAIL | Select school → /conservatory/$school; from primary Schools; P08 all schools; P47 Train | BP-P11 / PASS | In Progress filters school books rather than directly resuming an eligible unit; whole-school completion criteria/live reviewed material remain unavailable. |
| P12 — Individual School Overview | `/conservatory/$school` · route/tab · SchoolPage | PARTIAL / BLOCKED | Explore the curriculum structure; from P08/P11 selected book | BP-P12 / PASS | Historical/philosophical teaching and cautions are absent pending reviewed material. |
| P13 — School Year | `/conservatory/$school/years/$year` · route · YearPage | PARTIAL / FAIL | Select Term → term route; from P12 curriculum year | BP-P13 / PASS | Reviewed goals/prerequisites absent; header back skips school while inline return preserves it. |
| P14 — Term Dashboard | `/conservatory/$school/years/$year/terms/$term` · route · TermPage | PARTIAL / FAIL | Select actual available course; from P13 term; P12 curriculum term | BP-P14 / PASS | Reviewed outcomes/prerequisites/advancement absent; primary back skips Year; direct exercise/assessment lists absent. |
| P15 — Course / Workshop | `/conservatory/$school/units/$kind/$unitId` · gated-route · UnitPage / CurriculumUnit (course/workshop) | REVIEW-DEPENDENT / BLOCKED | Open reviewed child unit when available; from P14 actual catalog course; P15 workshop child | BP-P15 / BLOCKED | No independently reviewed course/workshop supplied or live catalog verified. |
| P16 — Individual Lesson | `/conservatory/$school/units/$kind/$unitId` · gated-route · UnitPage / CurriculumUnit (lesson) | REVIEW-DEPENDENT / BLOCKED | Start unit / reviewed exercise child if supplied; from P15 actual reviewed lesson | BP-P16 / BLOCKED | Reviewed six-section lessons, source/rights and next/contextual Director links are not supplied. |
| P17 — Practical Exercise | `/conservatory/$school/units/$kind/$unitId` · gated-route · UnitPage / CurriculumUnit (exercise) | REVIEW-DEPENDENT / BLOCKED | Start unit / Mark complete only if eligible; from P12 Practice; P16 real reviewed child | BP-P17 / BLOCKED | Reviewed exercise runner, linked scene/evidence/reflection integration unavailable; do not invent material. |
| P18 — Term Assessment | `/conservatory/$school/units/$kind/$unitId` · gated-route · UnitPage / CurriculumUnit (assessment) | REVIEW-DEPENDENT / BLOCKED | Eligible reviewed task only; from P12 Assessments; actual catalog child | BP-P18 / BLOCKED | Reviewed assessment tasks, rubrics, evidence submission and advancement unavailable. |
| P19 — School Progress | `/conservatory/$school` · tab · SchoolPage / TrainingSummary | PARTIAL / FAIL | Continue training only for eligible started unit; from P12 Progress tab | BP-P19 / PASS | School evidence link to P43 is indirect through Progress; complete reviewed school pathway not verified live. |
| P20 — Technique Matrix | `/matrix` · gated-route · SupportPage (matrix) | GATED / BLOCKED | Explore the schools → /conservatory; from P09 diagram; profile menu | BP-P20 / PASS | Reviewed comparisons and safe active-scene return/context not implemented. |
| P21 — Rehearsal Hub | `/rehearsal` · route/tab · RehearsalHub | WORKING / PASS | Start rehearsal → /scene; from primary Rehearse; P06 studio; P47 Rehearse | BP-P21 / PASS | No additional gap in bounded implemented/disclosed responsibility. |
| P22 — My Scenes / Scene Library | `/rehearsal` · route/subview · RehearsalHub / ContextualRehearsal | PARTIAL / BLOCKED | Select Stay / Start rehearsal → /scene; from P21 My Scenes tab | BP-P22 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P23 — Scene Briefing | `/scene` · subview · Scene (explore) | PARTIAL / FAIL | Begin take → tactic selection; from P21/P22 Start rehearsal; Office clapper | BP-P23 / PASS | Objective/roles are fixed authored circumstances; no preparable objective/technique or persistent scene/session context contract. |
| P24 — Living Scene | `/scene` · route/subview · Scene (perform/response) | PARTIAL / FAIL | Choose tactic → authored response; from P23 Begin take; P26 retake context | BP-P24 / PASS | Inline Director modes now available; stable scene/session/objective persistence is still missing. |
| P25 — Director Intervention | `/scene` · subview · Scene (intervene/practice) | PARTIAL / FAIL | Choose technique; exercise → retake; from P24 Cut — call an intervention | BP-P25 / PASS | No change-technique via Matrix or in-flow return to take; context round trip absent. |
| P26 — Retake Studio | `/scene` · subview · Scene (retake) | PARTIAL / BLOCKED | Cut — end take → reflection; from P25 completed exercise | BP-P26 / PASS | Three distinct takes and captured comparison remain unsupported. |
| P27 — Reflection & Review | `/scene` · subview · Scene (reflect) | PARTIAL / BLOCKED | Save to Passport; from P26 Cut — end take | BP-P27 / PASS | Eligible next-exercise navigation requires reviewed available material and is not implemented; summary, repeat, save and Hub return are verified working subsets. |
| P28 — Rehearsal Record | `/scene` · route/subview · Scene saved / contextual rehearsal record | PARTIAL / BLOCKED | Open Passport → /passport; from P27 successful save; P43 saved record list | BP-P28 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P29 — Performance Lab | `/lab` · gated-route · SupportPage (lab) | GATED / BLOCKED | Run a text-only take → /scene; from P10 camera; P21 Sessions; profile menu | BP-P29 / PASS | Capture/playback/comparison/annotation storage and media permissions unavailable. |
| P30 — Rehearsal Lounge | `/lounge` · gated-route · SupportPage (lounge) | GATED / BLOCKED | Rehearse solo → /scene; from P10 chair; P21 Sessions; profile menu | BP-P30 / PASS | Partner service, invitations, shared scenes/sessions and moderation unavailable. |
| P31 — Professional Workspace | `/work` · route · WorkHub | WORKING / PASS | Open audition preparation → /work/audition?tab=preparation; from primary Work; P06 casting; P09; P47 Work | BP-P31 / PASS | No additional gap in bounded implemented/disclosed responsibility. |
| P32 — Audition Workspace | `/work/audition` · route/subview · AuditionFile / AuditionWorkspace / AuditionFiles | PARTIAL / BLOCKED | Save audition prep; from P31 preparation; profile/context links | BP-P32 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P33 — Auditions List | `/work` · route/subview · WorkHub / AuditionFiles / useActorAuditions | PARTIAL / BLOCKED | Open current audition preparation; from P31 saved/current preparation | BP-P33 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P34 — Human / Character Laboratory | `/work/character` · route/subview · ActorProjectDetail (character) | PARTIAL / BLOCKED | Open audition preparation → /work/audition; from P31 planned-tools availability; legacy links | BP-P34 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P35 — Scene Breakdown | `/work/breakdown` · route/subview · ActorProjectDetail (breakdown) / ActorSidesPage | PARTIAL / BLOCKED | Rehearse the demonstration scene → /scene; from P31 planned-tools availability; legacy links | BP-P35 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P36 — Self-Tape Studio | `/work/self-tape` · gated-route · SupportPage (selfTape) | GATED / BLOCKED | Run a text-only take → /scene; from P31 planned-tools availability; legacy links | BP-P36 / PASS | Preparation checklist and camera/capture/storage/playback/export pipeline unavailable. |
| P37 — Project Journal | `/work/journal` · route/subview · ActorJournal / useActorJournal | PARTIAL / BLOCKED | Open saved reflections → /passport; from P31 planned-tools availability; legacy links | BP-P37 / PASS | Implemented in source with owner and context guards; new production schema remains unapplied. Real production persistence, recovery and physical Android acceptance remain unverified. |
| P38 — Stuck Desk Home | `/stuck` · route · StuckIntake / DraftInterventions | PARTIAL / BLOCKED | Try the Living Scene; expand authored suggestion; from primary Stuck Desk; P06 script; P09; P47 Get Unstuck | BP-P38 / PASS | Saved intake/issue classification and saved-fix history unavailable; no observed diagnosis. |
| P39 — Identify the Problem | `/stuck/diagnosis` · gated-route · SupportPage (diagnosis) | GATED / BLOCKED | Explore existing draft interventions → /stuck; from Legacy bookmarked diagnosis; contextual availability | BP-P39 / PASS | Transparent validated diagnostic/evidence rules and persistent scene-specific intake unavailable. |
| P40 — Intervention Desk | `/stuck/intervention` · redirect/subview · DraftInterventions / intervention redirect | PARTIAL / BLOCKED | Practice in the scripted demonstration → /scene; from P38 authored issue option; legacy intervention redirect | BP-P40 / PASS | Suggestions pending faculty review; no time-bounded rescue, linked retry or saved remedy. |
| P41 — Retry & Compare | `/stuck/retry` · gated-route · SupportPage (retry) | GATED / BLOCKED | Try the Living Scene → /scene; from Legacy retry bookmark | BP-P41 / PASS | Linked prior/new attempt comparison and saved solutions unavailable. |
| P42 — Saved Fixes | `/stuck/saved` · gated-route · SupportPage (fixes) | GATED / BLOCKED | Open rehearsal records → /passport; from Legacy saved-fixes bookmark | BP-P42 / PASS | No saved problem/remedy history; Passport entries are not inferred fixes. |
| P43 — Actor’s Passport | `/passport` · route/tab · Passport | PARTIAL / FAIL | Read saved reflection / Start rehearsal when empty; from P28 saved; Office portfolio; profile; P47 | BP-P43 / PASS | Portfolio/badges/evidence uploads unavailable; direct Progress and reviewed-unit evidence links absent; live cloud boundary unverified. |
| P44 — My Actor’s Journey / Progress | `/progress` · route/tab · ProgressPage | PARTIAL / BLOCKED | Eligible unit resume or school/history review; from Office progress sheet/bell; P12 Progress; profile | BP-P44 / PASS | Reviewed mastery/advancement evidence unavailable; live owner-scope progression not independently verified. |
| P45 — Director Profile | `/director` · route · Director | WORKING / PASS | ON / QUIET / OFF preferences; Back to the work; from P07 coach panel; profile menu | BP-P45 / PASS | No additional gap in bounded implemented/disclosed responsibility. |
| P46 — Settings & Account | `/settings` · route/tab · SettingsPage | WORKING / PASS | Open account management / actual preferences; from Profile menu; P47 settings link | BP-P46 / PASS | No additional gap in bounded implemented/disclosed responsibility. |
| P47 — Help & Studio Guide | `/help` · route · Help | WORKING / PASS | Try the working, scripted Living Scene; from Profile menu | BP-P47 / PASS | No additional gap in bounded implemented/disclosed responsibility. |

## Actual click graph and evidence

### P01 — Cinematic Welcome

Owner: `src/components/welcome/WelcomePages.tsx`.

Actual outgoing actions: P02 account choice; P03 auth; P11/P21/P31/P38/P43 feature links; P06 Office.

Blueprint acceptance: On a new phone, a user immediately understands SLAMS and reaches the studio without mandatory explanatory tours.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P02 — Account Choice

Owner: `src/components/welcome/WelcomePages.tsx`.

Actual outgoing actions: P03 signup/signin; P04 guest/account continuation; P06 skip.

Blueprint acceptance: Guest mode cannot imply secure cloud persistence. Auth is optional for first demo unless security requires it.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P03 — Authentication

Owner: `src/components/welcome/AccountForm.tsx`, `src/routes/auth.tsx`, `src/routes/reset-password.tsx`, `src/lib/session.ts`.

Actual outgoing actions: P04 welcome auth continuation; P06 ordinary auth; recovery /reset-password.

Blueprint acceptance: No invented confirmation. Actual security and live email flow are separately verified.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P04 — Meet the Actor

Owner: `src/components/welcome/WelcomePages.tsx`.

Actual outgoing actions: P05 continue/skip; P02 back.

Blueprint acceptance: Input only changes supported routing/preferences. No fabricated personalized training advice.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P05 — Actor’s Baseline

Owner: `src/routes/baseline.tsx`, `src/components/welcome/WelcomePages.tsx`, `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P24 rehearsal; welcome variant P11/P31/P06.

Blueprint acceptance: When true baseline tasks are absent, show a transparent introduction and real rehearsal link; no fake score or diagnosis.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P06 — Main Director’s Office

Owner: `src/components/office/DirectorsOffice.tsx`.

Actual outgoing actions: P07 coach dialog; P08 books; P09/P10 room views; P21/P24 rehearsal; P31 work; P38 script; P43/P44 records.

Blueprint acceptance: Every physical object has an accessible name, meaningful target and no tappable obstruction. Last room view may restore; core routing works without swipe.

Baseline contract result: **PASS**; current result: **PASS**.

### P07 — The Director / Master’s Chair

Owner: `src/components/office/CoachPanel.tsx`, `src/routes/director.tsx`.

Actual outgoing actions: P45 Director profile; ON/QUIET/OFF; P06 close with focus restoration.

Blueprint acceptance: Do not infer acting quality from record counts. Never present fictional observation as measured coaching.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P08 — Conservatory Bookcase

Owner: `src/components/office/SchoolBooks.tsx`.

Actual outgoing actions: P12 eight canonical school links; P11 all schools; P06 close/focus restore.

Blueprint acceptance: All eight are accessible, distinct and point to their real school slugs; no fake published units.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P09 — Work Wall

Owner: `src/components/office/WorkWall.tsx`.

Actual outgoing actions: P31 work; P43 Passport; P20 Matrix; P38 Stuck; P44 progress; desk tab.

Blueprint acceptance: All destinations clearly indicate real working features versus gated future tools.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P10 — Rehearsal Corner

Owner: `src/components/office/RehearsalCorner.tsx`.

Actual outgoing actions: P05 mirror; P29 camera; P30 chair; P24 stage; P06 desk tab.

Blueprint acceptance: No fake recording or live partners. Scene entry preserves task context.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P11 — Conservatory Library

Owner: `src/components/foundation/SchoolPages.tsx`, `src/lib/training.ts`.

Actual outgoing actions: P12 selected school; In Progress/Completed tabs; P06 back.

Blueprint acceptance: Counts and completion statements must come from reviewed eligible data, not static curriculum outline.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P12 — Individual School Overview

Owner: `src/components/foundation/SchoolPages.tsx`.

Actual outgoing actions: P13/P14 curriculum links; P17 practice; P18 assessments; P19 progress; P11 back; P24 demo.

Blueprint acceptance: Canonical eight school names/slugs, provisional terms and honest reviewed-content gates are preserved.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P13 — School Year

Owner: `src/components/foundation/SchoolPages.tsx`.

Actual outgoing actions: P14 terms; P12 inline curriculum return; P11 header back.

Blueprint acceptance: No invented prerequisites or fabricated year-level educational promises.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P14 — Term Dashboard

Owner: `src/components/foundation/SchoolPages.tsx`.

Actual outgoing actions: P15 actual course links if catalog exists; P13 inline Year return; P11 header back.

Blueprint acceptance: No link claims a unit exists unless it resolves to reviewed and published data.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P15 — Course / Workshop

Owner: `src/components/foundation/SchoolPages.tsx`, `src/components/CurriculumUnit.tsx`.

Actual outgoing actions: P16/P17 real children if supplied; curriculum parents; P14 term; P12 school.

Blueprint acceptance: Unavailable material is not replaced by invented “authoritative” teaching.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P16 — Individual Lesson

Owner: `src/components/CurriculumUnit.tsx`, `src/components/foundation/SchoolPages.tsx`.

Actual outgoing actions: P17 children if supplied; published progress; ancestor/term/school links.

Blueprint acceptance: Publication and educational-review rules enforced server-side; no unsourced certification claims.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P17 — Practical Exercise

Owner: `src/components/CurriculumUnit.tsx`, `src/components/foundation/SchoolPages.tsx`.

Actual outgoing actions: Parent curriculum links and signed-in eligible unit progress.

Blueprint acceptance: Never mark unreviewed exercise complete or infer competency from clicking a button.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P18 — Term Assessment

Owner: `src/components/CurriculumUnit.tsx`, `src/components/foundation/SchoolPages.tsx`.

Actual outgoing actions: Parent curriculum and published progress controls when eligible.

Blueprint acceptance: No fake pass/fail, accreditation, mastery score or school graduation.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P19 — School Progress

Owner: `src/components/foundation/SchoolPages.tsx`, `src/components/foundation/TrainingSummary.tsx`.

Actual outgoing actions: P16/P17 eligible resume; P44 detailed progress; P12 other school tabs.

Blueprint acceptance: Owner-scoped queries, truthful loading/error, stable resume logic and no cross-account data leakage.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P20 — Technique Matrix

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P11 available school structure; P11 back.

Blueprint acceptance: Only published reviewed comparisons are usable; do not treat techniques as interchangeable.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P21 — Rehearsal Hub

Owner: `src/components/foundation/WorkspacePages.tsx`.

Actual outgoing actions: P22 My Scenes; P23 scene briefing; P43 history; P29/P30 Sessions links; P06 back.

Blueprint acceptance: First practice reachable in one or two deliberate actions, no forced feature tour.

Baseline contract result: **PASS**; current result: **PASS**.

### P22 — My Scenes / Scene Library

Owner: `src/components/foundation/WorkspacePages.tsx`, `src/components/foundation/ContextualRehearsal.tsx`, `src/lib/use-actor-rehearsals.ts`.

Actual outgoing actions: P23 scripted scene; New Scene truthful gate; P21 tabs.

Blueprint acceptance: Scripted scenes labeled scripted; personal-scene creation stays gated until real storage exists.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P23 — Scene Briefing

Owner: `src/routes/scene.tsx`.

Actual outgoing actions: P24 tactic choice; P21 back.

Blueprint acceptance: Inputs persist across the immediate rehearsal flow; no pretending a goal was diagnosed.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P24 — Living Scene

Owner: `src/routes/scene.tsx`.

Actual outgoing actions: P25 intervention; Director ON/QUIET/OFF inline; P21 header back.

Blueprint acceptance: All authored branches work. No claim of live improvising partner or AI observation without service.

Baseline contract result: **FAIL**; current result: **FAIL**. Inline existing ON/QUIET/OFF controls now use the sole preference owner; takes remain silent.

### P25 — Director Intervention

Owner: `src/routes/scene.tsx`.

Actual outgoing actions: P26 Go to retake after actor input; P21 header back.

Blueprint acceptance: A note must cite authored rules or actual actor input; no arbitrary grading.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P26 — Retake Studio

Owner: `src/routes/scene.tsx`.

Actual outgoing actions: P27 reflection; P25 Back to exercise; inputs retained; P21 header back.

Blueprint acceptance: Retakes produce distinct evidence where capture exists; no fake video/media.

Baseline contract result: **FAIL**; current result: **BLOCKED**. Earlier tactic/intervention/exercise note now shown; Back to exercise preserves all input.

### P27 — Reflection & Review

Owner: `src/routes/scene.tsx`.

Actual outgoing actions: P28 confirmed save; P26 Practice again; inputs retained; P21 Return to rehearsal without saving.

Blueprint acceptance: Separate self-report from verified behavior; never create skill score with no rubric.

Baseline contract result: **FAIL**; current result: **BLOCKED**. Choice/response/retake summary, Practice again and explicit unsaved Hub exit now work; no competence claim.

### P28 — Rehearsal Record

Owner: `src/routes/scene.tsx`, `src/routes/passport.tsx`, `src/components/foundation/ContextualRehearsal.tsx`.

Actual outgoing actions: P43 Open Passport; P23 Rehearse again; P21 Return to the rehearsal studio.

Blueprint acceptance: Owner-scoped save survives authentic reload/login; signed-out local storage disclosed.

Baseline contract result: **FAIL**; current result: **BLOCKED**. Explicit saved confirmation → Rehearsal Hub action added; confirmed saves remain required.

### P29 — Performance Lab

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P24 supported demo; P21 back.

Blueprint acceptance: Do not expose working Record/Export controls without actual device capture, permissions, storage and playback.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P30 — Rehearsal Lounge

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P24 supported demo; P21 back.

Blueprint acceptance: Never simulate real users, matchmaking or live sessions.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P31 — Professional Workspace

Owner: `src/components/foundation/WorkspacePages.tsx`.

Actual outgoing actions: P32 current prep; P33 current single saved role summary; P34/P35/P36/P37 availability disclosure; P06 back.

Blueprint acceptance: No redundant dashboard shell; real audition prep is the anchor workflow.

Baseline contract result: **PASS**; current result: **PASS**.

### P32 — Audition Workspace

Owner: `src/components/foundation/AuditionWorkspace.tsx`, `src/components/foundation/AuditionFiles.tsx`, `src/components/foundation/WorkspacePages.tsx`.

Actual outgoing actions: Brief/Script/Character/Preparation tabs; P31 back; explicit import.

Blueprint acceptance: Existing user notes preserved, no phantom autosave or lost edits on tab changes.

Baseline contract result: **FAIL**; current result: **BLOCKED**.

### P33 — Auditions List

Owner: `src/components/foundation/WorkspacePages.tsx`, `src/components/foundation/AuditionFiles.tsx`, `src/lib/use-actor-auditions.ts`.

Actual outgoing actions: P32 current record; P31 workspace.

Blueprint acceptance: Do not fabricate audition deadlines or records.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P34 — Human / Character Laboratory

Owner: `src/components/foundation/ActorProjectDetail.tsx`, `src/lib/use-actor-projects.ts`.

Actual outgoing actions: P32 existing prep; P31 back.

Blueprint acceptance: No psychological diagnosis or made-up saved character file until actual persistence exists.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P35 — Scene Breakdown

Owner: `src/components/foundation/ActorProjectDetail.tsx`, `src/components/foundation/ActorSidesPage.tsx`, `src/lib/use-actor-sides.ts`.

Actual outgoing actions: P24 supported demo; P31 back.

Blueprint acceptance: No fake script ingestion, annotation storage or scene analysis.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P36 — Self-Tape Studio

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P24 supported demo; P31 back.

Blueprint acceptance: If camera pipeline is absent, only the preparation section is available. No inert record control.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P37 — Project Journal

Owner: `src/components/foundation/ActorJournal.tsx`, `src/lib/use-actor-journal.ts`.

Actual outgoing actions: P43 existing records; P31 back.

Blueprint acceptance: Do not imply projects or revision history are saved before implementing storage.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P38 — Stuck Desk Home

Owner: `src/components/foundation/WorkspacePages.tsx`.

Actual outgoing actions: P40 inline suggestions; P24 scripted practice; P06 back.

Blueprint acceptance: First usable intervention must not require multiple empty tab pages.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P39 — Identify the Problem

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P38/P40 suggestions; P38 back.

Blueprint acceptance: No diagnosis claim unless a validated, transparent rule/evidence base supports it.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P40 — Intervention Desk

Owner: `src/components/foundation/WorkspacePages.tsx`.

Actual outgoing actions: P24 generic demo; P38 collapse; legacy route redirects to /stuck?tab=describe.

Blueprint acceptance: Existing draft suggestions retain faculty-review disclaimer; 60-Second Rescue lives here.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P41 — Retry & Compare

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P24 scripted rehearsal; P38 back.

Blueprint acceptance: Do not pretend an independent comparison is available without recorded or authored evidence.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P42 — Saved Fixes

Owner: `src/components/foundation/SupportPage.tsx`.

Actual outgoing actions: P43 actual unrelated rehearsal records with explicit disclosure; P38 back.

Blueprint acceptance: No inferred saved fixes from unrelated Passport data.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P43 — Actor’s Passport

Owner: `src/routes/passport.tsx`, `src/lib/store.ts`.

Actual outgoing actions: P28 rendered entry detail; P24 empty-state practice; explicit import/deletion; P06 back.

Blueprint acceptance: Badges and portfolio unavailable until earned/supported; no fake milestones.

Baseline contract result: **FAIL**; current result: **FAIL**.

### P44 — My Actor’s Journey / Progress

Owner: `src/components/foundation/ProgressPage.tsx`, `src/lib/training.ts`.

Actual outgoing actions: P16/P17 eligible resume; P43 reflections; P12 schools; P06 back.

Blueprint acceptance: No invented mastery, badges, completion percentages or qualifications.

Baseline contract result: **BLOCKED**; current result: **BLOCKED**.

### P45 — Director Profile

Owner: `src/routes/director.tsx`.

Actual outgoing actions: Mode controls; P24 scene; P06 header back/Office.

Blueprint acceptance: Character and voice must remain consistent; ability claims match implementation.

Baseline contract result: **PASS**; current result: **PASS**.

### P46 — Settings & Account

Owner: `src/components/foundation/SettingsPage.tsx`.

Actual outgoing actions: P03 account; P43 privacy records; P47 Help from all tabs; P06 back.

Blueprint acceptance: Avoid fake Arabic switches, fake social sign-in, dummy account deletion and unsupported privacy controls.

Baseline contract result: **FAIL**; current result: **PASS**. Direct Help entrance added from every settings tab; unavailable controls stay disclosed.

### P47 — Help & Studio Guide

Owner: `src/routes/help.tsx`.

Actual outgoing actions: P11 Train; P21 Rehearse; P31 Work; P38 Get Unstuck; P24 working scene; P43 records; P46 settings; P06 back.

Blueprint acceptance: Every help CTA resolves to a real functioning or transparently gated destination.

Baseline contract result: **FAIL**; current result: **PASS**. Train, Rehearse, Work and Get Unstuck task links now resolve to canonical destinations.

## Reproduce

`node scripts/audit-page-contracts.cjs --structure-only` validates all 47 owners, registered routes, test bindings, click targets and the single five-item navigation owner. `node scripts/audit-page-contracts.cjs` also returns a failing exit status for the remaining contract mismatches. This intentional FAIL must not be treated as completion. `--write-doc` regenerates this document from the map. See [release verification](SLAMS-RELEASE-VERIFICATION.md) for actual commands, screenshots, browser scope and external blockers.

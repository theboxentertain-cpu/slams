# SLAMS blueprint — release verification and first implementation

## 1. Source of truth and verdict

Latest main was fetched before work and checked again before publishing: **`755f5ba16ef9cd941be73af683c18f69d43ebc32`**, PR A #7 merged. Branch: **`feat/blueprint-page-contracts`**, created directly from that main. PR B is unmerged at audit time; its implementation/history is not used as the base. No published history is rewritten.

Governing attachment: **SLAMS_Page_by_Page_Codex_Blueprint.docx v1.0**, SHA256 **`407f1011d479bee731141f3cf0b76f797b075ac65e6840aead6797c94c4211da`**. All 47 original layouts, click contracts and acceptance statements are retained in the [machine map](SLAMS-47-PAGE-MAP.json). The numbered pages are responsibilities, not a demand for 47 new URLs.

**Traceability coverage PASS: 47/47. Full blueprint compliance FAIL. Commercial readiness BLOCKED — NOT YET COMMERCIALLY READY.** Rendering a gate is not implementing its feature. PASS for a browser surface is distinct from acceptance of the complete page contract.

| Source contract status | Main baseline | After this PR |
| ---------------------- | ------------- | ------------- |
| PASS                   | 4             | 6             |
| FAIL                   | 19            | 15            |
| BLOCKED                | 24            | 26            |

Exact P01–P47 owners, UI forms, entrances, CTAs, required/actual outgoing clicks, tests and blockers: [human traceability](SLAMS-47-PAGE-TRACEABILITY.md). Every registered rendered route is assigned; Outlet-only files are identified as layouts. P07/P45 share the Director, P21/P22 share the Hub, P23–P28 share Scene, P31/P33 share a single preparation summary, and P38/P40 share suggestions. No empty page is added for numbering.

## 2. Architectural mismatches

Source inspection was reported before runtime edits: consolidated owners already exist; reviewed content/media/multiplayer are gated; Scene lacked review context and input-preserving repeat/return actions; Help lacked task entrances and Settings lacked its Help link. Runtime ownership remains `AppShell` → one five-item bar, `SessionProvider` → identity, existing store/query functions → private persistence, server catalog and publication/ancestor guards → reviewed eligibility.

Remaining contract failures after the focused fixes:

| ID                          | Remaining mismatch                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01 — Cinematic Welcome     | Dominant entry follows books/features; short first-action hierarchy still needs work.                                                                             |
| P02 — Account Choice        | Account choice omits an explicit explanation that signing in does not automatically import browser records.                                                       |
| P04 — Meet the Actor        | Training goes through another optional introduction; no direct training or Office skip on this page.                                                              |
| P08 — Conservatory Bookcase | Eight canonical books, term metadata and focus restoration work; per-school short descriptions and individual availability indicators are absent from the dialog. |
| P10 — Rehearsal Corner      | Mirror/camera/chair and the scene-stage entrance work; the specified corner clapper/doorway Hub entrance is absent.                                               |
| P11 — Conservatory Library  | In Progress filters school books rather than directly resuming an eligible unit; whole-school completion criteria/live reviewed material remain unavailable.      |
| P13 — School Year           | Reviewed goals/prerequisites absent; header back skips school while inline return preserves it.                                                                   |
| P14 — Term Dashboard        | Reviewed outcomes/prerequisites/advancement absent; primary back skips Year; direct exercise/assessment lists absent.                                             |
| P19 — School Progress       | School evidence link to P43 is indirect through Progress; complete reviewed school pathway not verified live.                                                     |
| P23 — Scene Briefing        | Objective/roles are fixed authored circumstances; no preparable objective/technique or persistent scene/session context contract.                                 |
| P24 — Living Scene          | Inline Director modes now available; stable scene/session/objective persistence is still missing.                                                                 |
| P25 — Director Intervention | No change-technique via Matrix or in-flow return to take; context round trip absent.                                                                              |
| P28 — Rehearsal Record      | Stable scene/session/objective identifiers absent; live reload/login still unverified.                                                                            |
| P32 — Audition Workspace    | No context-bound rehearsal action; Script gated; one six-field record rather than linked professional workspace.                                                  |
| P43 — Actor’s Passport      | Portfolio/badges/evidence uploads unavailable; direct Progress and reviewed-unit evidence links absent; live cloud boundary unverified.                           |

The other blocked contracts retain their owner and next action while awaiting actual content, evidence, capture, partner services or live verification. The [map](SLAMS-47-PAGE-MAP.json) lists each one. This pass does not reinterpret absence as PASS or inflate a school outline into reviewed teaching.

## 3. Implemented first coherent improvements

| Changed behavior         | Before                                                               | After / reason                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P24 Director mode        | Mode preferences required leaving Scene                              | Existing ON/QUIET/OFF control is inline; existing performing silence remains enforced                                                                                    |
| P26 retake context       | Only the new obstacle and input; no in-flow exercise return          | Earlier tactic, selected intervention and exercise note are visible; Back to exercise retains the retake and exercise input                                              |
| P27 review / repetition  | Reflection prompt and Save only                                      | Summary shows actual tactic, fixed partner response, intervention, exercise, obstacle and actor retake; Practice again preserves reflection and edits the current retake |
| P27 optional save        | Generic page navigation, no explicit unsaved continuation            | Clear Hub exit explains discard and creates no record; conflicting unsaved/retry actions are hidden while saving                                                         |
| P28 saved return         | Passport and restart                                                 | Explicit Hub return added alongside Passport/restart; success still requires store confirmation                                                                          |
| P46/P47 guide navigation | Settings had no direct Help action; Help omitted the four task links | Help reachable from all four settings tabs; Train/Rehearse/Work/Get Unstuck resolve to canonical owners                                                                  |

The summary reports actor input and authored responses. It does not claim observation, improvement, a new teaching exercise, distinct captured takes or the Three Takes signature. Existing scene/intervention text, art, colors, fonts and data contracts are preserved. No new global tab, auth provider, record model, schema, dependency, media or multiplayer service is introduced.

## 4. Five actor journey outcomes and first action

| Journey                        | Result                                                                    | Evidence boundary                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A — Beginner discovers Meisner | BLOCKED reviewed learning                                                 | Eight schools/year/term navigation and safe unavailable-unit handling verified; no reviewed lesson supplied                             |
| B — Professional audition      | PASS preparation subset; FAIL full context-bound journey                  | Real guest note entry/tab retention/save/reload verified; dedicated character/breakdown and audition-to-scene context unavailable       |
| C — Actor stuck                | PASS authored suggestion subset; BLOCKED full diagnostic/fix loop         | Draft disclaimer, expansion, canonical redirect and real scene entrance work; diagnosis/linked retry/saved fixes unavailable            |
| D — Returning actor            | PASS guest return/record subset; BLOCKED live cloud/curriculum continuity | Office returns, actual reflection reloads, no fake completed-record resume; live account and reviewed next-unit path not verified       |
| E — Guest becomes account user | BLOCKED live                                                              | Existing explicit-import/account-isolation tests pass; mocks/read policy inspection are not independent confirmed accounts/deployed RLS |

[Detailed journeys](SLAMS-ACTOR-JOURNEYS.md). The fresh-context browser walkthrough reaches acting choices in **four activations** using Enter → Account Choice → Skip to Office → Start rehearsal → Begin take. It then completes the authored intervention/practice/retake/reflection and exits without a record. From Rehearsal Hub, two activations reach choices. The welcome hierarchy still requires improvement within the blueprint's Account Choice contract. **Human first-five-minutes/usability research NOT RUN**; browser automation is not a human completion-time or educational-value study.

## 5. Commands and actual results

| Command / check                                                                                       | Status                                            | Actual result                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline `npm test`                                                                                   | PASS                                              | 148 tests / 19 files, freshly run on fetched main                                                                                                                 |
| Baseline TypeScript / clean production build                                                          | PASS                                              | Independent commands completed                                                                                                                                    |
| Baseline full lint                                                                                    | FAIL                                              | 661 formatting errors / six warnings                                                                                                                              |
| Final `npm test`                                                                                      | PASS                                              | **163 tests / 19 files**, 15 added behavior cases                                                                                                                 |
| `node scripts/audit-page-contracts.test.cjs`                                                          | PASS                                              | **8 auditor checks**: missing/duplicate IDs, unregistered/orphan routes, nonexistent source, invalid click targets, sixth nav and false full-acceptance promotion |
| `npm exec tsc -- --noEmit`                                                                            | PASS                                              | Independent typecheck, no diagnostics                                                                                                                             |
| ESLint on all five changed TS/TSX and three new CJS files                                             | PASS                                              | No errors/warnings                                                                                                                                                |
| Prettier on changed source/CJS                                                                        | PASS                                              | No formatting failures                                                                                                                                            |
| Clean `npm run build`                                                                                 | PASS                                              | Stopped old worker, removed `.output`, rebuilt client/SSR/Nitro worker                                                                                            |
| `node scripts/audit-page-contracts.cjs --structure-only`                                              | PASS                                              | Exact 47 IDs, registered owners/click targets/test bindings and one actual five-item nav owner                                                                    |
| `node scripts/audit-page-contracts.cjs`                                                               | FAIL, intentional release gate                    | Remaining contract failures/blocked work are reported; exit 1 is preserved                                                                                        |
| Compiled `verify-blueprint.cjs`                                                                       | PASS for checks; four reviewed-page cases BLOCKED | **161 assertions; 47 cases: 43 bounded surface PASS, P15–P18 BLOCKED**; no auth/email request or uncaught page error                                              |
| Existing PR A / foundation / Office / welcome / shared-world browser scripts                          | PASS                                              | **140 / 336 / 115 / 147 / 449** assertions; zero uncaught page errors                                                                                             |
| Browser total                                                                                         | PASS for executed assertions                      | **1,348 checks**; page-surface checks do not close target acceptance gaps                                                                                         |
| Full `npm run lint`                                                                                   | FAIL                                              | **652 remaining formatting errors / six warnings**; no suppression or unrelated formatting sweep                                                                  |
| Standard `npm run preview -- --host 0.0.0.0 --port 3102`, actual root GET                             | FAIL                                              | HTTP 500: missing generated Node preview entry; separate from compiled-worker success                                                                             |
| Intended production hosting/runtime                                                                   | BLOCKED                                           | Local compatibility override is not actual production acceptance                                                                                                  |
| Live email/confirmation/recovery, two confirmed accounts, deployed RLS, cross-device cloud/imports    | BLOCKED                                           | No allowed live-account setup/credentials used; synthetic identities do not qualify                                                                               |
| Physical Android/TalkBack/OS scaling; manual human walkthrough; representative production performance | NOT RUN                                           | Browser emulation and screenshot inspection have a different scope                                                                                                |
| Merge / deployment / live database mutation                                                           | NOT RUN                                           | Explicitly excluded                                                                                                                                               |

Source audit retained reviewed/publication/ancestor checks in `training.ts`, `CurriculumUnit`, server functions and checked-in SQL policies/triggers. This pass **does not rerun a disposable RLS database** or claim deployed policies. Previous PR A database evidence is historical. No fake published catalog, assessment or user account was inserted into browser acceptance; P15–P18 use nonexistent synthetic IDs only to verify unavailable-unit safety.

Compiled browser execution used external Playwright, Chromium **154.0.8037.57** and Wrangler **4.156.0**, port 3101, temporary persistence outside the repo and **local-only compatibility override `2026-10-30`**. Installed workerd predates the generated `2026-11-02` date. Blocked metadata access uses local fallback `Request.cf`. Existing nonfatal bundler advisories remain. No preview shim or duplicate Vite plugin was added.

Reproduction:

```sh
npm test
npm exec tsc -- --noEmit
npm run build
node scripts/audit-page-contracts.test.cjs
node scripts/audit-page-contracts.cjs --structure-only
node scripts/audit-page-contracts.cjs # expected nonzero while contract gaps remain
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-blueprint-check \
node scripts/verify-blueprint.cjs
```

## 6. Evidence and exact files

Machine receipts: [page cases](../verification/blueprint/pages.json), [coverage/compliance audit](../verification/blueprint/audit.json), [PR A](../verification/blueprint/pr-a.json), [foundation](../verification/blueprint/foundation.json), [Office](../verification/blueprint/office.json), [welcome](../verification/blueprint/welcome.json), [shared studio](../verification/blueprint/studio-world.json), [command/source receipt](../verification/blueprint/checks.json).

Logs: [baseline tests](../verification/blueprint/baseline-tests.txt), [baseline lint](../verification/blueprint/baseline-lint.txt), [final tests](../verification/blueprint/tests.txt), [auditor tests](../verification/blueprint/audit-tests.txt), [build](../verification/blueprint/build.txt), [remaining lint](../verification/blueprint/lint.txt), [preview failure](../verification/blueprint/preview.txt). Terminal color/trailing blank lines are normalized and credential-like diagnostic literals redacted; counts are retained.

Actual screenshots:

- Retake: [before](../screenshots/blueprint/before-retake-mobile.png) → [after](../screenshots/blueprint/after-retake-mobile.png)
- Reflection: [before](../screenshots/blueprint/before-reflection-mobile.png) → [after](../screenshots/blueprint/after-reflection-mobile.png); [desktop](../screenshots/blueprint/after-reflection-desktop.png)
- Help: [before](../screenshots/blueprint/before-help-mobile.png) → [after](../screenshots/blueprint/after-help-mobile.png); [desktop](../screenshots/blueprint/after-help-desktop.png)
- Settings: [before](../screenshots/blueprint/before-settings-mobile.png) → [after](../screenshots/blueprint/after-settings-mobile.png)
- [Actual saved record](../screenshots/blueprint/after-passport-mobile.png)

Full-page screenshots retain the real fixed studio bar at the viewport edge; the article can be taller than that viewport. No control or artwork is hidden to manufacture a comparison. Browser checks cover 320/360/390/412 × 844 and 768/1440 × 1000, reflow, action touch sizes, keyboard access, modal focus restoration, enlarged root text, reduced motion, authored branches, real local persistence and explicit unsaved exit.

[Exact changed paths](SLAMS-BLUEPRINT-FILES.txt). Significant owners:

| Files                                                                               | Reason                                                                                                          |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/routes/scene.tsx`                                                              | Inline existing modes, actual review summary, retained-input repeat/back and explicit saved/unsaved Hub returns |
| `src/routes/help.tsx`, `src/components/foundation/SettingsPage.tsx`                 | Canonical task links and direct contextual Help entrance                                                        |
| `src/test/scene-regression.test.tsx`                                                | Nine tactic/intervention repeat-navigation cases and pending-save handling; existing failed-save retry retained |
| `src/test/architecture-cleanup.test.tsx`                                            | Guide route mapping and Help reachability across settings tabs; existing gated-route tests retained             |
| `scripts/audit-page-contracts.cjs`, its `.test.cjs`, `scripts/verify-blueprint.cjs` | Reproducible structural/contract audit, negative auditor checks and actual 47-case browser verification         |
| Required product documents / machine map / receipts / screenshots                   | Contract-to-code ownership, current truth, blockers, exact proof and review/rollback guidance                   |

## 7. Data/security impact, risk and rollback

Protected-source diff is empty for **`src/assets`, `src/data`, `src/lib`, `src/integrations`, `drizzle`, `supabase`, `package.json` and `package-lock.json`**. No record migration, content rewrite, provider, credential, dependency, database operation or new persisted field. Existing Passport and audition keys/schema remain. `SessionProvider` owns identity and query clearing; existing store/import owners retain account checks and verified readback before local cleanup.

Risks: Scene review is longer and requires scrolling on small displays. Practice again edits the current retake, with the prior reflection retained; it is not a new captured take or version history. Explicit unsaved exit intentionally discards in-memory input. Cross-route scene/professional context and stable session identity are still missing. Reviewed teaching, privacy/retention/rights, physical-device quality and live security remain open. This PR does not claim all page Back paths or all target engine behaviors are complete.

Rollback: revert this PR's commit(s), or its merge commit once owner-merged, through a history-preserving workflow. There is no schema/data transformation to reverse. Do not reset or rewrite published Lovable history. Concurrent PR B overlaps Scene/docs; reconcile against the then-current main rather than overwrite either branch blindly.

## 8. Review and next tasks

Create a review PR against main; do not merge or deploy. Branch and PR creation outcome are reported separately in the final delivery. GitHub API access may be restricted even when git push succeeds.

1. Review these first changes and the remaining 47-contract failures; reconcile independently merged entry work from refreshed main.
2. Shorten P01/P02/P04 entry hierarchy while respecting the latest blueprint's Account Choice/optional setup contract; improve bookcase/corner and school parent-return gaps without replacing art.
3. Design stable scene/session/objective and source-work linkage with compatibility, preservation, rollback and owner-isolation tests before connecting professional scripts, Matrix round trips or assessment evidence. No live schema mutation without the required review.
4. Supply independently reviewed Meisner material, rights, instructional sections and assessment criteria; verify a genuine learning journey before broader teaching claims.
5. Keep media, multiplayer, diagnostic/saved fixes and signatures gated until their required services/evidence exist. Resolve full lint, standard preview/runtime and physical-device issues in scoped changes.
6. Execute live confirmation/recovery, two independently confirmed accounts/deployed RLS, cloud saves/imports and production hosting checks when access is available; complete legal/privacy/retention/rights/support/commercial decisions before launch.

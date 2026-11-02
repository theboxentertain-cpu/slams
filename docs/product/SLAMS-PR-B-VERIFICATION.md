# PR B — First-Five-Minutes Experience

## Scope and baseline

PR B is ready for product/code review within its guest-browser verification boundary. Fresh visitors can enter a working scripted rehearsal directly; an account, profile and baseline assessment are optional. This is not a commercial-release or live-authentication approval.

Branch **`feat/pr-b-first-rehearsal`**, based on refreshed `main` **`755f5ba`**, the merge of **PR A #7**. PR A commit `93dc653` is an ancestor and its tree matches this baseline. No unapproved PR stack, history rewrite, new project or deployment is involved. The latest execution directive governs scope; [the checkpoint](README.md) links the earlier audit and product contract. PR C scene/Director quality and PR D deeper workflows remain separate.

Exact changed paths: [file inventory](SLAMS-PR-B-FILES.txt).

Owner clarification, 2026-11-02: the [product contract](SLAMS-PRODUCT-CONTRACT.md) now explicitly preserves all nine sections, both engines, the eight school durations and ten contextual signature experiences. Architecture/truth/checkpoint documents distinguish the final requirements from current implementation. This follow-up changes documentation only; the executed application verification below applies to the unchanged runtime source. Formatting, relative links, the complete file inventory and school counts are checked again for this clarification.

## Before and after

| Area              | Before                                                                                  | After / reason                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default entry     | Welcome → account choice → optional setup → baseline introduction → scene → Begin take  | Welcome → **Enter the Studio** → actual scene → **Begin take**. Five guided guest activations to choices become two; no mandatory account/profile/assessment.                                     |
| Entry hierarchy   | Eight books and five feature links preceded the main action; repeated promotional quote | Short task description and one primary CTA precede optional sign-in/settings/Office; books and feature links remain inside native exploration disclosure.                                         |
| Welcome progress  | Five-step counter implied a required onboarding sequence                                | Counter removed; optional destinations stay directly reachable.                                                                                                                                   |
| Setup             | Experience/goals questions stored preferences without changing immediate instruction    | Existing motion/sound controls only; immediate effect, no save gate. Earlier actor-setup data and namespace remain untouched.                                                                     |
| Optional account  | Account continuation and guest link led to setup                                        | Welcome sign-in, confirmed immediate signup, existing-session continuation and guest link lead to rehearsal. Ordinary account sign-in still returns to Office; SDK/callback contracts remain.     |
| Reflection        | Save action, plus generic page navigation                                               | Explicit **Continue to the Office without saving**, with discard explanation. It creates no record and is hidden while an explicit save is pending. Confirmed save/failure behavior is preserved. |
| Returning visitor | Office from entry preference, legacy records or actual session; direct links retained   | Same entry decision and data owners. Completed reflections remain records, not resumable drafts.                                                                                                  |

The task is the existing original **Stay** demonstration: circumstances/objective → tactic → fixed partner response → authored intervention → actor exercise → changed obstacle → retake → actor reflection. No new scene, AI observation, evaluation, score, reviewed curriculum or recording capability is introduced. Automated completion demonstrates that controls work; it does not establish teaching quality or human five-minute completion time.

## Executed verification

| Check                                                              | Actual result                                                                                                                                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refreshed baseline                                                 | 148 tests / 19 files pass; TypeScript and clean production build pass                                                                                                             |
| Final `npm test`                                                   | **155 tests / 20 files pass**                                                                                                                                                     |
| Final `npm exec tsc -- --noEmit`                                   | Pass                                                                                                                                                                              |
| ESLint on all eight changed TS/TSX files                           | Pass, no diagnostics                                                                                                                                                              |
| Prettier on changed source/CSS/browser scripts                     | Pass                                                                                                                                                                              |
| Clean `npm run build`                                              | Pass; generated output rebuilt after stopping the prior worker                                                                                                                    |
| First-use browser acceptance                                       | **75 checks**, two isolated complete journeys, no auth requests, zero uncaught page errors                                                                                        |
| Updated welcome compatibility                                      | **148 checks**, zero uncaught page errors; no signup/email requests                                                                                                               |
| Existing PR A / foundation / Office / shared studio browser suites | **140 / 336 / 115 / 449 checks**, zero uncaught page errors                                                                                                                       |
| Browser total                                                      | **1,263 checks** on compiled output in isolated guest contexts                                                                                                                    |
| Full repository lint                                               | **FAIL: 652 formatting errors, six warnings**; baseline was 661 errors / six warnings. Remaining diagnostics retained; no unrelated formatting sweep.                             |
| Full denial of `localStorage` getter                               | **FAIL, separately diagnosed**: existing auth storage adapter returns the application error page. Adapter is unchanged. Storage quota/write failure still allows first rehearsal. |
| Live confirmed-account/email/cross-device/deployed RLS             | Not run; guest checks and SDK mocks do not establish these                                                                                                                        |
| Physical Android/TalkBack and human completion-time research       | Not run; viewport emulation is separate evidence                                                                                                                                  |

New unit coverage checks direct entry, optional rehearsal entry during account loading/signed-in/signed-out states, effective settings with earlier records unchanged, ordinary versus welcome auth continuation, and pending-save handling for the new unsaved exit. Existing session isolation, failed imports, curriculum gates and failed-save retry tests still run.

Browser evidence includes entry visibility and 44px targets at **320/360/390/412 × 844** and **768/1440 × 1000**, keyboard entry, collapsed optional navigation, reduced motion, 844 × 390 landscape scrolling, enlarged root text, task disclosure, full practice/retake, confirmed local save/reload, unsaved continuation without a Passport write, returning Office, deep links, and compatibility with older actor-setup/Passport/audition records. The two automated journey timings in JSON are machine timings to reflection, not performance or human-use claims. Existing regression suites also cover the Office views, canonical routes, five-item navigation and supported Work workflows. The final first-use/welcome acceptance is rerun after the pending-save guard; the four unchanged broad scripts were run before that final guard.

## Evidence and reproduction

Results: [first use](../verification/pr-b/pr-b.json), [welcome](../verification/pr-b/welcome.json), [PR A](../verification/pr-b/pr-a.json), [foundation](../verification/pr-b/foundation.json), [Office](../verification/pr-b/office.json), [shared studio](../verification/pr-b/studio-world.json).

Logs: [baseline tests](../verification/pr-b/baseline-tests.txt), [baseline lint](../verification/pr-b/baseline-lint.txt), [final tests](../verification/pr-b/tests.txt), [build](../verification/pr-b/build.txt), [remaining lint](../verification/pr-b/lint.txt), [storage-denial diagnosis](../verification/pr-b/storage-denial.txt), [check receipt](../verification/pr-b/checks.json). Log trailing whitespace and terminal color codes are normalized; credential-like literals echoed by formatting diagnostics are redacted. Diagnostic counts are retained.

Actual compiled screenshots:

- Entry: [before mobile](../screenshots/pr-b/before-landing-mobile.png) → [after mobile](../screenshots/pr-b/after-landing-mobile.png); [before desktop](../screenshots/pr-b/before-landing-desktop.png) → [after desktop](../screenshots/pr-b/after-landing-desktop.png)
- Optional account: [before](../screenshots/pr-b/before-account-mobile.png) → [after](../screenshots/pr-b/after-account-mobile.png)
- Optional settings: [before](../screenshots/pr-b/before-setup-mobile.png) → [after](../screenshots/pr-b/after-setup-mobile.png)
- [Reflection exit](../screenshots/pr-b/reflection-mobile.png), [saved Passport](../screenshots/pr-b/passport-mobile.png), [returning Office](../screenshots/pr-b/returning-office-mobile.png), [landscape](../screenshots/pr-b/landing-landscape.png), [enlarged root text](../screenshots/pr-b/landing-enlarged-text.png)

Local browser reproduction (external Playwright/system Chromium; no package changes):

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-pr-b-check \
node scripts/verify-pr-b.cjs
```

The compiled worker was served with external **Wrangler 4.156.0**, port 3101, **local-only compatibility override `2026-10-30`** and temporary persistence outside the repo. Installed workerd predates the generated `2026-11-02` date; blocked metadata fetch uses local fallback `Request.cf`. Standard preview's previously diagnosed missing Node entry is not repaired or newly claimed working. Nonfatal existing bundler advisories remain. No deployment or intended-date hosting compatibility is established.

To reproduce the separate full-storage-denial failure, inject a throwing getter for `window.localStorage` with `browserContext.addInitScript`, then open `/`. The observed body begins “This page didn't load.” `src/integrations/supabase/previewAuthStorage.ts:57` returns the getter without a guard outside its preview broker path. This is distinct from quota failure in `Storage.prototype.setItem`. No adapter, session or integration change is made in this PR; record it for the reliability pass.

## Files and ownership

| Files                                                                                        | Reason                                                                                                             |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/components/welcome/WelcomePages.tsx`                                                    | Direct first action, optional account/settings, retained book modal, legacy baseline URL                           |
| `src/components/welcome/WelcomeFrame.tsx`, `src/routes/auth.tsx`                             | Remove obsolete step API/counter and clarify welcome back control                                                  |
| `src/components/welcome/AccountForm.tsx`                                                     | Bounded welcome continuation to scene; existing auth SDK and ordinary account destination retained                 |
| `src/routes/scene.tsx`                                                                       | Explicit unsaved exit and pending-save guard only; authored content and save owner unchanged                       |
| `src/welcome.css`                                                                            | Entry hierarchy/legibility/height, native disclosure, removal of retired question/counter/competing landing styles |
| `src/test/first-use.test.tsx`, `welcome-auth.test.tsx`, `scene-regression.test.tsx`          | Behavioral regression coverage above                                                                               |
| `scripts/verify-pr-b.cjs`, `scripts/verify-welcome.cjs`                                      | Actual compiled first-use journeys; updated compatibility acceptance                                               |
| Product contract, checkpoint, journeys, architecture, truth/design/commercial/gate documents | Match current behavior and preserve outstanding release boundaries                                                 |
| PR B report, file inventory, screenshots and verification receipts                           | Concrete review evidence                                                                                           |

## Data/security, limitations and rollback

No new storage model, key, identity owner, migration, generated integration, credential, dependency, analytics tracker or cloud write path. `src/lib`, `src/data`, `src/integrations` and `supabase` remain unchanged from base. Existing actor-setup records are not rewritten or deleted; optional controls use the current device-wide preference hook. Guest rehearsal saves use the existing Passport store, and confirmed-account transitions/import retention remain owned by existing code.

Risks: the welcome CTA now starts a rehearsal rather than opening account choice; optional experience/goals questions are removed because they do not alter immediate instruction. Older data remains readable via the retained baseline introduction. Unsaved in-memory rehearsal input is intentionally discarded on the explicit unsaved exit; it is not a resumable draft. Browser clearing/quota limits guest persistence. Complete storage-getter denial remains the diagnosed startup failure above. Smaller-height and enlarged-text viewports may require vertical scrolling. A shorter path does not resolve scene quality, live authentication, production runtime or educational-content gaps.

Rollback: revert the PR B commit through normal history-preserving review. There is no schema/data transformation to reverse. Existing records remain valid for the prior interface; do not reset or rewrite published Lovable history.

Next: owner review/merge of PR B, then refreshed main for **PR C — Rehearsal & Director Quality**. Keep truthful scripted feedback and performing silence; improve supported task/retake/guidance quality without invented evaluation. Remaining full lint, preview/runtime, storage denial, physical device, live account/RLS/import, reviewed material, deletion/retention, rights/legal/support and commercial gates remain open in [release gates](SLAMS-RELEASE-GATES.md). No automatic merge or deployment.

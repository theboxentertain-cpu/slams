# PR A — architecture cleanup and verification

## Verdict and scope

SLAMS has a working authored rehearsal/reflection demonstration and audition-note workflow, plus an incomplete conservatory/supporting-tool foundation. It is not commercially release-ready. This delivery completes the **Phase 00 source reconciliation and the first coherent PR A improvement**; it does not declare PRs B–F complete.

Base: fetched `main` **`c9d7189`**, including merged PRs #1–#6. Branch: **`fix/pr-a-architecture-cleanup`**. It is not stacked on an unapproved design branch. See the [audit](SLAMS-PHASE-00-AUDIT.md), [route map](SLAMS-INFORMATION-ARCHITECTURE.md), [truth matrix](SLAMS-FEATURE-TRUTH-MATRIX.md) and [exact file inventory](SLAMS-PR-A-FILES.txt).

## Significant changes and user flows

| Change                        | Before                                                                                                                             | After / reason                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared support-page ownership | Eleven unavailable-only routes presented 36 empty tab controls                                                                     | One honest availability panel and one working next action; old URLs/query values remain valid                                                                         |
| Actor at Work                 | Available preparation mixed with project/character/media tabs whose deep tools were unavailable                                    | Existing preparation is the default task; planned tools sit in a labelled, keyboard-accessible disclosure; old query bookmarks have an actionable return              |
| Stuck Desk                    | Intake tabs and workflow links led into unimplemented diagnosis/retry/fix surfaces; two intervention tabs duplicated the same list | Existing authored suggestions are canonical at `/stuck`; one rehearsal action; `/stuck/intervention` redirects here; old intake query states stay truthful/actionable |
| Matrix location               | Supporting route had no primary navigation owner highlighted                                                                       | Conservatory/Schools ownership is consistent with its parent/action                                                                                                   |
| Unreferenced alternatives     | `SystemStub`, `OfficeProgress`, `SystemsNav`/`InDev` and stale six-item-navigation/modal-progress CSS remained                     | Removed only proven-unused alternatives and 21 CSS rules; canonical layout, progress page and single five-item bar remain                                             |
| Local RLS test harness        | Socket readiness could observe PostgreSQL’s temporary initialization server, then fail before the final server started             | TCP readiness/execution uses the final server inside the isolated disposable container                                                                                |

Working audition tab/draft behavior, first-visit welcome, three Office views, eight canonical schools/36 terms, approved character/artwork, existing authored scene/interventions, ON/QUIET/OFF, auth/query lifecycle and private record stores are preserved. No credentials, generated Supabase integration, schema, curriculum, scene text, pricing, tracker or new artwork changes.

## Actual executed checks

| Command/check                                                 | Result                                                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Main baseline `npm test`                                      | **128 passed**, 18 files                                                                                    |
| Main baseline `npm exec tsc -- --noEmit`                      | Passed                                                                                                      |
| Main baseline clean `npm run build`                           | Passed                                                                                                      |
| Main baseline `npm run lint`                                  | Failed: **664 formatting errors, six warnings**                                                             |
| PR A `npm test`                                               | **148 passed**, 19 files, no skipped tests                                                                  |
| PR A `npm exec tsc -- --noEmit`                               | Passed                                                                                                      |
| PR A clean `npm run build` after removing `.output`           | Passed: client, SSR and Cloudflare/Nitro output                                                             |
| ESLint on 19 changed TS/TSX/CJS files                         | Passed, no errors or warnings                                                                               |
| PR A full `npm run lint`                                      | Failed: **661 existing formatting errors, six warnings**; no suppressed rules or unrelated formatting sweep |
| `bash -n scripts/test-rls.sh`                                 | Passed                                                                                                      |
| `bash scripts/test-rls.sh` using explicit local Docker socket | Passed after harness fix; disposable PostgreSQL, read-only audit mounts, `--network none`                   |
| Actual compiled-worker browser suites                         | **1,187 checks passed**, zero uncaught page errors                                                          |
| `git diff --check`                                            | Passed                                                                                                      |

Twenty added automated cases cover all eleven support destinations, a single useful next action, absence of empty tab interfaces, legacy tab parsing, navigation ownership, available preparation context, old Work/Stuck query returns and preservation of the actual authored intervention list. Existing import, session/account-isolation, eligibility, scene, welcome and unsaved-draft regressions remain green.

Browser breakdown: **140 PR A**, **336 foundation**, **115 Office/rehearsal**, **147 welcome**, **449 studio-world**. The foundation suite now checks the intentional absence of unsupported controls, every retained legacy support-tab URL and both old intervention bookmarks. Working tab/back behavior and unsaved audition preparation remain tested; assertions were not disabled to hide the navigation changes.

The PR A browser suite covers 320/360/390/412/768/1440px, one primary action and one five-route bar, no horizontal overflow, practical touch targets, native-disclosure keyboard access, legacy returns, actual audition save/reload across navigation, reduced motion and enlarged text. Tests use isolated guest browser contexts, not live authenticated accounts.

## Evidence and reproduction

Machine results: [PR A](../verification/pr-a/pr-a.json), [foundation](../verification/pr-a/foundation.json), [Office](../verification/pr-a/office.json), [welcome](../verification/pr-a/welcome.json), [shared studio](../verification/pr-a/studio-world.json).

Complete logs: [baseline tests](../verification/pr-a/baseline-tests.txt), [baseline lint](../verification/pr-a/baseline-lint.txt), [final tests](../verification/pr-a/tests.txt), [final build](../verification/pr-a/build.txt), [remaining lint failures](../verification/pr-a/lint.txt), [local RLS pass](../verification/pr-a/rls.txt), [original RLS startup failure](../verification/pr-a/rls-baseline-failure.txt), [preview failure](../verification/pr-a/preview.txt). Text-log trailing whitespace is normalized; diagnostics are retained.

Actual compiled screenshots:

- Work: [before](../screenshots/pr-a/before-work-mobile.png) → [after](../screenshots/pr-a/after-work-mobile.png) · [desktop](../screenshots/pr-a/after-work-desktop.png)
- Stuck Desk: [before](../screenshots/pr-a/before-stuck-mobile.png) → [after](../screenshots/pr-a/after-stuck-mobile.png) · [desktop](../screenshots/pr-a/after-stuck-desktop.png)
- Lab: [before](../screenshots/pr-a/before-lab-mobile.png) → [after](../screenshots/pr-a/after-lab-mobile.png) · [desktop](../screenshots/pr-a/after-lab-desktop.png)
- Character availability: [before](../screenshots/pr-a/before-character-mobile.png) → [after](../screenshots/pr-a/after-character-mobile.png) · [desktop](../screenshots/pr-a/after-character-desktop.png)

Browser scripts require separately installed Playwright/system Chromium; no dependency changes:

```sh
SLAMS_PLAYWRIGHT_MODULE=/path/to/playwright \
SLAMS_BASE_URL=http://localhost:3101 \
SLAMS_ARTIFACT_DIR=/tmp/slams-pr-a-check \
node scripts/verify-pr-a.cjs
```

The existing `npm run preview` starts but an actual GET `/` returned **HTTP 500**, looking for `dist/server/server.js` rather than the generated `.output/server/index.mjs`. Local compiled acceptance instead used external Wrangler 4.156.0 with **local-only** compatibility date `2026-10-30`; installed workerd predates the generated `2026-11-02` date. Blocked metadata access uses fallback local `Request.cf`. Nonfatal path-resolution/bundler advisories remain. No deployment or intended-date hosting compatibility is claimed.

## Data/security impact, risk and rollback

There is no new data model, migration, provider, cloud write path or storage transformation. Removing empty UI and redirecting duplicate content does not discard saved work. The isolated browser actually saves with the existing preparation control and verifies that navigation preserves the same stored data. The disposable SQL audit verifies checked-in RLS/content guards with simulated identities; **live email confirmation and two independent confirmed accounts remain unverified**.

Main risks: bookmarks now show a single availability panel or redirect to the canonical suggestions rather than an obsolete tab; integrations outside this repository that depended on the old tab DOM should be updated. Query values, route paths and actual data owners remain. Some active tabs still contain truthful unavailable states; full workspace/progression consolidation is reserved for PR D. The remaining active CSS layering is not claimed fully consolidated.

Rollback: revert the PR A commit on the review/merged branch through normal history-preserving git workflow. There are no data/schema changes to reverse. The prior UI, aliases and harness are restored without transforming user records. Do not reset or rewrite published Lovable history.

## Remaining blockers and continuation

Full repository lint, standard preview/runtime compatibility, physical Android/TalkBack, live confirmation/recovery, independent confirmed-account isolation, deployed RLS, cross-device persistence/imports, real published curriculum, deletion/orphan retention policy, educational approvals, legal/rights/support and commercial inputs remain tracked in [release gates](SLAMS-RELEASE-GATES.md). None is silently marked resolved by an interface cleanup.

PR A is suitable for code/design review as a narrow tested improvement. Do not auto-merge or deploy. Next: **PR B from refreshed main after PR A review**, shortening cinematic entry to the actual guest rehearsal without requiring profile completion or an unavailable assessment. Preserve all current storage/ownership boundaries and prove welcome → choice → retake → reflection → save/continue. No PR B implementation is included here.

PR publication is attempted separately after pushing the branch. If the environment rejects the GitHub API, a pushed branch must be reported as a review-ready comparison rather than an opened pull request.

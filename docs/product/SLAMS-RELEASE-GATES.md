# Release gates — Blueprint checkpoint and historical Phase 00 / PR A

Current blueprint evidence is in [release verification](SLAMS-RELEASE-VERIFICATION.md); the Phase 00/PR A table below remains historical. A page-surface PASS does not close its full contract.

| Current blueprint gate                                                      | Status  | Evidence / boundary                                                                            |
| --------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| Latest main and 47-page ownership coverage                                  | PASS    | `755f5ba`, all 47 IDs/owners/registered routes/test bindings; independent branch               |
| Full blueprint compliance                                                   | FAIL    | 15 remaining contract failures, 26 blocked contracts; default auditor exits 1                  |
| Automated application / auditor tests                                       | PASS    | 163 Vitest cases plus eight separate auditor checks                                            |
| Typecheck / clean build / changed-file lint / formatting                    | PASS    | Independent commands; five changed TS/TSX and three new CJS files                              |
| Compiled browser assertions                                                 | PASS    | 1,348 checks; all 47 surface cases accounted for, P15–P18 remain BLOCKED for reviewed material |
| Full repository lint                                                        | FAIL    | 652 formatting errors / six warnings, diagnostics retained                                     |
| Standard preview root GET                                                   | FAIL    | HTTP 500, missing `dist/server/server.js`                                                      |
| Reviewed teaching / genuine assessment / graduation                         | BLOCKED | No independently reviewed material or criteria supplied/verified                               |
| Live confirmed-account auth/RLS/cloud/imports and production hosting        | BLOCKED | No live credentials/accounts/deployment used; simulated tests are a separate scope             |
| Recording / multiplayer / validated diagnostics                             | BLOCKED | Required services, evidence and approvals absent                                               |
| Physical Android/TalkBack / manual human usability / production performance | NOT RUN | Browser emulation and screenshot inspection do not establish these                             |
| Legal/privacy/retention/rights/support/commercial launch                    | BLOCKED | Human/product/operational inputs still required                                                |
| Protected art/data/auth/schema/dependencies                                 | PASS    | Empty diff for protected source directories and package manifests                              |
| Merge / deployment / live database mutation                                 | NOT RUN | Explicitly excluded                                                                            |

Historical PR A gates:

| Gate                                                     | Status          | Evidence / boundary                                                                                           |
| -------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| Current main reconciled, PRs #1–#6 present               | PASS            | Fetched `c9d7189`; clean branch created from it                                                               |
| Baseline automated tests                                 | PASS            | 128 tests / 18 files, actually rerun                                                                          |
| Baseline TypeScript and clean build                      | PASS            | Fresh main commands passed                                                                                    |
| Baseline full lint                                       | FAIL            | 664 formatting errors, six warnings                                                                           |
| Local RLS harness on baseline                            | FAIL, corrected | Init-server readiness race; TCP check fixed in PR A                                                           |
| Local checked-in RLS/content policies                    | PASS            | Disposable PostgreSQL audit passed after fix; simulated identities only                                       |
| PR A final tests/types/build/changed-file lint           | PASS            | 148 tests / 19 files; TypeScript, clean build and 19-file ESLint passed                                       |
| PR A compiled-browser regressions                        | PASS            | 1,187 checks; guest storage, route compatibility, existing flows and responsive layouts; zero uncaught errors |
| PR A full repository lint                                | FAIL            | 661 remaining formatting errors, six warnings; complete diagnostics retained                                  |
| Standard `npm run preview`                               | FAIL            | Actual GET `/` returned HTTP 500; missing `dist/server/server.js`                                             |
| Intended production-host/runtime compatibility           | BLOCKED         | Local worker compatibility override is not production verification                                            |
| Email confirmation/login/recovery/session persistence    | BLOCKED         | Requires live allowed backend/callback setup and authorized users                                             |
| Independent two-confirmed-account isolation/deployed RLS | BLOCKED         | Neither unit mocks nor local synthetic IDs qualify                                                            |
| Cloud saves/imports/published progress across devices    | BLOCKED         | Requires authorized live backend verification                                                                 |
| Complete reviewed Meisner teaching path                  | BLOCKED         | Reviewed material and criteria not supplied/verified                                                          |
| Physical Android/TalkBack/device scaling/orientation     | NOT RUN         | Browser emulation is a separate, limited check                                                                |
| Representative production FCP/LCP/CLS/responsiveness     | NOT RUN         | Previous lab sample is historical; PR E/F own broader performance evidence                                    |
| Account deletion/orphan retention                        | BLOCKED         | Policy and safe reviewed migration/restore procedure required; no live destructive action                     |
| Privacy/terms, content rights, support, pricing/billing  | BLOCKED         | Human/product/operational inputs missing; no commercial launch claim                                          |
| New credentials/integrations/schema changes              | PASS            | PR A must contain none; inspect final diff                                                                    |
| Automatic merge/deployment                               | NOT RUN         | Explicitly excluded                                                                                           |

See [PR A verification](SLAMS-PR-A-VERIFICATION.md) for exact commands, screenshots, all remaining diagnostics, data impact, risks and rollback. Existing release blockers do not become resolved merely because a narrow architecture PR is ready for review.

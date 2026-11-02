# Release gates — Phase 00 / PR A / PR B

This file distinguishes historical Phase 00 / PR A evidence, current PR B evidence and external release requirements. `PASS` does not expand beyond the stated test boundary.

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
| PR A merged / PR B latest main                           | PASS            | PR #7 merged at `755f5ba`; clean PR B branch from this main                                                   |
| PR B final tests/types/build/changed-file lint           | PASS            | 155 tests / 20 files, TypeScript, clean build, all eight changed TS/TSX files                                 |
| PR B compiled-browser acceptance/regression              | PASS            | 1,263 guest checks; direct entry, save/unsaved continuation, compatibility; zero uncaught errors              |
| PR B full repository lint                                | FAIL            | 652 remaining formatting errors, six warnings; diagnostics retained                                           |
| First rehearsal with storage write/quota failure         | PASS            | Entry reaches scene without requiring a preference/setup write                                                |
| Startup with complete localStorage getter denial         | FAIL            | Separately reproduced application error page in unchanged auth storage adapter; reliability follow-up         |
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
| New credentials/integrations/schema changes              | PASS            | PR A and PR B contain none; protected source diff checked                                                     |
| Automatic merge/deployment                               | NOT RUN         | Explicitly excluded                                                                                           |

See [PR A verification](SLAMS-PR-A-VERIFICATION.md) for exact commands, screenshots, all remaining diagnostics, data impact, risks and rollback. Existing release blockers do not become resolved merely because a narrow architecture PR is ready for review.

See [PR B verification](SLAMS-PR-B-VERIFICATION.md) for the current first-use flow, before/after screenshots, exact files and verification limits. PR B does not alter live integration credentials, schema, session ownership or published content.

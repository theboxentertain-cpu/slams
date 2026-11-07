# Actor at Work V3 — Multiple audition files

**Status:** Implemented in a review branch only; database migration proposed, not deployed.

## User-visible workflow
- The Auditions section retains the existing single-record audition preparation entrypoint.
- Signed-in actors get a distinct "My auditions" list, with new, reopen and edit.
- Each audition records title, role, optional date, status (preparing, ready, submitted, closed), and five actor-authored preparation fields.
- An audition may optionally link to an existing project owned by the same account. The association is explicit; there is no automatic extraction or synchronization of project notes.
- Multiple independent records are supported without deleting, rewriting or automatically migrating the original `audition_prep` record.
- No automatic deadline reminders, calendar integration, self-tape recording, script/side uploads, AI scoring or audition submissions are claimed.
- New records are saved in the user's cloud account, not local guest storage. Signed-out users retain the existing legacy guest audition workspace.

## Security and data contract
- Staged migration `drizzle/migrations/0005_actor_auditions.sql` requires `0004_actor_projects_versioned.sql` on the target DB. Neither schema is installed by this PR.
- Owner-scoped read/write policies are applied to `actor_auditions`, with **no authenticated DELETE permission** in this release.
- Composite foreign key `(user_id, project_id)` references `actor_projects(user_id,id)`: the database, not client options, enforces ownership of the linked project.
- Project association remains optional. The FK uses RESTRICT for deletion to avoid orphaned auditions.
- Owner/id creation date are immutable via server trigger; revision is incremented by server, and client edits compare revision, ID and owner before applying.
- The React hook ignores delayed account-A responses after account switch to B. Browser-only project IDs and user-reported ownership never replace server checks.
- Client requires successful row readback on create and update; failures are explicit. Neither the original `audition_prep` nor the local browser audition key is read, moved or mutated by the new hook.

## Acceptance tests
- Data: invalid title/status, impossible dates, overly long notes, Arabic characters, non-owner project ID.
- Hook: owner-scoped reads, independent creation and legacy-preservation, cross-owner denial, version conflict, account switch and table-unavailable state.
- UI: create with due date and project association; reopen/edit; signed-out link to legacy; missing schema fails closed.
- CI: TypeScript, semantic lint, complete Vitest suite, production build, plus full formatting lint.

## Mandatory release gates
1. Read the **actual** live Supabase schema and migration ledger before applying migrations. `0003` is separately proposed and cannot be replayed blindly. `0004` requires independent review; `0005` must be applied only after it.
2. Staging security exercise with two real authenticated users + anonymous request: direct SELECT/INSERT/UPDATE denied for other account, owner project link spoof denied, concurrent revision update rejected.
3. Test correct behavior after user deletion, project deletion attempts when linked, nullable unlinked project, database date and JSON limits, multi-device updates.
4. Physical Android layout and text scaling at 320/360/390 px with English/Arabic RTL, TalkBack navigation and offline error recovery.
5. No claims of production readiness until the above are signed off.

## Next Actor at Work
- Source-grounded script/sides import and script-anchored beat marks.
- Event reminders only after a real permissioned notification system exists.
- Project journal and actor work timeline; consent-first self-tape tools.
- **Conservatory stays last** per locked build order.

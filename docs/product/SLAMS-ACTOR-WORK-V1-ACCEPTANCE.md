# Actor at Work V1 — project files and owner-scoped revision history

**Scope:** In-progress draft implementation. No database changes are deployed in this PR.

## What this introduces
- A true `Projects` tab in the existing five-destination app navigation.
- Separate per-role project files: project title, role name, six character fields, scene beats and tactic transitions.
- Bilingual English/Egyptian Arabic controls; native keyboard-accessible HTML forms and collapsible panels.
- Explicit save, re-open, archive/restore, and read-only version history; loading a historic revision into the editor does NOT persist until the actor presses Save.
- Cloud-only project files for signed-in actors. Existing guest and signed-in `audition_prep` record is unchanged and remains the single original audition note.
- Optimistic locking: project edits check ID, user ID and prior revision, then require a server-confirmed owner-matching new revision.
- Account-switch guards: late saves or reads from A cannot be rendered inside B.
- A proposed migration for two server-side tables with owner RLS, immutable ownership and server-triggered revision snapshots; revision rows cannot be written directly by clients.
- Unit, account-boundary, state, and UI tests.

## Data and security contract
1. `actor_projects` is readable/writable only by the signed-in row owner. `actor_project_revisions` is SELECT-only for authenticated row owner. The server inserts revisions in the same transaction as each project write.
2. The authenticated browser uses the user's normal Supabase session, **never** a service-role key. Client-side owner filters are defense-in-depth, not security by themselves.
3. `revision` increments on server updates. A stale version update returns no confirmed row and must be refused.
4. User-authored notes are not automatically translated, graded, published, or claimed to be academically verified.
5. The MVP does not support script file uploads, camera capture, production calendar, collaborative sharing, actual scene audio/video or a complete multi-project audition manager.
6. No automatic migration or deletion of old single-file audition notes.
7. Database table proposal is **not applied**; the UI must show a non-working deployment error instead of pretending persistence until installation succeeds.

## Release blockers
- Inspect the **actual live DB migration ledger** before running `0004_actor_projects_versioned.sql`. `0003_academic_progression_placement.sql` is separately flagged as proposal-only. Never run the full migration series blindly against live data.
- Independent SQL/RLS review of policies, trigger security and auth-user deletion cascade.
- Apply migration in isolated staging; test owner A, owner B, anonymous request and service-role access. Test spoofed owner, reading/writing another user's IDs, direct revision insert/update, revision races, archival and deletion cascades.
- Validate schema migration compatibility and cloud row types against the deployed Supabase instance.
- Run CI TypeScript, semantic lint, Vitest, production build and **full formatting lint**.
- Android 320/360/390px RTL/LTR mobile, keyboard, TalkBack and slow/offline save-error walkthrough.
- Confirm that draft Stuck Desk PRs #21/#22 and curricula #19/#20 remain separate; no merge/deploy without explicit approval.

## Later Actor at Work increments
- Dedicated shareable character and breakdown subroutes linked to individual project IDs, with clearer parent/back navigation.
- Link audition preparations to selected files through an explicit non-destructive migration UX.
- Draft resume, script parsing/import, line markup, professional scene breakdown and collaboration.
- Consent-first self-tape capture and export, then Performance Lab integrations.

**Status:** A genuine versioned project workspace is implemented in source and awaits schema deployment and live verification. Do not label it production-ready.

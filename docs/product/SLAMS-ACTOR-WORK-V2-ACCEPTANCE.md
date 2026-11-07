# Actor at Work V2 — Dedicated files and non-destructive audition copy

**Status:** Implemented in source only; dependent on the private cloud database migration required by V1. No live migration is applied here.

## Delivered UI

- /work/character and /work/breakdown now host editable project-specific workspaces rather than unavailable-page placeholders.
- Each route accepts an optional projectId UUID selector. Missing/invalid selectors open an account-scoped project chooser; a non-owner selector exposes no other user's data.
- Character workspace: circumstances, objective, obstacle, playable action, moment before and relationships.
- Breakdown workspace: scene beats, tactics and transitions.
- Both use V1's account-bound, version-checked update. The other workspace's fields are preserved.
- Per-project links live in Projects and Work; five-item global navigation remains unchanged.

## Legacy audition copy: explicit snapshot, not synchronized link

- The existing single audition_prep record is retained, not migrated, altered or deleted.
- The Audition screen links explicitly to character project selection.
- An actor opens the Character File, expands the copy panel, previews original fields, manually selects only eligible fields, and stages them in an UNSAVED editor.
- Five fields are eligible: circumstances, objective, obstacle, action and moment. Combined role text is never guessed into project title/role. Existing relationships, beats and tactics remain unchanged.
- Occupied destination fields are disabled. Copy validates all chosen fields first; invalid selection copies nothing.
- Staging is not saving. The actor presses Save to create a new project revision. Stale revision saves fail closed.
- Exact authored English and Arabic text is preserved. No scoring, interpretation, rewriting or academic credit is implied.
- The source audition form is not connected live to the project. Later changes are NOT automatically synchronized.

## Tests and release gates

- CI TypeScript, semantic lint, Vitest, production build and full formatting checks.
- Regression coverage for source immutability, collision handling, malformed UUID, bilingual text, non-owner routes, breakdown saving and staged-but-unsaved copy.
- Real live two-account Supabase and RLS tests remain mandatory, including non-owner IDs, direct revision insertion and concurrent revisions.
- Schema 0004_actor_projects_versioned.sql remains proposed, NOT applied. Inspect actual deployed migration ledger and the 0003 proposal boundary. Never blindly migrate, merge or deploy.
- Physical Android 320/360/390px, RTL/LTR and screen-reader checks remain pending.
- Unsaved editor changes are not resumable; project draft resume is a later workstream.

## Next Actor at Work priorities

1. Staging migration and live two-account isolation.
2. Explicit multi-audition records/scene associations rather than fake synchronization to a single legacy record.
3. Scripts/sides, source-fact-vs-interpretation notes and scene-anchored breakdown.
4. Audition deadlines, journal and work timeline.
5. Consent-first self-tape capture/export and Performance Lab.

**Truth:** User-owned preparation pages exist in code. They are not deployed, and curriculum legitimacy is a separate workstream.

# SLAMS — Actor at Work V4: Source-Anchored Script Sides

**Status: Draft implementation, never auto-deployed.** The user-facing component is functional against a deployed staging database. No database migration is applied by this PR.

## What is real
- A working **Script Sides & Beats** route at `/work/sides`, accessible from Actor at Work, the existing Audition script tab, Projects and the multi-audition list.
- Signed-in users can paste script text or load a UTF-8 `.txt` file (up to 60 KB), preview/edit the text, explicitly associate the side with **one** private project or audition, and save to their account.
- The source snapshot is immutable after import. The client cannot save an annotation that changes its script text. The database trigger also forbids changes to text and the parent association.
- UTF-8 `.txt` file imports retain source characters and newline codepoints in the saved text. Browser textareas may normalize CRLF to LF when **pasting**; the rendered line order and characters remain intact. Display splits into numbered lines for anchors; no automatic rewriting or translation.
- Actors add line-anchored `beat`, `objective`, and `tactic` notes by selecting from/to line numbers and seeing the source excerpt before explicitly saving. They can stage or remove a beat without persisting it immediately.
- The UI distinguishes **script text as evidence** from **user-authored interpretations**. There is no AI diagnosis, originality assessment, script parser, automatic beat detection, or performance grading.
- Optimistic concurrency uses an owner ID + script ID + prior revision, with an explicit failure rather than silent overwrite.
- Arabic RTL and English controls. User-authored bilingual material is unchanged and displayed safely as text.

## Limitations made explicit
- This initial import supports **only plain-text UTF-8 `.txt` and paste**. No PDF, DOCX, FDX, Final Draft, image extraction, screenplay-format recognition, OCR, external storage linking, or audio recording is supported.
- Maximum 25,000 text characters, 400 lines per side, up to 40 beat marks. The system is designed for rehearsal **sides**, not a full-length screenplay archive.
- A script source cannot be edited after initial save. To revise the script, create a new side; automatic anchor rebasing and diff are future enhancements.
- Parent association is either one project or one audition. It never modifies their existing work, and nothing is automatically synchronized to the independent freeform Character/Breakdown fields.
- No guest cloud storage; original guest audition notes remain where they were.
- The server does not perform independent semantic validation of annotations beyond JSON size/type, ownership and immutable source. Actor marks represent their own work.

## Database security
- Proposed migration `0006_actor_sides_anchored.sql` depends on `0004_actor_projects_versioned.sql` and `0005_actor_auditions.sql`. The proposal adds a unique owner/id constraint on auditions for a composite owner-safe FK.
- DB allows **exactly one** parent association, enforces same user ID through composite FKs, owner-only SELECT/INSERT/UPDATE RLS, immutable script content, server-owned revisions and account-delete cascading. No authenticated DELETE permission in V1.
- The UI's owner filtering is not a substitute for DB RLS. The deployed DB has **not** been inspected or security tested.

## Must-pass release gates
1. Inspect actual Supabase migration ledger before running any proposed `0003`–`0006` migration; never apply them blindly.
2. Staging two-user security: A may CRUD only A's own scripts, B cannot see/update them, an anonymous user has no access. Attempt spoofing owner/parent IDs, direct revision rewrite, immutability bypass and editing parent after save. Test cascades and FK RESTRICT under real accounts.
3. Validate 400-line, 60 KB, Arabic and LF/CRLF behavior on Android, with offline save failure, refresh and duplicate-file handling.
4. Screen reader, focus order, large text and RTL physical device checks.
5. Verify that scripts and annotations aren't logged or transmitted to third parties through analytics. Get explicit consent and privacy policy review before production use.

## Next
- Authoritative PDF/FDX/industry-script import via reviewed parsers, if legally/technically appropriate, with explicit original-vs-extracted text distinction.
- Script source versioning and actor-authorized comparison to update anchors without silent drift.
- Saved project journal, audition work history and optional notifications.
- Conservatory curriculum content **last** under locked build order.

**No claims of production readiness, official school certification or institutional equivalence.**

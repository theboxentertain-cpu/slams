<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- SessionProvider owns identity state and the identity-transition listener; sign-out cancels and clears queries before clearing the session to avoid stale private data.
- Progress uses browser-local storage while signed out and user-scoped cloud tables while signed in; writes must confirm success and local imports must retain rejected data.
- Curriculum reads use a public server function; published material requires review, and database triggers reject progress for nonexistent or unpublished units.
- Curriculum pack validation precedes trusted imports; parent-scoped slugs and year/term numbers preserve stable database IDs across updates. No browser-admin import endpoint is allowed.
- Curriculum structure lives in src/data/schools.ts as a typed School>Year>Term>Course>Workshop>Lesson>Exercise model; never mark content complete without reviewed material.
- Living Scene content is fixed scripted data in src/data/scene.ts; no AI judgment or grading.

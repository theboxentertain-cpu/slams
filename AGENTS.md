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
- Persistence is local-only demo mode (src/lib/store.ts, localStorage) until a backend is enabled; UI must keep the demo-mode banner while that is true — the spec forbids implying cloud storage.
- Curriculum structure lives in src/data/schools.ts as a typed School>Year>Term>Course>Workshop>Lesson>Exercise model; never mark content complete without reviewed material.
- Living Scene content is fixed scripted data in src/data/scene.ts; no AI judgment or grading.

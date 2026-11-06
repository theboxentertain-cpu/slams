# SLAMS — Non-Conservatory 10/10 Execution Contract
**Product:** SLAMS — The Actor's Pocket Studio · mrahmostudios presents
**Decision:** Complete and independently verify all non-Conservatory systems before expanding academic school curricula.
**Baseline:** Existing GitHub `main` has functional text rehearsal, audition preparation, Passport notes and an illustrated Director's Office; multiple supporting destinations are explicitly unavailable. Conservatory material is partial and undergoing separate draft review.

This roadmap is a **build order**, not a declaration that any stage is 10/10. Existing approved information architecture (three worlds, six supporting systems) stays intact. Do not count a screen as finished just because the route or illustration exists.

## Non-negotiable product rules
1. **Actor performs; app observes only what was actually supplied.** No claims of real-time video/audio analysis, emotion detection, talent rating, accreditation or diagnosis without a verified capability.
2. **One connected journey:** describe a task → practice → intervene → retake → compare observable evidence → reflect → *explicitly* save to Passport → continue. Never fake results or automatic mastery.
3. **The Director is useful before it is funny.** It must give specific notes tied to user-submitted evidence; ON / QUIET / OFF must be respected.
4. **Mobile-first and bilingual:** 320/360/390px and desktop, Arabic RTL, scalable text, proper keyboard/focus, 44px targets and reduced-motion handling.
5. **No default recording/sharing.** Recording needs informed permission; no recording on page load. Local drafts must not cross accounts. Explicit save and deletion must be verified.
6. **Visible status truth:** distinguish usable, pilot, under review and unavailable features at their entrance. Never describe mock activity as integrated AI.
7. **No abandoned routes or decorative interactive props.** Every tappable office object has a meaningful destination; every interrupted task can recover or clearly restart.
8. **No graduation, official school endorsement, lecturer signoff or advanced academic gate from self-report.** The Conservatory stays last.

## Locked implementation order

| Order | Workstream | Concrete delivery | Gate before 'done' |
| --- | --- | --- | --- |
| 01 | Actor journey/UX structure | Workflows, clear task entry, coherent navigation, capability status truth | User can enter, complete and exit each supported task without dead ends |
| 02 | **Stuck Desk** | Problem selection → targeted acting action → retake → self-observation comparison → Passport note | Real two-take workflow, 4 distinct prompts, failure/accessibility/privacy tests |
| 03 | Actor at Work | Multiple real projects and audition files, scene breakdown, character laboratory, safe script imports, journal | Real persistence, edits, versioning, per-user isolation |
| 04 | Performance Lab | Consent-based capture, reliable playback, A/B takes, time-aligned user/director annotations, export/delete | Android permission, device, privacy and performance tests; no invented AI scoring |
| 05 | Director / Master's Chair | Contextual coach with technique-aware interventions, specific director notes, ON/QUIET/OFF | Actionable notes with evidence; no ungrounded psychology or automatic evaluation |
| 06 | Rehearsal Lounge | Actual invitations, opt-in partner collaboration, shared scene permissions and blocking/reporting | Consent, anti-abuse and two-account permission checks |
| 07 | Technique Matrix | Practical cross-technique comparison and limits, grounded editorial bibliography | Qualified pedagogical review; no fake official syllabi |
| 08 | Actor Baseline + Passport | Reproducible starting-point tasks, real evidence history, reflections and actor portfolio | Honest progress, private data ownership, migration and export |
| 09 | Iconic visual/interaction system | Refined office and all page families, same coach silhouette, premium bilingual typography and animations | Human UX review, real Android screenshots, a11y and no-layout regression |
| 10 | Production hardening and launch | Supabase RLS live isolation, robust auth, error/retry, telemetry privacy, CI, deployment | Independent device, security, load and recovery checks |
| **LAST** | **Conservatory** | Eight schools with qualified-source-reviewed original curricula, exercises, human assessment and controlled progression | Actual instructor-reviewed content, realistic practical tests and authorized gate |

### Ship one substantial slice at a time
For each workstream: **source audit → specification → original content/UX → component → tests → accessibility/Arabic → runtime browser proof → review → merge/deploy decision**. Code green is necessary but insufficient for production.

## Current slice: Stuck Desk — Guided Rescue V1
- Never pretend a system diagnosed an acting problem. The **actor chooses** a symptom.
- Four authored technique *lenses* (not official curricula), each with why/how/avoid and a safe, specific retake.
- Capture before/after observations and a real change or an honest 'no detectable change'; no automatic improvement scores.
- Make text-only practice available immediately without permission prompts.
- Session-only until **Save to Passport** is explicitly selected; guest saves remain browser-local and signed-in saves use the existing cloud write pathway.
- User can **Copy** notes without saving, redo a problem or open the Living Scene.
- Work must be identity scoped, with tests for incomplete inputs, state reset and save failures.
- Later integration: recorded takes and actual Director notes depend on the Performance Lab workstream.

**Not included in this initial slice:** neural/AI diagnosis, video inference, autonomous coaching, uploaded scripts, masterclass claims, academic credits, partner matching or automatic quality ratings.

# SLAMS C03 — Academic progression and placement gate

**Status:** UNAPPLIED, UNVERIFIED DATABASE MIGRATION. Requires educational review and live database security testing. Branch depends on C02 PR #11 and must be reconciled with C01 PR #10.

## Confirmed benchmark and provenance
- The Neighborhood Playhouse publishes a two-year program, 32 weeks per year, ~30–32 hours per week, with Meisner Acting Technique I and II at 12 hours per week and second-year faculty invitation.
- Esper Studio publishes a distinct two-year conservatory with six hours of Acting Technique in each year, depending on track. It explicitly does NOT treat all prior Meisner training as automatically equivalent.
- SLAMS original Content 02/03 34-term authored course map and 9-lesson/6-exercise Meisner first term are **independent SLAMS editorial adaptations**.
- The later 36-term/432 combined-unit compendium and expanded manual cannot be silently substituted. A school-by-school, unit-by-unit academically reviewed crosswalk is still required.
- No accessible official first-party publication provides all private class drills, repetition counts, assessments or grading thresholds. Do not claim exact syllabus mirroring or institutional affiliation.

First-party benchmark pages:
- https://www.neighborhoodplayhouse.org/two-year-conservatory
- https://esperstudio.com/two-year-program/
- https://esperstudio.com/faq/

## Non-negotiable academic teaching contract for EVERY reviewed exercise
WHAT; WHY; METHOD AND PROVENANCE; HOW with actionable steps and demonstrations; WHEN; WHAT NOT TO DO; SOLO; PARTNER; GROUP; COMMON PITFALLS; CORRECTIONS; PROFESSIONAL APPLICATION; ACCESSIBILITY AND CONSENT; PREREQUISITES; PRACTICE EVIDENCE; FACULTY REVIEW REQUIREMENT; EXPECTED NEXT STEP.

Each mode must be marked QUALIFYING, PREPARATION ONLY or NOT SUITABLE, with an honest rationale. For Meisner partner exercises, SOLO can never qualify the actual partner skill. No compulsory emotional intensity, personal disclosure, unsafe movement, or manipulation of actors is permitted. Reviewers must check appropriate safeguarding, including age-appropriate group participation.

## Practice tracking does not equal progression
Practice attempts are owner-scoped, versioned, and record: exercise, mode, state, reflection and evidence notes. The actor can submit an attempt, but only approved assessed evidence may contribute to a separate attainment ledger. The new SQL tracker does NOT pretend to be that ledger.

The existing public client progress write is restricted at SQL RLS to STARTED. Historic COMPLETED rows remain but must be labeled legacy activity (not reviewed mastery). This is a non-destructive change.

## Advanced placement: any school, every skip assessed
An advanced actor may request placement for a defined school/year/term/course/workshop/lesson only after faculty publishes a source-backed, scoped and signed assessment policy. Every policy is bound to a concrete curriculum node, specific version and unique, described criteria; school mismatch and self-signing are rejected.

1. Actor submits relevant prior training history and appropriate evidence under an active signed policy.
2. Assigned qualified faculty evaluates the actual evidence, including live partner or ensemble work where required.
3. To approve, reviewer must record a substantive decision and **demonstrated** for every required rubric criterion; actor cannot approve themselves or edit decision/grant tables.
4. A transactional server-side grant is issued. Scope cannot be reused for another school/node and automatically ceases validity if its policy is retired.
5. Server content delivery must independently check the grant before exposing restricted material or awarding attainment. This last integration is NOT yet implemented. The read-only academic_has_placement function does not enforce content access.

**Important:** a rubric-check JSON record is audit data, not proof that reviewer expertise or teaching quality has been validated. Human governance and post-launch auditing still apply.

## Security constraints
- Reviewer assignments and curriculum policies: service role ONLY, separate from user-controlled profiles.
- Direct user UPDATE/INSERT of completed unit status: blocked by RLS.
- Placement request & grant state: no actor write permissions; only reviewed SECURITY DEFINER functions with auth checks.
- Actor A cannot SELECT actor B's practice, placement requests or grants.
- Approved grant is bounded to actor, school, node, active policy/version, and assigned reviewer.
- A signed user-submitted statement or quiz score alone does not unlock anything.
- No faculty users/policies seeded, no numerical threshold fabricated, no credential awarded, no migration applied here.

## Required tests BEFORE merging or deploying
1. Run SQL parser or isolated Postgres migration and rollback tests in a throwaway database; inspect migration journal version.
2. Test anon, authenticated actor A, actor B, school-X faculty, school-Y faculty, deactivated faculty and service roles.
3. Attempt direct COMPLETED unit progress insert and update; assert rejection.
4. Attempt to forge academic_reviewers, policies, placement_requests and placement_grants; assert rejection.
5. Reject policy for a target from another school and missing active faculty signature.
6. Reject practice with wrong version, unreviewed content or a different actor user ID.
7. Assert no unapproved/unsigned assessment creates placement requests.
8. Reject self-review, wrong-school review and missing rubric evidence; enforce demonstrated for every required criterion.
9. Verify grant belongs to actor and exact target, and becomes unusable when policy is retired.
10. Verify existing Passport, Audition, session and curriculum integrations unaffected.
11. Test two real confirmed accounts and mobile flows. No current connector test can substitute for this.

## Not yet implemented
- Real teacher recruitment/credential verification and review queue.
- Actual accepted/rejected assignment of school curricula or official teaching material.
- Reviewed Meisner exercise release, official practice quotas, assessed advanced-placement examination.
- Authenticated restricted content delivery and per-lesson server release gates.
- Form UI for real placement requests, practice evidence upload, reviewer feedback and appeal.

**No automatic merge, no direct deployment, no claim of academic readiness.**

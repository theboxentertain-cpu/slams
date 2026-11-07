# SLAMS Performance Lab V2 — Time-coded annotation and guided retake
**Status:** Stacked draft on Performance Lab V1; cannot merge into main before the V1 branch lands.

## Implemented scope
- Retains V1 explicit device-consent, **local-only, maximum 90-second** A/B camera/audio captures, playback, delete and download.
- Adds a **manual timestamp marker** in each recorded take based on `HTMLMediaElement.currentTime` at the instant the actor clicks Mark.
- Each marker requires an actor-selected lens and at least eight characters of actor-written, directly observed behavior.
- Per marker: seek to recorded moment, view observation, remove marker. Maximum 15 per take; no fabricated timestamps.
- Adds optional script/action objective, and text-only export of the objective, take notes, time-coded observations and difference.
- The Director shows a **prewritten educational retake experiment** chosen by the actor's marker category. It did not observe the performance, recognize emotion, detect a problem or award a score. Respect existing Director ON/QUIET/OFF handling.
- Replacing or deleting a take **removes that take's markers and its selected Director note**, preventing stale evidence; the other take's markers remain.
- Language: English + Egyptian Arabic. Existing V1 recording flow and route remain intact.

## Trust and evidence boundaries
- Markers and objective exist solely in React session memory, not Supabase, Passport or browser persistent storage.
- Media remains in browser-managed Blob URLs; never upload.
- A copied review contains **text only**; no media, raw object URLs or automatic certification claims.
- A chosen lens plus the actor's note is not proof the actor met an objective; it determines a possible *next practice experiment*.
- Review markers are not a diagnosis, psychological evaluation, school exercise certification or independent assessment.
- On device exit, all captured media/markers are discarded. A deliberate media download is outside the app's deletion control.

## Verification
1. Pure tests for malformed/negative/too-long timestamps, note length, lens selection and bounded mark count.
2. UI tests that recorder permission is never requested on render, that markers use actual player time, and that moving to a timestamp changes the player's playback location.
3. Replace/delete and navigation tests must ensure no marker from destroyed media remains.
4. Director ON/QUIET/OFF test coverage must be confirmed against the real coach component and manual Android review.
5. 320/360/390px bilingual UI and accessibility (labels, keyboard seek, screen reader announcements) require real Android testing.
6. Confirm no actual recordings or marker notes leave the browser in the network inspector.
7. Editor review: validated educational advice; no medical, psychological or credential claims.

## Further work
- Scene link from Actor at Work to Performance Lab with explicit user-owned context permissions.
- User-controlled opt-in media storage, export policies and deletion proof only after additional privacy/security design.
- Human coach review and real time-aligned notes, with provenance.
- Media performance and interruption testing on actual Android devices.

Do not merge a stacked PR as though its base were already merged. V1 and V2 require separate CI and release reviews.

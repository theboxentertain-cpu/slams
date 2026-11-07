# Performance Lab — V1 local capture acceptance contract

**Status:** Draft browser-only pilot. This specification does not certify Android compatibility, recording reliability, privacy compliance or professional performance analysis.

## What actually works in the draft
- Users deliberately select Take A / Take B and **video + microphone** or **audio only**.
- Each press of Record requests device permission; no permissions at initial render.
- MediaRecorder captures a maximum of **90 seconds** and stops the active tracks when recording ends or the user navigates away.
- Two separate retained takes can be played locally using real video/audio elements.
- A user can delete any take immediately (revoking its temporary object URL), or explicitly download an individual file.
- Actor-authored notes for each take and a difference note can be copied as text with an explicit click.
- UI has English and Egyptian Arabic strings. Existing `/lab?tab=takes|compare|notes` bookmarks remain valid; there is one actual lab rather than empty tab panels.

## Trust and privacy contract
- **No automatic recording, uploading, persistence or performance judgments.**
- Media exists only in browser memory via Blob object URLs. Video/audio are **not** in localStorage, IndexedDB, Passport or Supabase, and are not sent to third parties by this feature.
- A deliberate download creates a user-owned file that persists outside the app and cannot be remotely removed by SLAMS.
- On leaving the lab, both in-memory takes are discarded, tracks are stopped, and object URLs revoked.
- Device denial/unsupported API fails closed with a text rehearsal fallback.
- Never imply saved media, director review, voice analysis, gesture scoring, emotion detection, consent verification or academic advancement.
- Users should record only themselves or explicitly consenting participants.

## Hard release gates
1. Real Android Chrome camera/microphone permission allow, deny, revoke; front camera support; interruption (incoming call, backgrounding, app navigation).
2. Real audio/video playback and exported file open on at least two Android devices; observed sizes and 90-second cap.
3. Arabic RTL at 320, 360 and 390px; screen reader, keyboard access, focus behavior, reduced-motion preferences.
4. Permission denial, missing hardware, busy device, recorder errors, and delayed permission after unmount cannot leave active tracks or retained media.
5. Verify via browser network inspector that no recording bytes reach a remote service, including monitoring/analytics.
6. Manual vulnerability/security review, explicit consent copy review, and Android battery/memory performance profiling.
7. Decide whether future media storage warrants opt-in server persistence (out of scope for V1) **before** implementing uploads.
8. Verify pending actor_projects SQL migration and live two-user RLS isolation independently; this Performance Lab does not depend on that database.

## Later performance-system work (not in this pilot)
- Time-coded user notes and actual per-take marker editing.
- Retake prompt/Director note selection linked to *specific observed* actions, not fabricated AI feedback.
- Script/character linkage from Actor at Work.
- User-controlled secure media retention/export/delete and permission audit.
- Optional human-reviewed evidence, assessment, or partner sharing; never opt users into public publication.

**Never describe this MVP as a complete, accredited or independently validated acting conservatory.**

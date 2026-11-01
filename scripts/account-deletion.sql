-- Disposable PostgreSQL fixtures only. No authored curriculum or live users.
INSERT INTO auth.users VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');
INSERT INTO public.passport_entries (id, user_id, tactic, intervention, reflection)
SELECT ('10000000-0000-4000-8000-' || right(id::text,12))::uuid,
  id, 'Deletion audit fixture', 'Deletion audit fixture', 'Keep this exact row'
FROM auth.users;
INSERT INTO public.audition_prep (user_id, data)
SELECT id, jsonb_build_object('fixture_owner',id,'notes','Keep this exact row') FROM auth.users;
-- The privileged fixture bypasses only the published-content guard. Restore it
-- before any ownership/deletion assertions; this does not publish curriculum.
ALTER TABLE public.unit_progress DISABLE TRIGGER validate_actual_unit_before_progress;
INSERT INTO public.unit_progress (user_id,unit_kind,unit_id,status)
SELECT id,'lesson','20000000-0000-4000-8000-000000000001','started' FROM auth.users;
ALTER TABLE public.unit_progress ENABLE TRIGGER validate_actual_unit_before_progress;
CREATE TEMP TABLE original_rows AS
SELECT 'passport' AS kind,user_id,to_jsonb(p) AS data FROM public.passport_entries p
UNION ALL SELECT 'audition',user_id,to_jsonb(p) FROM public.audition_prep p
UNION ALL SELECT 'progress',user_id,to_jsonb(p) FROM public.unit_progress p;

-- Prove the current schema actually leaves orphans after permanent deletion.
DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000001';
SELECT public.audit_assert((SELECT count(*) = 2 FROM public.profiles), 'existing profile cascade works');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.passport_entries), 'baseline Passport orphan reproduced');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.audition_prep), 'baseline audition orphan reproduced');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.unit_progress), 'baseline progress orphan reproduced');

SET slams.approve_account_cascade = 'on';
\ir /audit/proposals/01-prevent-orphans.sql
SELECT public.audit_assert((SELECT count(*) = 3 FROM pg_constraint WHERE conname IN
  ('passport_entries_auth_user_fk','audition_prep_auth_user_fk','unit_progress_auth_user_fk') AND NOT convalidated),
  'phase 1 installs all three unvalidated ownership constraints');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.passport_entries), 'phase 1 preserves legacy Passport');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.audition_prep), 'phase 1 preserves legacy audition');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.unit_progress), 'phase 1 preserves legacy progress');
SELECT public.audit_denied('ALTER TABLE public.passport_entries VALIDATE CONSTRAINT passport_entries_auth_user_fk','23503');

-- A stale but owner-shaped claim cannot create a new orphan after phase 1.
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
SELECT public.audit_denied($q$INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection)
  VALUES (auth.uid(),'fixture','fixture','fixture')$q$, '23503');
SELECT public.audit_denied($q$INSERT INTO public.audition_prep(user_id,data)
  VALUES ('00000000-0000-4000-8000-000000000004','{}')$q$, '42501');
RESET ROLE;
SELECT public.audit_denied($q$INSERT INTO public.audition_prep(user_id,data)
  VALUES ('00000000-0000-4000-8000-000000000004','{}')$q$, '23503');
ALTER TABLE public.unit_progress DISABLE TRIGGER validate_actual_unit_before_progress;
SELECT public.audit_denied($q$INSERT INTO public.unit_progress(user_id,unit_kind,unit_id,status)
  VALUES ('00000000-0000-4000-8000-000000000004','lesson','20000000-0000-4000-8000-000000000001','started')$q$, '23503');
ALTER TABLE public.unit_progress ENABLE TRIGGER validate_actual_unit_before_progress;

SET slams.approve_orphan_quarantine = 'on';
-- Force failure on the third source, after the first two DELETE/INSERT moves.
-- The entire proposal must roll back, including both earlier data moves and DDL.
CREATE FUNCTION public.audit_abort_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Expected injected cleanup failure';
END;
$$;
CREATE TRIGGER audit_abort_cleanup BEFORE DELETE ON public.unit_progress
  FOR EACH ROW EXECUTE FUNCTION public.audit_abort_cleanup();
\echo 'Expect an injected failure; the transaction must roll back every move'
\set ON_ERROR_STOP off
\ir /audit/proposals/02-quarantine-and-validate.sql
\set ON_ERROR_STOP on
SELECT public.audit_assert(to_regnamespace('slams_account_cleanup') IS NULL, 'failed cleanup rolls back archive DDL');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.passport_entries), 'failed cleanup restores earlier Passport move');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.audition_prep), 'failed cleanup restores earlier audition move');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.unit_progress), 'failed cleanup retains progress');
SELECT public.audit_assert((SELECT count(*) = 3 FROM pg_constraint WHERE conname IN
  ('passport_entries_auth_user_fk','audition_prep_auth_user_fk','unit_progress_auth_user_fk') AND NOT convalidated),
  'failed cleanup does not silently validate constraints');
DROP TRIGGER audit_abort_cleanup ON public.unit_progress;
DROP FUNCTION public.audit_abort_cleanup();
-- Retry the actual proposal after the transient failure, without editing data.
\ir /audit/proposals/02-quarantine-and-validate.sql
SELECT public.audit_assert((SELECT count(*) = 3 FROM pg_constraint WHERE conname IN
  ('passport_entries_auth_user_fk','audition_prep_auth_user_fk','unit_progress_auth_user_fk') AND convalidated),
  'all ownership constraints validate after quarantine');
SELECT public.audit_assert((SELECT count(*) = 2 FROM public.passport_entries), 'only legacy Passport orphan removed from active table');
SELECT public.audit_assert((SELECT count(*) = 2 FROM public.audition_prep), 'only legacy audition orphan removed from active table');
SELECT public.audit_assert((SELECT count(*) = 2 FROM public.unit_progress), 'only legacy progress orphan removed from active table');
SELECT public.audit_assert((SELECT to_jsonb(p) - 'archived_at' = o.data
  FROM slams_account_cleanup.passport_entries p JOIN original_rows o ON o.kind='passport' AND o.user_id=p.user_id),
  'Passport archived without losing any source field');
SELECT public.audit_assert((SELECT to_jsonb(p) - 'archived_at' = o.data
  FROM slams_account_cleanup.audition_prep p JOIN original_rows o ON o.kind='audition' AND o.user_id=p.user_id),
  'audition archived without losing any source field');
SELECT public.audit_assert((SELECT to_jsonb(p) - 'archived_at' = o.data
  FROM slams_account_cleanup.unit_progress p JOIN original_rows o ON o.kind='progress' AND o.user_id=p.user_id),
  'progress archived without losing any source field');

SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
SELECT public.audit_denied('SELECT * FROM slams_account_cleanup.passport_entries','42501');
SELECT public.audit_denied('SELECT * FROM slams_account_cleanup.audition_prep','42501');
SELECT public.audit_denied('SELECT * FROM slams_account_cleanup.unit_progress','42501');
SELECT public.audit_denied($q$DELETE FROM auth.users WHERE id = auth.uid()$q$,'42501');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries), 'B still sees only own Passport');
SET ROLE anon;
SELECT public.audit_denied('SELECT * FROM slams_account_cleanup.passport_entries','42501');
SET ROLE service_role;
SELECT public.audit_denied('SELECT * FROM slams_account_cleanup.passport_entries','42501');
RESET ROLE;

-- Existing-account deletion now cascades, affecting only that owner's rows.
DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000002';
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.profiles), 'B profile removed and C remains');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries), 'future Passport deletion cascades');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.audition_prep), 'future audition deletion cascades');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.unit_progress), 'future progress deletion cascades');
SELECT public.audit_assert((SELECT to_jsonb(p) = o.data FROM public.passport_entries p
  JOIN original_rows o ON o.kind='passport' AND o.user_id=p.user_id), 'C Passport remains byte-for-field equivalent');
SELECT public.audit_assert((SELECT to_jsonb(p) = o.data FROM public.audition_prep p
  JOIN original_rows o ON o.kind='audition' AND o.user_id=p.user_id), 'C audition remains unchanged');
SELECT public.audit_assert((SELECT to_jsonb(p) = o.data FROM public.unit_progress p
  JOIN original_rows o ON o.kind='progress' AND o.user_id=p.user_id), 'C progress remains unchanged');
SELECT public.audit_assert((SELECT count(*) = 8 FROM public.schools), 'all eight school structures survive');
SELECT public.audit_assert((SELECT count(*) = 36 FROM public.curriculum_terms), 'all existing terms survive');
SELECT public.audit_assert((SELECT count(*) = 1 FROM slams_account_cleanup.passport_entries), 'archive unaffected by later account deletion');
SELECT public.audit_assert((SELECT tgenabled = 'O' FROM pg_trigger WHERE tgname='validate_actual_unit_before_progress'), 'curriculum guard remains enabled');
\echo 'Account-deletion proposal passed: legacy retention, quarantine, foreign keys, cascades, isolation and unchanged curriculum'

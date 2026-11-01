-- Run only after scripts/rls.sql in the disposable test database.
-- These fixtures contain no curriculum material or real user information.
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000009');
INSERT INTO public.passport_entries (user_id, tactic, intervention, reflection)
SELECT id, 'Deletion fixture', 'Fixture', 'Fixture' FROM auth.users;
INSERT INTO public.audition_prep (user_id, data)
SELECT id, '{"test":"deletion fixture"}' FROM auth.users;
-- Privileged fixture only: restore the content trigger before exercising the
-- proposal. The existing RLS suite separately proves nonexistent-unit rejection.
ALTER TABLE public.unit_progress DISABLE TRIGGER validate_actual_unit_before_progress;
INSERT INTO public.unit_progress (user_id, unit_kind, unit_id, status)
SELECT id, 'lesson', '10000000-0000-4000-8000-000000000001', 'started' FROM auth.users;
ALTER TABLE public.unit_progress ENABLE TRIGGER validate_actual_unit_before_progress;

-- Reproduce the current bug before installing the proposal.
DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000009';
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000009'), 'existing profile cascade works');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries WHERE user_id = '00000000-0000-4000-8000-000000000009'), 'baseline leaves orphan Passport');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.audition_prep WHERE user_id = '00000000-0000-4000-8000-000000000009'), 'baseline leaves orphan audition');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.unit_progress WHERE user_id = '00000000-0000-4000-8000-000000000009'), 'baseline leaves orphan progress');

\ir /audit/proposals/account-deletion-preflight.sql
\ir /audit/proposals/account-deletion-cleanup.sql

BEGIN;
SELECT public.audit_assert((
  SELECT count(*) = 3 FROM pg_constraint
  WHERE conname IN ('passport_entries_auth_user_fk', 'audition_prep_auth_user_fk', 'unit_progress_auth_user_fk')
    AND confrelid = 'auth.users'::regclass AND confdeltype = 'c' AND NOT convalidated
), 'three staged cascading constraints installed');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.passport_entries), 'proposal retains all Passport rows');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.audition_prep), 'proposal retains all audition rows');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.unit_progress), 'proposal retains all progress rows');
SELECT public.audit_assert((SELECT count(*) = 8 FROM public.schools), 'all eight schools retained');
SELECT public.audit_assert((SELECT count(*) = 36 FROM public.curriculum_terms), 'all 36 terms retained');
SELECT public.audit_denied('ALTER TABLE public.passport_entries VALIDATE CONSTRAINT passport_entries_auth_user_fk', '23503');
SELECT public.audit_denied('ALTER TABLE public.audition_prep VALIDATE CONSTRAINT audition_prep_auth_user_fk', '23503');
SELECT public.audit_denied('ALTER TABLE public.unit_progress VALIDATE CONSTRAINT unit_progress_auth_user_fk', '23503');

-- NOT VALID preserves legacy rows while rejecting new orphan relationships.
SELECT public.audit_denied($q$INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection) VALUES ('00000000-0000-4000-8000-000000000099','test','test','test')$q$, '23503');
SELECT public.audit_denied($q$INSERT INTO public.audition_prep(user_id) VALUES ('00000000-0000-4000-8000-000000000099')$q$, '23503');
-- Isolate FK enforcement from the unrelated published-unit prerequisite.
ALTER TABLE public.unit_progress DISABLE TRIGGER validate_actual_unit_before_progress;
SELECT public.audit_denied($q$INSERT INTO public.unit_progress(user_id,unit_kind,unit_id,status) VALUES ('00000000-0000-4000-8000-000000000099','lesson','10000000-0000-4000-8000-000000000001','started')$q$, '23503');
ALTER TABLE public.unit_progress ENABLE TRIGGER validate_actual_unit_before_progress;

-- A browser user cannot delete an auth account to trigger a cascade.
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
SELECT public.audit_denied($q$DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000001'$q$, '42501');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries), 'B sees only B after proposal');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.audition_prep), 'audition RLS unchanged');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.unit_progress), 'progress RLS unchanged');
SELECT public.audit_denied($q$INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection) VALUES ('00000000-0000-4000-8000-000000000001','test','test','test')$q$, '42501');
RESET ROLE;

SAVEPOINT before_account_delete;
DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000001';
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000001'), 'A profile removed');
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.passport_entries WHERE user_id = '00000000-0000-4000-8000-000000000001'), 'A Passport removed');
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.audition_prep WHERE user_id = '00000000-0000-4000-8000-000000000001'), 'A audition removed');
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.unit_progress WHERE user_id = '00000000-0000-4000-8000-000000000001'), 'A progress removed');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries WHERE user_id = '00000000-0000-4000-8000-000000000002'), 'B Passport retained');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.audition_prep WHERE user_id = '00000000-0000-4000-8000-000000000002'), 'B audition retained');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.unit_progress WHERE user_id = '00000000-0000-4000-8000-000000000002'), 'B progress retained');
SELECT public.audit_assert((SELECT count(*) = 8 FROM public.schools), 'account deletion keeps schools');
SELECT public.audit_assert((SELECT count(*) = 36 FROM public.curriculum_terms), 'account deletion keeps terms');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries WHERE user_id = '00000000-0000-4000-8000-000000000009'), 'legacy Passport orphan is not silently purged');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.audition_prep WHERE user_id = '00000000-0000-4000-8000-000000000009'), 'legacy audition orphan retained');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.unit_progress WHERE user_id = '00000000-0000-4000-8000-000000000009'), 'legacy progress orphan retained');
ROLLBACK TO SAVEPOINT before_account_delete;
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.passport_entries), 'rolling back account deletion restores Passport');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.audition_prep), 'rolling back account deletion restores audition');
SELECT public.audit_assert((SELECT count(*) = 3 FROM public.unit_progress), 'rolling back account deletion restores progress');
SELECT public.audit_assert((SELECT count(*) = 1 FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000001'), 'rolling back restores account');

-- Profile removal alone must not delete the account or its progress.
DELETE FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000002';
SELECT public.audit_assert((SELECT count(*) = 1 FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000002'), 'profile removal keeps account');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.passport_entries WHERE user_id = '00000000-0000-4000-8000-000000000002'), 'profile removal keeps progress');
ROLLBACK;

\echo 'Account-deletion proposal audit passed: legacy preservation, future cascade, ownership, rollback'

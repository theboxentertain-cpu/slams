-- Disposable PostgreSQL only: simulate Supabase's roles and auth.uid() contract.
-- This validates the checked-in policies, not the deployed Supabase instance.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;

\ir /audit/migrations/0000_sprint01b_foundation.sql
\ir /audit/migrations/0001_validate_actual_unit_progress.sql
\ir /audit/migrations/0002_curriculum_reviewed_material.sql

CREATE FUNCTION public.audit_assert(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'RLS audit failed: %', message; END IF;
END;
$$;
CREATE FUNCTION public.audit_denied(statement text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_state text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_state = RETURNED_SQLSTATE;
    IF actual_state = expected_state THEN RETURN; END IF;
    RAISE EXCEPTION 'Expected %, received %: %', expected_state, actual_state, SQLERRM;
  END;
  RAISE EXCEPTION 'Expected access denial: %', statement;
END;
$$;

BEGIN;
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.profiles), 'A sees only own auto-created profile');
INSERT INTO public.passport_entries (id, user_id, tactic, intervention, reflection)
VALUES ('10000000-0000-4000-8000-000000000001', auth.uid(), 'Test tactic', 'Test intervention', 'Test reflection');
INSERT INTO public.audition_prep (user_id, data) VALUES (auth.uid(), '{"test":"A"}');
UPDATE public.passport_entries SET reflection = 'Updated A' WHERE user_id = auth.uid();
SELECT public.audit_assert((SELECT reflection = 'Updated A' FROM public.passport_entries), 'A can update own Passport');
SELECT public.audit_denied($q$UPDATE public.passport_entries SET user_id = '00000000-0000-4000-8000-000000000002'$q$, '42501');
SELECT public.audit_denied($q$INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection) VALUES ('00000000-0000-4000-8000-000000000002','test','test','test')$q$, '42501');
SELECT public.audit_denied($q$INSERT INTO public.audition_prep(user_id,data) VALUES ('00000000-0000-4000-8000-000000000002','{}')$q$, '42501');
SELECT public.audit_denied($q$UPDATE public.audition_prep SET user_id = '00000000-0000-4000-8000-000000000002'$q$, '42501');
SELECT public.audit_denied($q$UPDATE public.profiles SET id = '00000000-0000-4000-8000-000000000002'$q$, '42501');
SELECT public.audit_denied($q$INSERT INTO public.unit_progress VALUES (auth.uid(),'lesson','20000000-0000-4000-8000-000000000001','completed',now())$q$, 'P0001');
SELECT public.audit_denied($q$UPDATE public.schools SET name = 'Forbidden'$q$, '42501');
SELECT public.audit_denied($q$INSERT INTO public.curriculum_imports(pack_version) VALUES (1)$q$, '42501');

SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.passport_entries), 'B cannot read A Passport');
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.audition_prep), 'B cannot read A audition');
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.profiles), 'B sees only own profile');
WITH changed AS (UPDATE public.passport_entries SET reflection = 'Stolen' RETURNING id)
SELECT public.audit_assert((SELECT count(*) = 0 FROM changed), 'B cannot update A Passport');
WITH removed AS (DELETE FROM public.passport_entries RETURNING id)
SELECT public.audit_assert((SELECT count(*) = 0 FROM removed), 'B cannot delete A Passport');
WITH changed AS (UPDATE public.audition_prep SET data = '{}' RETURNING user_id)
SELECT public.audit_assert((SELECT count(*) = 0 FROM changed), 'B cannot update A audition');
WITH removed AS (DELETE FROM public.audition_prep RETURNING user_id)
SELECT public.audit_assert((SELECT count(*) = 0 FROM removed), 'B cannot delete A audition');
-- This is exactly why an ignored duplicate is NOT persistence confirmation.
WITH inserted AS (
  INSERT INTO public.passport_entries (id, user_id, tactic, intervention, reflection)
  VALUES ('10000000-0000-4000-8000-000000000001', auth.uid(), 'B', 'B', 'B')
  ON CONFLICT (id) DO NOTHING RETURNING id
)
SELECT public.audit_assert((SELECT count(*) = 0 FROM inserted), 'foreign-owner ID collision returns no saved row');
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.passport_entries), 'collision did not reveal A record');

-- Unit-progress ownership is tested with a temporary row, without inventing
-- curriculum material. The privileged fixture bypasses only the content trigger.
RESET ROLE;
ALTER TABLE public.unit_progress DISABLE TRIGGER validate_actual_unit_before_progress;
INSERT INTO public.unit_progress VALUES ('00000000-0000-4000-8000-000000000001','lesson','20000000-0000-4000-8000-000000000001','started',now());
ALTER TABLE public.unit_progress ENABLE TRIGGER validate_actual_unit_before_progress;
SET ROLE authenticated;
SELECT public.audit_assert((SELECT count(*) = 0 FROM public.unit_progress), 'B cannot read A unit progress');
WITH changed AS (UPDATE public.unit_progress SET status = 'completed' RETURNING user_id)
SELECT public.audit_assert((SELECT count(*) = 0 FROM changed), 'B cannot update A unit progress');
WITH removed AS (DELETE FROM public.unit_progress RETURNING user_id)
SELECT public.audit_assert((SELECT count(*) = 0 FROM removed), 'B cannot delete A unit progress');
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
SELECT public.audit_assert((SELECT count(*) = 1 FROM public.unit_progress), 'A can read own progress');
WITH removed AS (DELETE FROM public.unit_progress RETURNING user_id)
SELECT public.audit_assert((SELECT count(*) = 1 FROM removed), 'A can delete own progress');
SELECT public.audit_assert((SELECT reflection = 'Updated A' FROM public.passport_entries), 'A data unchanged after B operations');
WITH removed AS (DELETE FROM public.passport_entries RETURNING id)
SELECT public.audit_assert((SELECT count(*) = 1 FROM removed), 'A can delete own Passport');
WITH removed AS (DELETE FROM public.audition_prep RETURNING user_id)
SELECT public.audit_assert((SELECT count(*) = 1 FROM removed), 'A can delete own audition');

SET ROLE anon;
SET request.jwt.claim.sub = '';
SELECT public.audit_denied('SELECT * FROM public.passport_entries', '42501');
SELECT public.audit_denied('SELECT * FROM public.audition_prep', '42501');
SELECT public.audit_denied('SELECT * FROM public.unit_progress', '42501');
SELECT public.audit_denied('SELECT * FROM public.profiles', '42501');
SELECT public.audit_assert((SELECT count(*) = 8 FROM public.schools), 'anonymous curriculum structure is public');
SELECT public.audit_denied('DELETE FROM public.schools', '42501');
ROLLBACK;
\echo 'RLS audit passed: ownership, spoofing, collision, anonymous access, content guard'

-- PROPOSAL ONLY. Not registered in the Drizzle migration journal.
-- Review docs/sprint-01b-closure.md before any operator applies this to a backend.
-- Adds future hard-deletion cleanup without deleting or validating legacy rows.
-- Existing profiles already reference auth.users(id) ON DELETE CASCADE.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.passport_entries
  ADD CONSTRAINT passport_entries_auth_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.audition_prep
  ADD CONSTRAINT audition_prep_auth_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.unit_progress
  ADD CONSTRAINT unit_progress_auth_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

COMMIT;

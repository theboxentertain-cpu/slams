-- PROPOSAL ONLY. Not part of the application's migration discovery path.
-- Changes future permanent account deletion semantics; requires operator review.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$
BEGIN
  IF current_setting('slams.approve_account_cascade', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Requires manual account-cascade approval';
  END IF;
END;
$$;

-- NOT VALID retains legacy orphans while enforcing new references immediately.
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

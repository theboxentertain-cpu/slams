-- PROPOSAL ONLY. Run once after phase 1 and a reviewed retention/backup decision.
-- Moves legacy orphans out of active tables, preserving complete source rows.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$
BEGIN
  IF current_setting('slams.approve_orphan_quarantine', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Requires manual orphan-quarantine approval';
  END IF;
END;
$$;

-- Keep the absence-of-owner decision stable and stop concurrent source writes.
-- Use a maintenance window; lock acquisition fails promptly instead of waiting.
LOCK TABLE auth.users IN SHARE MODE;
LOCK TABLE public.passport_entries, public.audition_prep, public.unit_progress
  IN SHARE ROW EXCLUSIVE MODE;

-- Deliberately fail if this archive already exists: never overwrite a prior run.
CREATE SCHEMA slams_account_cleanup;
REVOKE ALL ON SCHEMA slams_account_cleanup FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE slams_account_cleanup.passport_entries
  (LIKE public.passport_entries INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE slams_account_cleanup.audition_prep
  (LIKE public.audition_prep INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE slams_account_cleanup.unit_progress
  (LIKE public.unit_progress INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
ALTER TABLE slams_account_cleanup.passport_entries ADD COLUMN archived_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE slams_account_cleanup.audition_prep ADD COLUMN archived_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE slams_account_cleanup.unit_progress ADD COLUMN archived_at timestamptz NOT NULL DEFAULT now();
REVOKE ALL ON ALL TABLES IN SCHEMA slams_account_cleanup FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE slams_account_cleanup.passport_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE slams_account_cleanup.audition_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE slams_account_cleanup.unit_progress ENABLE ROW LEVEL SECURITY;

-- Each removal and archive insert is one statement in the same transaction.
-- Any insert/validation error rolls back every move; conflicts are never ignored.
WITH removed AS (
  DELETE FROM public.passport_entries p
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)
  RETURNING p.*
)
INSERT INTO slams_account_cleanup.passport_entries
SELECT removed.*, transaction_timestamp() FROM removed;
WITH removed AS (
  DELETE FROM public.audition_prep p
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)
  RETURNING p.*
)
INSERT INTO slams_account_cleanup.audition_prep
SELECT removed.*, transaction_timestamp() FROM removed;
WITH removed AS (
  DELETE FROM public.unit_progress p
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)
  RETURNING p.*
)
INSERT INTO slams_account_cleanup.unit_progress
SELECT removed.*, transaction_timestamp() FROM removed;

ALTER TABLE public.passport_entries VALIDATE CONSTRAINT passport_entries_auth_user_fk;
ALTER TABLE public.audition_prep VALIDATE CONSTRAINT audition_prep_auth_user_fk;
ALTER TABLE public.unit_progress VALIDATE CONSTRAINT unit_progress_auth_user_fk;
COMMIT;

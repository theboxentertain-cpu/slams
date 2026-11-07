-- REVIEW-ONLY. Gate races during confirmed account deletion; requires 0009.
BEGIN;
-- Abort on legacy orphans instead of inventing ownership or discarding records.
-- These constraints also reject delayed inserts after an Auth user is removed.
ALTER TABLE public.passport_entries ADD CONSTRAINT passport_entries_auth_owner
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.audition_prep ADD CONSTRAINT audition_prep_auth_owner
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.unit_progress ADD CONSTRAINT unit_progress_auth_owner
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.passport_entries VALIDATE CONSTRAINT passport_entries_auth_owner;
ALTER TABLE public.audition_prep VALIDATE CONSTRAINT audition_prep_auth_owner;
ALTER TABLE public.unit_progress VALIDATE CONSTRAINT unit_progress_auth_owner;
CREATE TABLE public.account_deletion_jobs (
 user_id uuid PRIMARY KEY, status text NOT NULL CHECK(status IN ('pending','completed')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_deletion_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_jobs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.account_deletion_jobs TO service_role;

-- Serialize actor writes with the service-only deletion marker transaction.
-- VOLATILE PL/pgSQL rechecks pending state after acquiring the lock.
CREATE FUNCTION public.account_guard_lock(target uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF current_setting('role',true) IN ('authenticated','anon') AND target IS DISTINCT FROM auth.uid() THEN
  RAISE EXCEPTION 'Account ownership mismatch' USING ERRCODE='42501';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('slams-account:' || target::text,0));
 IF current_setting('role',true) IN ('authenticated','anon') THEN
  IF current_setting('transaction_isolation')<>'read committed' THEN
   RAISE EXCEPTION 'Actor writes require read committed isolation' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=target) OR
    EXISTS(SELECT 1 FROM public.account_deletion_jobs WHERE user_id=target) THEN
   RAISE EXCEPTION 'Account deletion is pending' USING ERRCODE='42501';
  END IF;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.account_guard_lock(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.account_owned_write_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid;
BEGIN
 IF TG_TABLE_NAME='profiles' THEN
  IF TG_OP='DELETE' THEN target:=OLD.id; ELSE target:=NEW.id; END IF;
 ELSE
  IF TG_OP='DELETE' THEN target:=OLD.user_id; ELSE target:=NEW.user_id; END IF;
 END IF;
 PERFORM public.account_guard_lock(target);
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.account_owned_write_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER deletion_job_serialization BEFORE INSERT OR UPDATE ON public.account_deletion_jobs
 FOR EACH ROW EXECUTE FUNCTION public.account_owned_write_guard();

-- Deliberately narrow SECURITY DEFINER API: no supplied user id; boolean only.
CREATE FUNCTION public.account_is_active() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL
 AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=auth.uid())
 AND NOT EXISTS(SELECT 1 FROM public.account_deletion_jobs j WHERE j.user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.account_is_active() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.account_is_active() TO authenticated,service_role;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['profiles','passport_entries','audition_prep','unit_progress','actor_projects','actor_project_revisions','actor_auditions','actor_sides','actor_work_scenes','actor_work_rehearsals','actor_journal_entries','actor_journal_revisions'] LOOP
  EXECUTE format('CREATE TRIGGER account_write_serialization BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.account_owned_write_guard()',tab);
  EXECUTE format('CREATE POLICY "Active account required" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((select public.account_is_active())) WITH CHECK ((select public.account_is_active()))',tab);
 END LOOP;
END; $$;
COMMIT;

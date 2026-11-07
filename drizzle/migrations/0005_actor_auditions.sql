-- SLAMS Actor at Work: multi-audition records.
-- PROPOSAL ONLY. Never auto-apply from client or CI.
-- Requires reviewed/applied actor_projects schema (0004) first.
-- Do NOT replay proposal-only migration 0003 against production blindly.
BEGIN;

CREATE TABLE public.actor_auditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  role_name TEXT NOT NULL DEFAULT '' CHECK (char_length(role_name) <= 120),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'preparing'
    CHECK (status IN ('preparing', 'ready', 'submitted', 'closed')),
  notes JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(notes) = 'object' AND octet_length(notes::text) <= 24000),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT actor_auditions_owner_project
    FOREIGN KEY (user_id, project_id)
    REFERENCES public.actor_projects (user_id, id)
    ON DELETE RESTRICT
);
CREATE INDEX actor_auditions_recent_idx ON public.actor_auditions (user_id, updated_at DESC);
CREATE INDEX actor_auditions_project_idx ON public.actor_auditions (user_id, project_id);

-- Server owns revision counter and immutable identity. Client writes cannot
-- turn one person's audition into another person's record.
CREATE FUNCTION public.actor_auditions_before_write() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.revision := 1;
    NEW.created_at := now();
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Audition identity and ownership are immutable';
    END IF;
    NEW.revision := OLD.revision + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER actor_auditions_before_write_trigger
BEFORE INSERT OR UPDATE ON public.actor_auditions
FOR EACH ROW EXECUTE FUNCTION public.actor_auditions_before_write();

REVOKE ALL ON FUNCTION public.actor_auditions_before_write() FROM PUBLIC, anon, authenticated;
ALTER TABLE public.actor_auditions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.actor_auditions FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.actor_auditions TO authenticated;
GRANT ALL ON public.actor_auditions TO service_role;

CREATE POLICY "Actor reads own auditions" ON public.actor_auditions
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Actor creates own auditions" ON public.actor_auditions
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Actor updates own auditions" ON public.actor_auditions
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Deliberately no client DELETE policy or grant in V1. Never lose existing
-- legacy audition_prep or allow unreviewed destructive batch operations.
COMMIT;

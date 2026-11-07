-- PROPOSED only: script sides and actor-authored line-anchored beat notes.
-- Depends on reviewed 0004 actor_projects and 0005 actor_auditions deployments.
-- DO NOT APPLY AUTOMATICALLY: inspect real migration ledger, RLS and rollback first.
BEGIN;

ALTER TABLE public.actor_auditions
  ADD CONSTRAINT actor_auditions_user_id_id_key UNIQUE (user_id, id);

CREATE TABLE public.actor_sides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  audition_id UUID,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  -- Text is immutable after insert so anchors cannot silently drift.
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 25000 AND octet_length(content) <= 60000),
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(annotations) = 'array' AND octet_length(annotations::text) <= 24000),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT actor_sides_one_parent CHECK (num_nonnulls(project_id, audition_id) = 1),
  CONSTRAINT actor_sides_project_owner FOREIGN KEY (user_id, project_id)
    REFERENCES public.actor_projects (user_id, id) ON DELETE RESTRICT,
  CONSTRAINT actor_sides_audition_owner FOREIGN KEY (user_id, audition_id)
    REFERENCES public.actor_auditions (user_id, id) ON DELETE RESTRICT
);
CREATE INDEX actor_sides_owner_recent ON public.actor_sides (user_id, updated_at DESC);
CREATE INDEX actor_sides_by_project ON public.actor_sides (user_id, project_id);
CREATE INDEX actor_sides_by_audition ON public.actor_sides (user_id, audition_id);

CREATE FUNCTION public.actor_sides_before_write() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.revision := 1;
    NEW.created_at := now();
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.audition_id IS DISTINCT FROM OLD.audition_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Script text, identity and parent association are immutable';
    END IF;
    NEW.revision := OLD.revision + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER actor_sides_before_write_trigger
BEFORE INSERT OR UPDATE ON public.actor_sides
FOR EACH ROW EXECUTE FUNCTION public.actor_sides_before_write();
REVOKE ALL ON FUNCTION public.actor_sides_before_write() FROM PUBLIC, anon, authenticated;
ALTER TABLE public.actor_sides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.actor_sides FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.actor_sides TO authenticated;
GRANT ALL ON public.actor_sides TO service_role;

CREATE POLICY "Actor reads own script sides" ON public.actor_sides
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Actor creates own script sides" ON public.actor_sides
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Actor updates own script sides" ON public.actor_sides
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- No authenticated DELETE in initial release; avoids accidental loss of scripts.
COMMIT;

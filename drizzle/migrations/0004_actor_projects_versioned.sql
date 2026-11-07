-- SLAMS Actor at Work: PROPOSED migration only.
-- DO NOT APPLY until actual migration ledger, RLS, ownership and rollback are verified.
-- No migration is executed by this pull request.
BEGIN;

CREATE TABLE public.actor_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  role_name TEXT NOT NULL DEFAULT '' CHECK (char_length(role_name) <= 120),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  notes JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(notes) = 'object' AND octet_length(notes::text) <= 24000),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, id)
);
CREATE INDEX actor_projects_owner_recent ON public.actor_projects (user_id, updated_at DESC);

-- Revision rows are never client-writable. Every committed project snapshot is
-- recorded by a trusted server-side trigger in the same transaction.
CREATE TABLE public.actor_project_revisions (
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  title TEXT NOT NULL,
  role_name TEXT NOT NULL,
  status TEXT NOT NULL,
  notes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, revision),
  CONSTRAINT actor_project_revisions_parent FOREIGN KEY (user_id, project_id)
    REFERENCES public.actor_projects(user_id, id) ON DELETE CASCADE
);
CREATE INDEX actor_project_revisions_owner ON public.actor_project_revisions
  (user_id, project_id, revision DESC);

CREATE FUNCTION public.actor_projects_before_write() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.revision := 1;
    NEW.created_at := now();
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Project identity and ownership are immutable';
    END IF;
    NEW.revision := OLD.revision + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER actor_projects_before_write_trigger
BEFORE INSERT OR UPDATE ON public.actor_projects
FOR EACH ROW EXECUTE FUNCTION public.actor_projects_before_write();

CREATE FUNCTION public.actor_projects_record_revision() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.actor_project_revisions
    (project_id, user_id, revision, title, role_name, status, notes, created_at)
  VALUES (NEW.id, NEW.user_id, NEW.revision, NEW.title, NEW.role_name,
          NEW.status, NEW.notes, NEW.updated_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER actor_projects_record_revision_trigger
AFTER INSERT OR UPDATE ON public.actor_projects
FOR EACH ROW EXECUTE FUNCTION public.actor_projects_record_revision();

REVOKE ALL ON FUNCTION public.actor_projects_before_write() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actor_projects_record_revision() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.actor_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_project_revisions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actor_projects TO authenticated;
GRANT SELECT ON public.actor_project_revisions TO authenticated;
GRANT ALL ON public.actor_projects, public.actor_project_revisions TO service_role;
REVOKE ALL ON public.actor_projects, public.actor_project_revisions FROM anon;

CREATE POLICY "Actor sees own projects" ON public.actor_projects
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Actor creates own projects" ON public.actor_projects
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Actor edits own projects" ON public.actor_projects
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Actor deletes own projects" ON public.actor_projects
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Actor sees own project history" ON public.actor_project_revisions
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

COMMIT;

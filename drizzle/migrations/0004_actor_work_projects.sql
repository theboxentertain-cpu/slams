-- SLAMS Actor at Work — independent, owner-scoped multi-project files.
-- Apply via controlled migration before enabling signed-in project features.
-- Live deployment and two-account RLS verification are mandatory release gates.

CREATE TABLE public.actor_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  kind TEXT NOT NULL DEFAULT 'audition' CHECK (kind IN ('audition','role','production','personal')),
  role_name TEXT NOT NULL DEFAULT '' CHECK (char_length(role_name) <= 160),
  due_date DATE NULL,
  given_circumstances TEXT NOT NULL DEFAULT '' CHECK (char_length(given_circumstances) <= 4000),
  objective TEXT NOT NULL DEFAULT '' CHECK (char_length(objective) <= 2000),
  obstacle TEXT NOT NULL DEFAULT '' CHECK (char_length(obstacle) <= 2000),
  playable_action TEXT NOT NULL DEFAULT '' CHECK (char_length(playable_action) <= 2000),
  rehearsal_notes TEXT NOT NULL DEFAULT '' CHECK (char_length(rehearsal_notes) <= 6000),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX actor_projects_owner_active_idx ON public.actor_projects
  (user_id, status, updated_at DESC);

ALTER TABLE public.actor_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_projects FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actor_projects TO authenticated;
GRANT ALL ON public.actor_projects TO service_role;
REVOKE ALL ON public.actor_projects FROM anon;

CREATE POLICY "Actor projects select own" ON public.actor_projects
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Actor projects create own" ON public.actor_projects
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Actor projects update own" ON public.actor_projects
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Actor projects delete own" ON public.actor_projects
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

COMMENT ON TABLE public.actor_projects IS
  'Private Actor at Work project files. No automatic migration from legacy audition_prep.';

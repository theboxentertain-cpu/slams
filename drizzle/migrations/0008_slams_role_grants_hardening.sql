-- SLAMS role privileges hardening AFTER reviewed 0004–0007.
-- Staging-first migration. NEVER run against Lovable production without a
-- verified restorable backup, reviewed deployment and explicit release approval.
-- Foundation migrations 0000–0002 are already applied and must not be edited.
-- Supabase public-schema default ACLs can grant ALL, including TRUNCATE,
-- regardless of the narrower GRANT lines in the original migrations.
-- Scope is the 17 known SLAMS app tables; do not alter auth/storage internals.
BEGIN;

-- Fix *future* public-schema objects created by postgres. The global
-- function EXECUTE default must be revoked globally because a per-schema
-- revoke cannot undo PostgreSQL's built-in PUBLIC EXECUTE default.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Existing tables retain their grants unless explicitly revoked.
REVOKE ALL ON TABLE
  public.profiles,
  public.passport_entries,
  public.audition_prep,
  public.schools,
  public.curriculum_years,
  public.curriculum_terms,
  public.curriculum_courses,
  public.curriculum_workshops,
  public.curriculum_lessons,
  public.curriculum_exercises,
  public.curriculum_assessments,
  public.curriculum_imports,
  public.unit_progress,
  public.actor_projects,
  public.actor_project_revisions,
  public.actor_auditions,
  public.actor_sides
FROM PUBLIC, anon, authenticated;

-- Owner-scoped legacy data tables.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.passport_entries, public.audition_prep, public.unit_progress TO authenticated;

-- Curriculum structure is public-read only; import log is signed-in-read only.
GRANT SELECT ON
  public.schools, public.curriculum_years, public.curriculum_terms,
  public.curriculum_courses, public.curriculum_workshops,
  public.curriculum_lessons, public.curriculum_exercises,
  public.curriculum_assessments
TO anon, authenticated;
GRANT SELECT ON public.curriculum_imports TO authenticated;

-- Actor at Work: never grant DELETE, TRUNCATE, TRIGGER or REFERENCES to clients.
GRANT SELECT, INSERT, UPDATE ON public.actor_projects TO authenticated;
GRANT SELECT ON public.actor_project_revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.actor_auditions, public.actor_sides TO authenticated;

-- Keep service_role's existing ALL grants; no admin access is removed.
-- Trigger functions are internal, not RPC methods for anon/authenticated.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_unit_progress() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.require_reviewed_curriculum() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actor_projects_before_write() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actor_projects_record_revision() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actor_auditions_before_write() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actor_sides_before_write() FROM PUBLIC, anon, authenticated;

COMMIT;

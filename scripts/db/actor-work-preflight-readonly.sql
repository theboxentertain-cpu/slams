-- SLAMS Actor at Work: READ-ONLY database preflight.
-- Safe to inspect an enabled database. Does not migrate or create test data.
-- Run with an approved read-only connection in a controlled environment:
-- psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/db/actor-work-preflight-readonly.sql
--
-- Inspect the output against docs/ops/ACTOR_WORK_DATABASE_RELEASE_GATE.md.
-- The repository's Drizzle journal includes 0003 ACADEMIC PROGRESSION, which is
-- deferred. NEVER use a generic "apply all pending migrations" command here.

\set ON_ERROR_STOP on
\pset pager off
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name,
       current_user AS db_role,
       current_setting('server_version') AS postgres_version;

-- Keep this first: missing Actor at Work tables means deployment is incomplete.
-- The project may be a fresh, separate Supabase instance; verify backend identity
-- before interpreting an empty catalog as an upgraded Lovable database.
WITH expected(name) AS (
  VALUES ('actor_projects'), ('actor_project_revisions'), ('actor_auditions'),
         ('actor_sides'),
         ('audition_prep'), ('passport_entries'),
         ('academic_reviewers'), ('academic_policies')
)
SELECT expected.name,
       to_regclass(format('public.%I', expected.name)) IS NOT NULL AS exists,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       COALESCE(p.policy_count, 0) AS policy_count,
       COALESCE(p.policy_commands, '') AS policy_commands
FROM expected
LEFT JOIN pg_class c ON c.oid = to_regclass(format('public.%I', expected.name))
LEFT JOIN LATERAL (
  SELECT count(*)::integer AS policy_count,
         string_agg(DISTINCT pol.cmd, ',' ORDER BY pol.cmd) AS policy_commands
  FROM pg_policies pol WHERE pol.schemaname='public' AND pol.tablename=expected.name
) p ON true
ORDER BY expected.name;

-- Drizzle's on-disk journal is NOT proof of applied migrations.
-- The live ledger and local journal must be manually reconciled.
SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
       AS drizzle_ledger_exists,
       to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
       AS supabase_ledger_exists;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='drizzle' AND table_name='__drizzle_migrations'
ORDER BY ordinal_position;
-- New/isolated Supabase projects may have no Drizzle schema or ledger.
-- psql conditional prevents an undefined_table exception in that case.
-- Query the actual ledger only when present; never infer applied migrations
-- from the repository's JSON journal.
SELECT CASE WHEN to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
       THEN 'true' ELSE 'false' END AS has_drizzle_ledger
\gset
\if :has_drizzle_ledger
  SELECT to_jsonb(m) AS migration_ledger_row
  FROM drizzle.__drizzle_migrations AS m
  LIMIT 30;
\else
  SELECT 'ABSENT — no Drizzle migration history in this database' AS migration_ledger_status;
\endif

-- Check whether the required RLS policy commands actually exist.
SELECT tablename, cmd, roles::text AS allowed_roles, policyname, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('actor_projects','actor_project_revisions','actor_auditions','actor_sides')
ORDER BY tablename, cmd, policyname;

-- Verify GRANT and implicit PUBLIC rights. Expected:
-- After 0007, authenticated has SELECT/INSERT/UPDATE but NO DELETE on actor_projects.
-- actor_project_revisions: authenticated SELECT only.
-- actor_auditions and actor_sides: authenticated SELECT/INSERT/UPDATE only, NO DELETE.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('actor_projects','actor_project_revisions','actor_auditions','actor_sides')
  AND grantee IN ('PUBLIC','anon','authenticated','service_role')
ORDER BY table_name,grantee,privilege_type;

-- Check EFFECTIVE permissions: Supabase default ACLs may grant TRUNCATE,
-- TRIGGER, DELETE or history writes despite apparently narrow migration GRANTs.
-- RLS does NOT restrict TRUNCATE. These must all be false after 0008.
SELECT c.relname AS table_name,
       has_table_privilege('anon', c.oid, 'TRUNCATE') AS anon_can_truncate,
       has_table_privilege('authenticated', c.oid, 'TRUNCATE') AS user_can_truncate,
       has_table_privilege('authenticated', c.oid, 'TRIGGER') AS user_can_modify_triggers,
       has_table_privilege('authenticated', c.oid, 'DELETE') AS user_can_delete,
       has_table_privilege('authenticated', c.oid, 'INSERT') AS user_can_insert
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
  AND c.relname IN ('actor_projects','actor_project_revisions',
                    'actor_auditions','actor_sides',
                    'profiles','audition_prep','passport_entries','unit_progress')
ORDER BY c.relname;

SELECT n.nspname, p.proname, p.prosecdef AS security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS user_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('handle_new_user','validate_unit_progress',
                    'require_reviewed_curriculum',
                    'actor_projects_before_write','actor_projects_record_revision',
                    'actor_auditions_before_write','actor_sides_before_write')
ORDER BY p.proname;

-- Check that the composite (user_id, project_id) FK and uniqueness really exist.
SELECT conrelid::regclass::text AS table_name,
       conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace='public'::regnamespace
  AND conrelid IN (
    SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace
    AND relname IN ('actor_projects','actor_project_revisions','actor_auditions','actor_sides')
  )
ORDER BY table_name,conname;

-- Inspect function privileges, SECURITY DEFINER and search_path settings.
SELECT n.nspname AS schema_name, p.proname AS function_name,
       p.prosecdef AS security_definer,
       p.proconfig AS config,
       pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN (
    'actor_projects_before_write',
    'actor_projects_record_revision',
    'actor_auditions_before_write',
    'actor_sides_before_write'
  )
ORDER BY p.proname;

SELECT t.tgrelid::regclass::text AS table_name,
       t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
WHERE NOT t.tgisinternal
  AND t.tgrelid IN (
    SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace
      AND relname IN ('actor_projects','actor_project_revisions','actor_auditions','actor_sides')
  )
ORDER BY table_name,t.tgname;

-- No schema or data changes; ROLLBACK is intentional.
ROLLBACK;

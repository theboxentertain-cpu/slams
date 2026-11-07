-- SLAMS database deployment preflight: READ ONLY. Never inserts/updates/deletes.
-- Query through a trusted authenticated SQL console with schema inspection access.
-- The Drizzle JSON journal in GitHub is NOT proof a migration ran in the database.
-- Do not share actor data, service-role tokens, passwords or API keys.
SELECT
  current_database() AS database_name,
  current_user AS inspection_role,
  to_regclass('drizzle.__drizzle_migrations')::text AS drizzle_ledger_table,
  to_regclass('supabase_migrations.schema_migrations')::text AS supabase_ledger_table,
  to_regclass('public.actor_projects')::text AS actor_projects,
  to_regclass('public.actor_project_revisions')::text AS actor_project_revisions,
  to_regclass('public.actor_auditions')::text AS actor_auditions,
  to_regclass('public.actor_sides')::text AS actor_sides,
  to_regclass('public.academic_policies')::text AS academic_policies,
  to_regclass('public.audition_prep')::text AS legacy_audition_prep;

-- No actor/project rows queried; only SQL catalog metadata.
WITH required(table_name) AS (
 VALUES ('actor_projects'), ('actor_project_revisions'),
        ('actor_auditions'), ('actor_sides')
)
SELECT r.table_name,
       c.oid IS NOT NULL AS table_exists,
       coalesce(c.relrowsecurity,false) AS rls_enabled,
       CASE WHEN c.oid IS NULL THEN NULL
            ELSE has_table_privilege('authenticated', c.oid,'SELECT') END AS signed_in_select,
       CASE WHEN c.oid IS NULL THEN NULL
            ELSE has_table_privilege('authenticated', c.oid,'INSERT') END AS signed_in_insert,
       CASE WHEN c.oid IS NULL THEN NULL
            ELSE has_table_privilege('authenticated', c.oid,'UPDATE') END AS signed_in_update,
       CASE WHEN c.oid IS NULL THEN NULL
            ELSE has_table_privilege('authenticated', c.oid,'DELETE') END AS signed_in_delete,
       CASE WHEN c.oid IS NULL THEN NULL
            ELSE has_table_privilege('anon', c.oid,'SELECT') END AS anonymous_select,
       (SELECT string_agg(p.policyname || ':' || p.cmd || ':' ||
             array_to_string(p.roles,','), ' | ' ORDER BY p.policyname)
          FROM pg_policies p WHERE p.schemaname='public'
            AND p.tablename=r.table_name) AS rls_policies,
       (SELECT string_agg(t.tgname, ' | ' ORDER BY t.tgname)
          FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal) AS triggers,
       (SELECT string_agg(con.conname || ':' || pg_get_constraintdef(con.oid),
                          ' | ' ORDER BY con.conname)
          FROM pg_constraint con WHERE con.conrelid=c.oid
            AND con.contype IN ('f','u','p','c')) AS constraints
FROM required r
LEFT JOIN pg_class c
  ON c.oid = to_regclass(format('public.%I',r.table_name))
ORDER BY r.table_name;

-- Expected release state after reviewed migrations 0004–0007:
-- all four tables exist, have RLS, and anonymous SELECT is false;
-- actor_projects/actor_auditions/actor_sides have their triggers;
-- actor_project_revisions is read-only to authenticated;
-- authenticated DELETE is false on all four actor-work tables;
-- actor_sides composite FKs refer to (user_id,id) on both parents.
-- Actual ledger rows must be inspected separately AFTER confirming which
-- migration tooling owns the deployment. Never infer "applied" from this file.

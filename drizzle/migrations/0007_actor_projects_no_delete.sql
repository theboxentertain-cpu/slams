-- Actor at Work release hardening.
-- PROPOSAL ONLY: review existing deployment ledger before applying.
-- Requires reviewed public.actor_projects (0004), auditions (0005) and sides (0006).
-- Existing Actor at Work UI offers archive/restore, not hard delete.
-- Remove the ability for a compromised actor client to permanently erase
-- entire projects and their cascading revision history through direct REST SQL.
BEGIN;
REVOKE DELETE ON TABLE public.actor_projects FROM authenticated;
DROP POLICY IF EXISTS "Actor deletes own projects" ON public.actor_projects;
COMMIT;

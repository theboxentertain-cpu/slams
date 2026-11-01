-- Read-only, aggregate-only inventory for an authorized database operator.
-- Counts require visibility of all rows; run with a trusted database role,
-- not as an ordinary authenticated user whose RLS view can hide orphans.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';

SELECT 'passport_entries' AS table_name, count(*) AS orphan_rows
FROM public.passport_entries AS progress
WHERE NOT EXISTS (SELECT 1 FROM auth.users AS owner WHERE owner.id = progress.user_id)
UNION ALL
SELECT 'audition_prep', count(*)
FROM public.audition_prep AS progress
WHERE NOT EXISTS (SELECT 1 FROM auth.users AS owner WHERE owner.id = progress.user_id)
UNION ALL
SELECT 'unit_progress', count(*)
FROM public.unit_progress AS progress
WHERE NOT EXISTS (SELECT 1 FROM auth.users AS owner WHERE owner.id = progress.user_id);

SELECT relation.relname AS table_name, constraint_row.conname,
       constraint_row.convalidated, pg_get_constraintdef(constraint_row.oid) AS definition
FROM pg_constraint AS constraint_row
JOIN pg_class AS relation ON relation.oid = constraint_row.conrelid
JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
WHERE namespace.nspname = 'public'
  AND relation.relname IN ('profiles', 'passport_entries', 'audition_prep', 'unit_progress')
  AND constraint_row.contype = 'f';

COMMIT;

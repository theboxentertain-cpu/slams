-- READ BEFORE RUNNING: disposable, network-isolated PostgreSQL ONLY.
-- Loaded after /audit/rls.sql and its baseline fixture rollback.
-- This is NOT evidence of the live Lovable/Supabase deployment state.

\ir /audit/migrations/0004_actor_projects_versioned.sql
\ir /audit/migrations/0005_actor_auditions.sql
\ir /audit/migrations/0006_actor_sides_anchored.sql
\ir /audit/migrations/0007_actor_projects_no_delete.sql

BEGIN;
INSERT INTO auth.users (id)
VALUES ('00000000-0000-4000-8000-000000000011'),
       ('00000000-0000-4000-8000-000000000022');

SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000011';

INSERT INTO public.actor_projects (id, user_id, title, role_name)
VALUES ('a0000000-0000-4000-8000-000000000011',
        auth.uid(), 'A project', 'A role');

SELECT public.audit_assert(
  (SELECT count(*) = 1 FROM public.actor_projects),
  'A can read their own project');
SELECT public.audit_assert(
  (SELECT count(*) = 1 FROM public.actor_project_revisions
   WHERE project_id='a0000000-0000-4000-8000-000000000011'),
  'Project create writes a server-generated first history revision');

UPDATE public.actor_projects SET title='A project update'
WHERE id='a0000000-0000-4000-8000-000000000011';
SELECT public.audit_assert(
  (SELECT revision=2 FROM public.actor_projects
   WHERE id='a0000000-0000-4000-8000-000000000011'),
  'Project revision is incremented by server');
SELECT public.audit_assert(
  (SELECT count(*)=2 FROM public.actor_project_revisions
   WHERE project_id='a0000000-0000-4000-8000-000000000011'),
  'Project update creates a second append-only history entry');

SELECT public.audit_denied(
  $q$INSERT INTO public.actor_project_revisions
      (project_id,user_id,revision,title,role_name,status,notes)
      VALUES ('a0000000-0000-4000-8000-000000000011',
       '00000000-0000-4000-8000-000000000011',99,'fake','','active','{}')$q$,
  '42501');
SELECT public.audit_denied(
  $q$DELETE FROM public.actor_projects
      WHERE id='a0000000-0000-4000-8000-000000000011'$q$,
  '42501');

INSERT INTO public.actor_auditions
  (id, user_id, project_id, title, role_name, due_date)
VALUES ('b0000000-0000-4000-8000-000000000011',
        auth.uid(), 'a0000000-0000-4000-8000-000000000011',
        'A audition', 'A role', '2026-12-01');

UPDATE public.actor_auditions
SET due_date='2026-12-02'
WHERE id='b0000000-0000-4000-8000-000000000011';
SELECT public.audit_assert(
  (SELECT revision=2 FROM public.actor_auditions
   WHERE id='b0000000-0000-4000-8000-000000000011'),
  'Audition revision increments after update');
SELECT public.audit_denied(
  $q$DELETE FROM public.actor_auditions WHERE user_id=auth.uid()$q$,
  '42501');

INSERT INTO public.actor_sides
  (id,user_id,project_id,title,content)
VALUES ('c0000000-0000-4000-8000-000000000011',
        auth.uid(), 'a0000000-0000-4000-8000-000000000011',
        'A script', E'First line\nSecond line');
INSERT INTO public.actor_sides
  (id,user_id,audition_id,title,content)
VALUES ('c0000000-0000-4000-8000-000000000012',
        auth.uid(), 'b0000000-0000-4000-8000-000000000011',
        'A audition side', E'Hello\nمرحبا');

UPDATE public.actor_sides SET annotations=
  '[{"id":"a823216a-e0af-42b9-9028-c67b94ebf940",
     "fromLine":1,"toLine":2,
     "beat":"A new direction","objective":"To persuade","tactic":"To reassure"}]'::jsonb
WHERE id='c0000000-0000-4000-8000-000000000011';
SELECT public.audit_assert(
 (SELECT revision=2 AND content=E'First line\nSecond line'
  FROM public.actor_sides
  WHERE id='c0000000-0000-4000-8000-000000000011'),
 'Annotations update without changing source text');
SELECT public.audit_denied(
 $q$UPDATE public.actor_sides SET content='Rewritten'
     WHERE id='c0000000-0000-4000-8000-000000000011'$q$,
 'P0001');
SELECT public.audit_denied(
 $q$UPDATE public.actor_sides SET project_id=NULL,
     audition_id='b0000000-0000-4000-8000-000000000011'
     WHERE id='c0000000-0000-4000-8000-000000000011'$q$,
 'P0001');
SELECT public.audit_denied(
 $q$DELETE FROM public.actor_sides WHERE user_id=auth.uid()$q$,
 '42501');

-- Switch to B, retaining A's rows in this same disposable transaction.
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000022';
SELECT public.audit_assert(
 (SELECT count(*)=0 FROM public.actor_projects),
 'B cannot see A projects');
SELECT public.audit_assert(
 (SELECT count(*)=0 FROM public.actor_project_revisions),
 'B cannot see A project history');
SELECT public.audit_assert(
 (SELECT count(*)=0 FROM public.actor_auditions),
 'B cannot see A audition records');
SELECT public.audit_assert(
 (SELECT count(*)=0 FROM public.actor_sides),
 'B cannot see A script or annotations');

WITH changed AS (
 UPDATE public.actor_projects SET title='B takeover'
 WHERE id='a0000000-0000-4000-8000-000000000011' RETURNING id
)
SELECT public.audit_assert((SELECT count(*)=0 FROM changed),
 'B cannot edit A project');
WITH changed AS (
 UPDATE public.actor_auditions SET title='B takeover'
 WHERE id='b0000000-0000-4000-8000-000000000011' RETURNING id
)
SELECT public.audit_assert((SELECT count(*)=0 FROM changed),
 'B cannot edit A audition');
WITH changed AS (
 UPDATE public.actor_sides SET annotations='[]'
 WHERE id='c0000000-0000-4000-8000-000000000011' RETURNING id
)
SELECT public.audit_assert((SELECT count(*)=0 FROM changed),
 'B cannot alter A script annotations');

INSERT INTO public.actor_projects (id, user_id, title)
VALUES ('a0000000-0000-4000-8000-000000000022',auth.uid(),'B project');

-- Composite foreign keys must reject inserting B-owned rows linked to A's
-- project or audition, even though B is allowed to create their own rows.
SELECT public.audit_denied(
 $q$INSERT INTO public.actor_auditions
   (id,user_id,project_id,title)
   VALUES ('b0000000-0000-4000-8000-000000000022',
    auth.uid(),'a0000000-0000-4000-8000-000000000011','Spoof')$q$,
 '23503');
SELECT public.audit_denied(
 $q$INSERT INTO public.actor_sides
   (id,user_id,project_id,title,content)
   VALUES ('c0000000-0000-4000-8000-000000000022',
    auth.uid(),'a0000000-0000-4000-8000-000000000011','Spoof','Side')$q$,
 '23503');
SELECT public.audit_denied(
 $q$INSERT INTO public.actor_sides
   (id,user_id,audition_id,title,content)
   VALUES ('c0000000-0000-4000-8000-000000000023',
    auth.uid(),'b0000000-0000-4000-8000-000000000011','Spoof','Side')$q$,
 '23503');

-- Anon must not have actor-work reads or writes.
SET ROLE anon;
SET request.jwt.claim.sub = '';
SELECT public.audit_denied('SELECT * FROM public.actor_projects','42501');
SELECT public.audit_denied('SELECT * FROM public.actor_project_revisions','42501');
SELECT public.audit_denied('SELECT * FROM public.actor_auditions','42501');
SELECT public.audit_denied('SELECT * FROM public.actor_sides','42501');

ROLLBACK;
\echo 'DISPOSABLE Actor at Work schema audit passed: RLS, FK ownership, server revisions, source immutability, no project deletion'

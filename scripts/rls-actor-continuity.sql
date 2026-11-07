-- Disposable PostgreSQL ONLY. Storage fixture emulates policy semantics, not Storage HTTP.
\ir /audit/migrations/0009_actor_work_continuity.sql
\ir /audit/migrations/0010_account_lifecycle_guard.sql
CREATE SCHEMA storage;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,PRIMARY KEY(bucket_id,name));
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name,'/') $$;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO authenticated,anon,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated,anon;
GRANT ALL ON storage.objects,storage.buckets TO service_role;
\ir /audit/migrations/0011_actor_script_storage.sql
BEGIN;
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-000000000011'),('00000000-0000-4000-8000-000000000022');
SET ROLE authenticated;
SET request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';
INSERT INTO public.actor_projects(id,user_id,title) VALUES('a0000000-0000-4000-8000-000000000011',auth.uid(),'Private project');
INSERT INTO public.actor_sides(id,user_id,project_id,title,content)
 VALUES('c0000000-0000-4000-8000-000000000011',auth.uid(),'a0000000-0000-4000-8000-000000000011','First source',E'First line\nArabic: أهلاً');
INSERT INTO public.actor_sides(id,user_id,project_id,title,content,previous_side_id)
 VALUES('c0000000-0000-4000-8000-000000000012',auth.uid(),'a0000000-0000-4000-8000-000000000011','Second source','Different text','c0000000-0000-4000-8000-000000000011');
SELECT public.audit_assert((SELECT source_version=2 AND source_group_id='c0000000-0000-4000-8000-000000000011' FROM public.actor_sides WHERE id='c0000000-0000-4000-8000-000000000012'),'New source retains stable group and increments version');
SELECT public.audit_denied($q$INSERT INTO public.actor_sides(user_id,project_id,title,content,previous_side_id) VALUES(auth.uid(),'a0000000-0000-4000-8000-000000000011','Stale','no','c0000000-0000-4000-8000-000000000011')$q$,'40001');
SELECT public.audit_denied($q$UPDATE public.actor_sides SET source_kind='pdf' WHERE id='c0000000-0000-4000-8000-000000000011'$q$,'P0001');
INSERT INTO public.actor_work_scenes(id,user_id,project_id,side_id,title,objective,circumstances)
 VALUES('d0000000-0000-4000-8000-000000000011',auth.uid(),'a0000000-0000-4000-8000-000000000011','c0000000-0000-4000-8000-000000000011','My scene','Ask them to stay','At home');
INSERT INTO public.actor_work_rehearsals(id,user_id,scene_id,side_id,context)
 VALUES('e0000000-0000-4000-8000-000000000011',auth.uid(),'d0000000-0000-4000-8000-000000000011','c0000000-0000-4000-8000-000000000011',
 '{"project_id":"a0000000-0000-4000-8000-000000000011","audition_id":null,"source_version":1,"scene_title":"My scene","objective":"Ask them to stay","circumstances":"At home"}');
SELECT public.audit_denied($q$UPDATE public.actor_work_rehearsals SET status='completed' WHERE id='e0000000-0000-4000-8000-000000000011'$q$,'P0001');
UPDATE public.actor_work_rehearsals SET takes='[{"id":"f0000000-0000-4000-8000-000000000011","action":"Ask","observation":"I waited","direction":"Pause"},{"id":"f0000000-0000-4000-8000-000000000012","action":"Listen","observation":"They paused","direction":"Wait"}]',reflection='I changed my approach',status='completed' WHERE id='e0000000-0000-4000-8000-000000000011';
SELECT public.audit_denied($q$UPDATE public.actor_work_rehearsals SET reflection='Overwrite' WHERE id='e0000000-0000-4000-8000-000000000011'$q$,'P0001');
INSERT INTO public.actor_journal_entries(id,user_id,project_id,rehearsal_id,title,body)
 VALUES('f1000000-0000-4000-8000-000000000011',auth.uid(),'a0000000-0000-4000-8000-000000000011','e0000000-0000-4000-8000-000000000011','My journal','User-authored ملاحظات');
UPDATE public.actor_journal_entries SET body='Second version' WHERE id='f1000000-0000-4000-8000-000000000011' AND revision=1;
SELECT public.audit_assert((SELECT count(*)=2 FROM public.actor_journal_revisions),'Journal history written transactionally');
SELECT public.audit_denied('DELETE FROM public.actor_journal_entries','42501');
SELECT public.audit_denied('DELETE FROM public.actor_journal_revisions','42501');
INSERT INTO storage.objects(bucket_id,name) VALUES('actor-script-sources',auth.uid()::text||'/original.txt');
UPDATE public.actor_sides SET title='Still first version' WHERE id='c0000000-0000-4000-8000-000000000011';
SELECT public.audit_assert((SELECT count(*)=1 FROM storage.objects),'Owner sees private original');
SELECT public.audit_assert((SELECT count(*)=0 FROM public.actor_journal_revisions WHERE revision=99),'No fabricated history');
SET request.jwt.claim.sub='00000000-0000-4000-8000-000000000022';
SELECT public.audit_assert((SELECT count(*)=0 FROM public.actor_work_rehearsals),'B cannot see A rehearsal');
SELECT public.audit_assert((SELECT count(*)=0 FROM public.actor_journal_entries),'B cannot see A journal');
SELECT public.audit_assert((SELECT count(*)=0 FROM storage.objects),'B cannot read A originals');
SELECT public.audit_denied($q$INSERT INTO public.actor_work_scenes(user_id,project_id,side_id,title) VALUES(auth.uid(),'a0000000-0000-4000-8000-000000000011','c0000000-0000-4000-8000-000000000011','Forgery')$q$,'P0001');
RESET ROLE;
INSERT INTO public.account_deletion_jobs(user_id,status) VALUES('00000000-0000-4000-8000-000000000011','pending');
SET ROLE authenticated;
SET request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';
SELECT public.audit_assert(NOT public.account_is_active(),'Pending deletion disables retained JWT');
SELECT public.audit_assert((SELECT count(*)=0 FROM public.actor_projects),'Pending deletion hides private rows');
SELECT public.audit_denied($q$INSERT INTO public.actor_projects(user_id,title) VALUES(auth.uid(),'Race')$q$,'42501');
SELECT public.audit_denied($q$INSERT INTO storage.objects(bucket_id,name) VALUES('actor-script-sources',auth.uid()::text||'/race.txt')$q$,'42501');
SELECT public.audit_denied('SELECT * FROM public.account_deletion_jobs','42501');
RESET ROLE;
ROLLBACK;
\echo 'DISPOSABLE continuity audit passed: immutable sources, journal history, source-pinned sessions, owner isolation, deletion race guard, Storage policy fixture'

-- REVIEW-ONLY proposal. Requires 0004–0008, excludes academic 0003.
-- Apply only after backup recovery, staging verification and exact SQL approval.
BEGIN;

ALTER TABLE public.actor_sides
 ADD COLUMN source_group_id uuid,
 ADD COLUMN source_version integer NOT NULL DEFAULT 1 CHECK (source_version > 0),
 ADD COLUMN previous_side_id uuid,
 ADD COLUMN source_kind text NOT NULL DEFAULT 'legacy_text'
   CHECK (source_kind IN ('legacy_text','paste','txt','pdf','docx')),
 ADD COLUMN source_name text CHECK (char_length(source_name) <= 255),
 ADD COLUMN source_sha256 text CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
 ADD COLUMN source_file_path text;
UPDATE public.actor_sides SET source_group_id=id;
ALTER TABLE public.actor_sides ALTER COLUMN source_group_id SET NOT NULL;
ALTER TABLE public.actor_sides ALTER COLUMN source_kind SET DEFAULT 'paste';
ALTER TABLE public.actor_sides ADD CONSTRAINT actor_sides_owner_id UNIQUE(user_id,id);
ALTER TABLE public.actor_sides ADD CONSTRAINT actor_sides_previous_owner
 FOREIGN KEY(user_id,previous_side_id) REFERENCES public.actor_sides(user_id,id);
CREATE UNIQUE INDEX actor_sides_source_version ON public.actor_sides(source_group_id,source_version);

CREATE OR REPLACE FUNCTION public.actor_sides_before_write() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE prior public.actor_sides;
BEGIN
 IF TG_OP='INSERT' THEN
  NEW.revision:=1; NEW.created_at:=now();
  IF NEW.previous_side_id IS NULL THEN
   NEW.source_group_id:=NEW.id; NEW.source_version:=1;
  ELSE
   SELECT * INTO prior FROM public.actor_sides WHERE id=NEW.previous_side_id AND user_id=NEW.user_id FOR UPDATE;
   IF NOT FOUND OR prior.project_id IS DISTINCT FROM NEW.project_id OR prior.audition_id IS DISTINCT FROM NEW.audition_id THEN
    RAISE EXCEPTION 'Source revision requires the same owner and parent' USING ERRCODE='23514';
   END IF;
   IF EXISTS(SELECT 1 FROM public.actor_sides WHERE source_group_id=prior.source_group_id AND source_version>prior.source_version) THEN
    RAISE EXCEPTION 'Source has changed; reload the latest version' USING ERRCODE='40001';
   END IF;
   NEW.source_group_id:=prior.source_group_id; NEW.source_version:=prior.source_version+1;
   IF NEW.annotations <> '[]'::jsonb THEN RAISE EXCEPTION 'New source annotations require explicit review'; END IF;
  END IF;
 ELSE
  IF ROW(NEW.id,NEW.user_id,NEW.content,NEW.project_id,NEW.audition_id,NEW.created_at,
    NEW.source_group_id,NEW.source_version,NEW.previous_side_id,NEW.source_kind,NEW.source_name,NEW.source_sha256,NEW.source_file_path)
   IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.content,OLD.project_id,OLD.audition_id,OLD.created_at,
    OLD.source_group_id,OLD.source_version,OLD.previous_side_id,OLD.source_kind,OLD.source_name,OLD.source_sha256,OLD.source_file_path) THEN
   RAISE EXCEPTION 'Script source, identity and parent are immutable';
  END IF;
  NEW.revision:=OLD.revision+1;
 END IF;
 IF NEW.source_file_path IS NOT NULL AND
   (split_part(NEW.source_file_path,'/',1) <> NEW.user_id::text OR NEW.source_sha256 IS NULL) THEN
  RAISE EXCEPTION 'Source object requires owner path and digest';
 END IF;
 IF jsonb_typeof(NEW.annotations)<>'array' OR jsonb_array_length(NEW.annotations)>40 THEN
  RAISE EXCEPTION 'Invalid annotation count';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.annotations) a WHERE
   jsonb_typeof(a)<>'object' OR NOT (a ?& ARRAY['id','fromLine','toLine','beat','objective','tactic']) OR
   COALESCE(a->>'fromLine','') !~ '^[0-9]+$' OR COALESCE(a->>'toLine','') !~ '^[0-9]+$') THEN
  RAISE EXCEPTION 'Invalid annotation structure';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.annotations) a WHERE
   (a->>'fromLine')::numeric<1 OR (a->>'toLine')::numeric<(a->>'fromLine')::numeric OR
   (a->>'toLine')::numeric>cardinality(regexp_split_to_array(NEW.content,E'\r\n|\r|\n')) OR
   jsonb_typeof(a->'beat')<>'string' OR jsonb_typeof(a->'objective')<>'string' OR jsonb_typeof(a->'tactic')<>'string' OR
   char_length(a->>'beat') NOT BETWEEN 1 AND 300 OR char_length(a->>'objective')>500 OR char_length(a->>'tactic')>500) THEN
  RAISE EXCEPTION 'Annotation range or text is invalid';
 END IF;
 NEW.updated_at:=now(); RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.actor_sides_before_write() FROM PUBLIC,anon,authenticated;

CREATE TABLE public.actor_work_scenes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 project_id uuid, audition_id uuid, side_id uuid NOT NULL,
 title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 120),
 objective text NOT NULL DEFAULT '' CHECK(char_length(objective)<=1500),
 circumstances text NOT NULL DEFAULT '' CHECK(char_length(circumstances)<=3000),
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,id), CHECK(num_nonnulls(project_id,audition_id)>=1),
 FOREIGN KEY(user_id,project_id) REFERENCES public.actor_projects(user_id,id),
 FOREIGN KEY(user_id,audition_id) REFERENCES public.actor_auditions(user_id,id),
 FOREIGN KEY(user_id,side_id) REFERENCES public.actor_sides(user_id,id)
);
CREATE INDEX actor_work_scenes_owner_recent ON public.actor_work_scenes(user_id,updated_at DESC);
CREATE TABLE public.actor_work_rehearsals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 scene_id uuid NOT NULL, side_id uuid NOT NULL, context jsonb NOT NULL CHECK(jsonb_typeof(context)='object' AND octet_length(context::text)<=24000),
 phase text NOT NULL DEFAULT 'prepare' CHECK(phase IN ('prepare','take','direction','reflect')),
 takes jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(takes)='array' AND jsonb_array_length(takes)<=12 AND octet_length(takes::text)<=80000),
 reflection text NOT NULL DEFAULT '' CHECK(char_length(reflection)<=3000),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','completed')),
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,id), FOREIGN KEY(user_id,scene_id) REFERENCES public.actor_work_scenes(user_id,id),
 FOREIGN KEY(user_id,side_id) REFERENCES public.actor_sides(user_id,id)
);
CREATE INDEX actor_work_rehearsals_owner_recent ON public.actor_work_rehearsals(user_id,updated_at DESC);
CREATE TABLE public.actor_journal_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 project_id uuid NOT NULL,audition_id uuid,rehearsal_id uuid,
 title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 120),
 body text NOT NULL CHECK(char_length(btrim(body)) BETWEEN 1 AND 20000),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
 revision integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,id), FOREIGN KEY(user_id,project_id) REFERENCES public.actor_projects(user_id,id),
 FOREIGN KEY(user_id,audition_id) REFERENCES public.actor_auditions(user_id,id),
 FOREIGN KEY(user_id,rehearsal_id) REFERENCES public.actor_work_rehearsals(user_id,id)
);
CREATE INDEX actor_journal_entries_project_recent ON public.actor_journal_entries(user_id,project_id,updated_at DESC);
CREATE TABLE public.actor_journal_revisions (
 entry_id uuid NOT NULL,user_id uuid NOT NULL,revision integer NOT NULL,title text NOT NULL,body text NOT NULL,status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(entry_id,revision),
 FOREIGN KEY(user_id,entry_id) REFERENCES public.actor_journal_entries(user_id,id) ON DELETE CASCADE
);

CREATE FUNCTION public.actor_work_before_write() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE s public.actor_sides; scene public.actor_work_scenes; aud_project uuid; rehearsal_scene public.actor_work_scenes;
BEGIN
 IF TG_OP='INSERT' THEN NEW.revision:=1; NEW.created_at:=now();
 ELSE
  IF ROW(NEW.id,NEW.user_id,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.created_at) THEN
   RAISE EXCEPTION 'Work identity is immutable';
  END IF;
  NEW.revision:=OLD.revision+1;
 END IF;
 IF TG_TABLE_NAME='actor_work_scenes' THEN
  IF TG_OP='UPDATE' AND ROW(NEW.project_id,NEW.audition_id,NEW.side_id) IS DISTINCT FROM ROW(OLD.project_id,OLD.audition_id,OLD.side_id) THEN RAISE EXCEPTION 'Scene source is immutable'; END IF;
  SELECT * INTO s FROM public.actor_sides WHERE id=NEW.side_id AND user_id=NEW.user_id;
  IF NOT FOUND OR (s.project_id IS NOT NULL AND s.project_id IS DISTINCT FROM NEW.project_id) OR
   (s.audition_id IS NOT NULL AND s.audition_id IS DISTINCT FROM NEW.audition_id) THEN RAISE EXCEPTION 'Scene source context mismatch'; END IF;
  IF NEW.audition_id IS NOT NULL AND NEW.project_id IS NOT NULL THEN
   SELECT project_id INTO aud_project FROM public.actor_auditions WHERE id=NEW.audition_id AND user_id=NEW.user_id;
   IF aud_project IS DISTINCT FROM NEW.project_id THEN RAISE EXCEPTION 'Audition project mismatch'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='actor_work_rehearsals' THEN
  IF TG_OP='UPDATE' AND (OLD.status='completed' OR ROW(NEW.scene_id,NEW.side_id,NEW.context) IS DISTINCT FROM ROW(OLD.scene_id,OLD.side_id,OLD.context)) THEN RAISE EXCEPTION 'Saved rehearsal and source context are immutable'; END IF;
  SELECT * INTO scene FROM public.actor_work_scenes WHERE id=NEW.scene_id AND user_id=NEW.user_id;
  SELECT * INTO s FROM public.actor_sides WHERE id=NEW.side_id AND user_id=NEW.user_id;
  IF TG_OP='INSERT' AND (scene.id IS NULL OR s.id IS NULL OR scene.side_id<>NEW.side_id OR
   NEW.context->>'project_id' IS DISTINCT FROM scene.project_id::text OR
   NEW.context->>'audition_id' IS DISTINCT FROM scene.audition_id::text OR
   NEW.context->>'source_version' IS DISTINCT FROM s.source_version::text OR
   NEW.context->>'scene_title' IS DISTINCT FROM scene.title OR
   NEW.context->>'objective' IS DISTINCT FROM scene.objective OR
   NEW.context->>'circumstances' IS DISTINCT FROM scene.circumstances) THEN RAISE EXCEPTION 'Rehearsal snapshot mismatch'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.takes) t WHERE
    jsonb_typeof(t)<>'object' OR NOT(t ?& ARRAY['id','action','observation','direction']) OR
    COALESCE(t->>'id','') !~ '^[0-9a-fA-F-]{36}$' OR
    jsonb_typeof(t->'action')<>'string' OR jsonb_typeof(t->'observation')<>'string' OR jsonb_typeof(t->'direction')<>'string' OR
    char_length(t->>'action')>1500 OR char_length(t->>'observation')>1500 OR char_length(t->>'direction')>1500) THEN RAISE EXCEPTION 'Invalid take'; END IF;
  IF (SELECT count(DISTINCT t->>'id') FROM jsonb_array_elements(NEW.takes) t) <> jsonb_array_length(NEW.takes) THEN RAISE EXCEPTION 'Duplicate take'; END IF;
  IF NEW.status='completed' AND (jsonb_array_length(NEW.takes)<2 OR char_length(btrim(NEW.reflection))<3 OR
    EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.takes) t WHERE char_length(btrim(t->>'action'))=0 OR char_length(btrim(t->>'observation'))=0)) THEN RAISE EXCEPTION 'Completion requires two actor-observed takes and reflection'; END IF;
 ELSE
  IF TG_OP='UPDATE' AND ROW(NEW.project_id,NEW.audition_id,NEW.rehearsal_id) IS DISTINCT FROM ROW(OLD.project_id,OLD.audition_id,OLD.rehearsal_id) THEN RAISE EXCEPTION 'Journal context is immutable'; END IF;
  IF NEW.audition_id IS NOT NULL AND NEW.rehearsal_id IS NULL THEN
   SELECT project_id INTO aud_project FROM public.actor_auditions WHERE id=NEW.audition_id AND user_id=NEW.user_id;
   IF aud_project IS DISTINCT FROM NEW.project_id THEN RAISE EXCEPTION 'Journal audition project mismatch'; END IF;
  END IF;
  IF NEW.rehearsal_id IS NOT NULL THEN
   SELECT sc.* INTO rehearsal_scene FROM public.actor_work_rehearsals r JOIN public.actor_work_scenes sc ON sc.id=r.scene_id AND sc.user_id=r.user_id WHERE r.id=NEW.rehearsal_id AND r.user_id=NEW.user_id;
   IF rehearsal_scene.id IS NULL OR rehearsal_scene.project_id IS DISTINCT FROM NEW.project_id OR
     (NEW.audition_id IS NOT NULL AND rehearsal_scene.audition_id IS DISTINCT FROM NEW.audition_id) THEN RAISE EXCEPTION 'Journal rehearsal project mismatch'; END IF;
  END IF;
 END IF;
 NEW.updated_at:=now(); RETURN NEW;
END; $$;
CREATE TRIGGER actor_work_scenes_guard BEFORE INSERT OR UPDATE ON public.actor_work_scenes FOR EACH ROW EXECUTE FUNCTION public.actor_work_before_write();
CREATE TRIGGER actor_work_rehearsals_guard BEFORE INSERT OR UPDATE ON public.actor_work_rehearsals FOR EACH ROW EXECUTE FUNCTION public.actor_work_before_write();
CREATE TRIGGER actor_journal_entries_guard BEFORE INSERT OR UPDATE ON public.actor_journal_entries FOR EACH ROW EXECUTE FUNCTION public.actor_work_before_write();
REVOKE ALL ON FUNCTION public.actor_work_before_write() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.actor_journal_record_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.actor_journal_revisions(entry_id,user_id,revision,title,body,status,created_at)
 VALUES(NEW.id,NEW.user_id,NEW.revision,NEW.title,NEW.body,NEW.status,NEW.updated_at);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.actor_journal_record_revision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER actor_journal_revision AFTER INSERT OR UPDATE ON public.actor_journal_entries FOR EACH ROW EXECUTE FUNCTION public.actor_journal_record_revision();

DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['actor_work_scenes','actor_work_rehearsals','actor_journal_entries','actor_journal_revisions'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',tab);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',tab);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated',tab);
  EXECUTE format('CREATE POLICY "Owner reads work" ON public.%I FOR SELECT TO authenticated USING (user_id=(select auth.uid()))',tab);
  IF tab<>'actor_journal_revisions' THEN
   EXECUTE format('GRANT INSERT,UPDATE ON public.%I TO authenticated',tab);
   EXECUTE format('CREATE POLICY "Owner creates work" ON public.%I FOR INSERT TO authenticated WITH CHECK(user_id=(select auth.uid()))',tab);
   EXECUTE format('CREATE POLICY "Owner edits work" ON public.%I FOR UPDATE TO authenticated USING(user_id=(select auth.uid())) WITH CHECK(user_id=(select auth.uid()))',tab);
  END IF;
 END LOOP;
END; $$;
COMMIT;

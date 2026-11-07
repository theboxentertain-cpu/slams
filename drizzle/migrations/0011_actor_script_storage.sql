-- REVIEW-ONLY, Supabase-native Storage schema required. Requires 0009–0010.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('actor-script-sources','actor-script-sources',false,10485760,
 ARRAY['text/plain','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream'])
 ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='actor-script-sources' AND public) THEN
  RAISE EXCEPTION 'Script source bucket must be private';
 END IF;
END; $$;
CREATE POLICY "Actor uploads private original" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
 bucket_id='actor-script-sources' AND split_part(name,'/',1)=(select auth.uid())::text AND (select public.account_is_active()));
CREATE POLICY "Actor reads private original" ON storage.objects FOR SELECT TO authenticated USING (
 bucket_id='actor-script-sources' AND split_part(name,'/',1)=(select auth.uid())::text AND (select public.account_is_active()));
-- Originals have no client DELETE policy: uncertain inserts must never race cleanup.
CREATE FUNCTION public.account_storage_write_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE object_name text; bucket text;
BEGIN
 IF TG_OP='DELETE' THEN object_name:=OLD.name; bucket:=OLD.bucket_id;
 ELSE object_name:=NEW.name; bucket:=NEW.bucket_id; END IF;
 IF bucket='actor-script-sources' THEN PERFORM public.account_guard_lock(split_part(object_name,'/',1)::uuid); END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.account_storage_write_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER actor_source_serialization BEFORE INSERT OR UPDATE OR DELETE ON storage.objects
 FOR EACH ROW EXECUTE FUNCTION public.account_storage_write_guard();
-- Restrictive policies prevent pre-existing broad bucket policies overriding the safeguards.
CREATE POLICY "Original owner boundary" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
 USING(bucket_id<>'actor-script-sources' OR (split_part(name,'/',1)=(select auth.uid())::text AND (select public.account_is_active())))
 WITH CHECK(bucket_id<>'actor-script-sources' OR (split_part(name,'/',1)=(select auth.uid())::text AND (select public.account_is_active())));
CREATE POLICY "Original files cannot be overwritten" ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(bucket_id<>'actor-script-sources') WITH CHECK(bucket_id<>'actor-script-sources');
CREATE POLICY "Saved originals cannot be removed" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
 USING(bucket_id<>'actor-script-sources');
CREATE POLICY "Original files are never anonymous" ON storage.objects AS RESTRICTIVE FOR ALL TO anon
 USING(bucket_id<>'actor-script-sources') WITH CHECK(bucket_id<>'actor-script-sources');
COMMIT;

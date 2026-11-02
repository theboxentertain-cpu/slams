-- SLAMS C03 ACADEMIC PROGRESSION. PROPOSAL ONLY: security review required before applying.
BEGIN;

-- Existing user-editable completed status is NOT an academic credential.
DROP POLICY IF EXISTS "Users insert own unit progress" ON public.unit_progress;
DROP POLICY IF EXISTS "Users update own unit progress" ON public.unit_progress;
CREATE POLICY "Actors may only start curriculum units" ON public.unit_progress
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'started');
CREATE POLICY "Actors may only update started curriculum units" ON public.unit_progress
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'started')
WITH CHECK (user_id = auth.uid() AND status = 'started');

-- Only service-role administrators can assign active qualified faculty.
CREATE TABLE public.academic_reviewers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, school_id)
);
ALTER TABLE public.academic_reviewers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_reviewers FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.academic_reviewers TO service_role;

-- A published assessment must be signed and belong to its school.
CREATE TABLE public.academic_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  target_kind TEXT NOT NULL CHECK (target_kind IN ('school','year','term','course','workshop','lesson')),
  target_id UUID NOT NULL,
  version TEXT NOT NULL CHECK (length(btrim(version)) BETWEEN 1 AND 80),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(criteria) = 'array'),
  provenance TEXT NOT NULL DEFAULT '',
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ,
  CONSTRAINT active_policy_requires_evidence CHECK (
    status <> 'active' OR (
      signed_by IS NOT NULL AND signed_at IS NOT NULL
      AND length(btrim(provenance)) > 10
      AND jsonb_array_length(criteria) > 0
    )
  ),
  UNIQUE (school_id, target_kind, target_id, version)
);
CREATE UNIQUE INDEX academic_one_active_policy ON public.academic_policies
 (school_id, target_kind, target_id) WHERE status = 'active';
ALTER TABLE public.academic_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_policies FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.academic_policies TO authenticated;
GRANT ALL ON public.academic_policies TO service_role;
CREATE POLICY "Only active signed assessment policies visible"
ON public.academic_policies FOR SELECT TO authenticated
USING (status = 'active' AND signed_by IS NOT NULL AND signed_at IS NOT NULL);

CREATE FUNCTION public.academic_target_in_school(p_school UUID, p_kind TEXT, p_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SET search_path = public AS $academic$
BEGIN
  CASE p_kind
    WHEN 'school' THEN
      RETURN p_id = p_school AND EXISTS(SELECT 1 FROM public.schools WHERE id = p_school);
    WHEN 'year' THEN
      RETURN EXISTS(SELECT 1 FROM public.curriculum_years y WHERE y.id = p_id AND y.school_id = p_school);
    WHEN 'term' THEN
      RETURN EXISTS(SELECT 1 FROM public.curriculum_terms t JOIN public.curriculum_years y ON y.id=t.year_id
        WHERE t.id=p_id AND y.school_id=p_school);
    WHEN 'course' THEN
      RETURN EXISTS(SELECT 1 FROM public.curriculum_courses c JOIN public.curriculum_terms t ON t.id=c.term_id
        JOIN public.curriculum_years y ON y.id=t.year_id WHERE c.id=p_id AND y.school_id=p_school);
    WHEN 'workshop' THEN
      RETURN EXISTS(SELECT 1 FROM public.curriculum_workshops w JOIN public.curriculum_courses c ON c.id=w.course_id
        JOIN public.curriculum_terms t ON t.id=c.term_id JOIN public.curriculum_years y ON y.id=t.year_id
        WHERE w.id=p_id AND y.school_id=p_school);
    WHEN 'lesson' THEN
      RETURN EXISTS(SELECT 1 FROM public.curriculum_lessons l JOIN public.curriculum_workshops w ON w.id=l.workshop_id
        JOIN public.curriculum_courses c ON c.id=w.course_id JOIN public.curriculum_terms t ON t.id=c.term_id
        JOIN public.curriculum_years y ON y.id=t.year_id WHERE l.id=p_id AND y.school_id=p_school);
    ELSE RETURN FALSE;
  END CASE;
END;
$academic$;
REVOKE ALL ON FUNCTION public.academic_target_in_school(UUID,TEXT,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.academic_target_in_school(UUID,TEXT,UUID) TO service_role;

CREATE FUNCTION public.academic_validate_policy() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $academic$
BEGIN
  IF NOT public.academic_target_in_school(NEW.school_id, NEW.target_kind, NEW.target_id) THEN
    RAISE EXCEPTION 'Assessment target is not in the claimed school';
  END IF;
  IF NEW.status = 'active' AND (
    EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.criteria) AS c(item)
      WHERE jsonb_typeof(c.item) <> 'object'
        OR length(btrim(coalesce(c.item->>'id', ''))) = 0
        OR length(btrim(coalesce(c.item->>'description', ''))) < 10)
    OR (SELECT count(DISTINCT c.item->>'id')
      FROM jsonb_array_elements(NEW.criteria) AS c(item)) <> jsonb_array_length(NEW.criteria)
  ) THEN RAISE EXCEPTION 'Assessment criteria must have unique IDs and meaningful descriptions'; END IF;
  IF NEW.status = 'active' AND NOT EXISTS (
    SELECT 1 FROM public.academic_reviewers r
    WHERE r.school_id=NEW.school_id AND r.user_id=NEW.signed_by AND r.active
  ) THEN
    RAISE EXCEPTION 'Active policies require an assigned, active faculty signoff';
  END IF;
  RETURN NEW;
END;
$academic$;
CREATE TRIGGER academic_validate_policy_before_write
BEFORE INSERT OR UPDATE ON public.academic_policies FOR EACH ROW
EXECUTE FUNCTION public.academic_validate_policy();
REVOKE ALL ON FUNCTION public.academic_validate_policy() FROM PUBLIC, anon, authenticated;

-- Actor-owned practice activity is NOT validated attainment. No auto-graduation.
CREATE TABLE public.academic_practice_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 exercise_id UUID NOT NULL REFERENCES public.curriculum_exercises(id),
 content_version INT NOT NULL CHECK (content_version>0),
 mode TEXT NOT NULL CHECK (mode IN ('solo','human_partner','facilitated_group')),
 state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','submitted')),
 reflection TEXT NOT NULL DEFAULT '' CHECK (length(reflection)<=6000),
 evidence_notes TEXT NOT NULL DEFAULT '' CHECK (length(evidence_notes)<=6000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX academic_attempts_user_exercise ON public.academic_practice_attempts (user_id,exercise_id,created_at DESC);
ALTER TABLE public.academic_practice_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_practice_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.academic_practice_attempts TO authenticated;
GRANT ALL ON public.academic_practice_attempts TO service_role;
CREATE POLICY "Actor sees own practice attempts" ON public.academic_practice_attempts
  FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Actor adds own draft or submitted practice" ON public.academic_practice_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND state IN ('draft','submitted'));
CREATE POLICY "Actor edits only own draft practice" ON public.academic_practice_attempts
  FOR UPDATE TO authenticated USING (user_id=auth.uid() AND state='draft')
  WITH CHECK (user_id=auth.uid() AND state IN ('draft','submitted'));

CREATE FUNCTION public.academic_validate_practice() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $academic$
DECLARE v_status TEXT; v_reviewed BOOLEAN; v_version INT;
BEGIN
 SELECT status,reviewed,content_version INTO v_status,v_reviewed,v_version
 FROM public.curriculum_exercises WHERE id=NEW.exercise_id;
 IF v_status IS DISTINCT FROM 'published' OR v_reviewed IS DISTINCT FROM TRUE
 OR v_version IS DISTINCT FROM NEW.content_version THEN
   RAISE EXCEPTION 'Practice requires a reviewed, published exercise with matching content version';
 END IF;
 IF TG_OP='UPDATE' AND (
   NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
   OR NEW.exercise_id IS DISTINCT FROM OLD.exercise_id
   OR NEW.content_version IS DISTINCT FROM OLD.content_version
   OR NEW.created_at IS DISTINCT FROM OLD.created_at
 ) THEN RAISE EXCEPTION 'Practice identity and content version cannot change'; END IF;
 NEW.updated_at=now(); RETURN NEW;
END;
$academic$;
CREATE TRIGGER academic_practice_before_write BEFORE INSERT OR UPDATE ON public.academic_practice_attempts
FOR EACH ROW EXECUTE FUNCTION public.academic_validate_practice();
REVOKE ALL ON FUNCTION public.academic_validate_practice() FROM PUBLIC, anon, authenticated;

-- Requests and grants are writable ONLY through signed, server-reviewed functions.
CREATE TABLE public.academic_placement_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 policy_id UUID NOT NULL REFERENCES public.academic_policies(id),
 statement TEXT NOT NULL CHECK (length(btrim(statement)) BETWEEN 30 AND 6000),
 evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
 state TEXT NOT NULL DEFAULT 'submitted' CHECK (state IN ('submitted','revision_requested','approved','declined')),
 reviewer_id UUID REFERENCES auth.users(id),
 reviewer_note TEXT,
 rubric_result JSONB NOT NULL DEFAULT '{}'::jsonb,
 reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT review_state_has_reviewer CHECK (state='submitted' OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX academic_placement_requests_user ON public.academic_placement_requests(user_id,created_at DESC);
ALTER TABLE public.academic_placement_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_placement_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.academic_placement_requests TO authenticated;
GRANT ALL ON public.academic_placement_requests TO service_role;
CREATE POLICY "Actors see own placement request" ON public.academic_placement_requests
 FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE TABLE public.academic_placement_grants (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 policy_id UUID NOT NULL REFERENCES public.academic_policies(id),
 request_id UUID NOT NULL UNIQUE REFERENCES public.academic_placement_requests(id),
 reviewer_id UUID NOT NULL REFERENCES auth.users(id),
 issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (user_id,policy_id)
);
ALTER TABLE public.academic_placement_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_placement_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.academic_placement_grants TO authenticated;
GRANT ALL ON public.academic_placement_grants TO service_role;
CREATE POLICY "Actors see own reviewed placement grants" ON public.academic_placement_grants
 FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE FUNCTION public.academic_request_placement(p_policy UUID,p_statement TEXT,p_evidence JSONB DEFAULT '{}'::jsonb)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $academic$
DECLARE v_user UUID; v_policy public.academic_policies%ROWTYPE; v_new UUID;
BEGIN
 v_user=auth.uid();
 IF v_user IS NULL THEN RAISE EXCEPTION 'Sign-in required'; END IF;
 SELECT * INTO v_policy FROM public.academic_policies WHERE id=p_policy AND status='active';
 IF NOT FOUND OR v_policy.signed_by IS NULL OR v_policy.signed_at IS NULL THEN
   RAISE EXCEPTION 'No reviewed placement assessment exists for this target';
 END IF;
 IF length(btrim(coalesce(p_statement,''))) NOT BETWEEN 30 AND 6000
 OR jsonb_typeof(p_evidence) IS DISTINCT FROM 'object' OR pg_column_size(p_evidence)>10000 THEN
   RAISE EXCEPTION 'Provide bounded written evidence and a structured evidence summary';
 END IF;
 IF EXISTS(SELECT 1 FROM public.academic_placement_requests
  WHERE user_id=v_user AND policy_id=p_policy AND state='submitted') THEN
   RAISE EXCEPTION 'Existing placement request is still pending';
 END IF;
 INSERT INTO public.academic_placement_requests(user_id,policy_id,statement,evidence_summary)
 VALUES(v_user,p_policy,p_statement,p_evidence) RETURNING id INTO v_new;
 RETURN v_new;
END;
$academic$;
REVOKE ALL ON FUNCTION public.academic_request_placement(UUID,TEXT,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academic_request_placement(UUID,TEXT,JSONB) TO authenticated;

CREATE FUNCTION public.academic_review_placement(p_request UUID,p_decision TEXT,p_note TEXT,p_rubric JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $academic$
DECLARE v_reviewer UUID; v_case public.academic_placement_requests%ROWTYPE;
  v_policy public.academic_policies%ROWTYPE; v_criterion JSONB;
BEGIN
 v_reviewer=auth.uid();
 IF v_reviewer IS NULL OR p_decision NOT IN ('approved','revision_requested','declined')
 OR length(btrim(coalesce(p_note,'')))<30 THEN
   RAISE EXCEPTION 'Authorized faculty decision and specific review note required';
 END IF;
 SELECT * INTO v_case FROM public.academic_placement_requests WHERE id=p_request FOR UPDATE;
 IF NOT FOUND OR v_case.state<>'submitted' OR v_case.user_id=v_reviewer THEN
   RAISE EXCEPTION 'Request must be pending; self-review forbidden';
 END IF;
 SELECT * INTO v_policy FROM public.academic_policies
 WHERE id=v_case.policy_id AND status='active' FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.academic_reviewers r
 WHERE r.user_id=v_reviewer AND r.school_id=v_policy.school_id AND r.active) THEN
   RAISE EXCEPTION 'Faculty must be assigned to this school';
 END IF;
 IF p_decision='approved' THEN
   IF jsonb_typeof(p_rubric) IS DISTINCT FROM 'object'
      OR jsonb_typeof(p_rubric->'criteria') IS DISTINCT FROM 'object' THEN
     RAISE EXCEPTION 'Approvals require documented rubric results';
   END IF;
   FOR v_criterion IN SELECT c.item FROM jsonb_array_elements(v_policy.criteria) AS c(item) LOOP
     IF p_rubric->'criteria'->>(v_criterion->>'id') IS DISTINCT FROM 'demonstrated' THEN
       RAISE EXCEPTION 'Each required published criterion must be demonstrated and documented';
     END IF;
   END LOOP;
 END IF;
 UPDATE public.academic_placement_requests SET state=p_decision,reviewer_id=v_reviewer,
  reviewer_note=p_note,rubric_result=coalesce(p_rubric,'{}'::jsonb),
  reviewed_at=now() WHERE id=v_case.id;
 IF p_decision='approved' THEN
   INSERT INTO public.academic_placement_grants(user_id,policy_id,request_id,reviewer_id)
   VALUES (v_case.user_id,v_case.policy_id,v_case.id,v_reviewer)
   ON CONFLICT(user_id,policy_id) DO NOTHING;
 END IF;
END;
$academic$;
REVOKE ALL ON FUNCTION public.academic_review_placement(UUID,TEXT,TEXT,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academic_review_placement(UUID,TEXT,TEXT,JSONB) TO authenticated;

-- Read-only evidence of reviewed placement; not a content-delivery authorization.
CREATE FUNCTION public.academic_has_placement(p_school UUID,p_kind TEXT,p_target UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $academic$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.academic_placement_grants g
  JOIN public.academic_policies p ON p.id=g.policy_id
  JOIN public.academic_placement_requests r ON r.id=g.request_id
  WHERE g.user_id=auth.uid() AND r.user_id=auth.uid()
  AND r.state='approved' AND r.reviewer_id=g.reviewer_id
  AND p.school_id=p_school AND p.target_kind=p_kind AND p.target_id=p_target
  AND p.status='active' AND p.signed_by IS NOT NULL AND p.signed_at IS NOT NULL
 );
$academic$;
REVOKE ALL ON FUNCTION public.academic_has_placement(UUID,TEXT,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academic_has_placement(UUID,TEXT,UUID) TO authenticated;

COMMIT;

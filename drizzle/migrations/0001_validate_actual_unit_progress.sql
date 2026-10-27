CREATE OR REPLACE FUNCTION public.validate_unit_progress() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE unit_status text;
BEGIN
  CASE NEW.unit_kind
    WHEN 'course' THEN SELECT status INTO unit_status FROM public.curriculum_courses WHERE id = NEW.unit_id;
    WHEN 'workshop' THEN SELECT status INTO unit_status FROM public.curriculum_workshops WHERE id = NEW.unit_id;
    WHEN 'lesson' THEN SELECT status INTO unit_status FROM public.curriculum_lessons WHERE id = NEW.unit_id;
    WHEN 'exercise' THEN SELECT status INTO unit_status FROM public.curriculum_exercises WHERE id = NEW.unit_id;
    WHEN 'assessment' THEN SELECT status INTO unit_status FROM public.curriculum_assessments WHERE id = NEW.unit_id;
    ELSE RAISE EXCEPTION 'Unknown unit kind';
  END CASE;
  IF unit_status IS DISTINCT FROM 'published' THEN RAISE EXCEPTION 'Progress requires an existing published curriculum unit'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_actual_unit_before_progress BEFORE INSERT OR UPDATE ON public.unit_progress FOR EACH ROW EXECUTE FUNCTION public.validate_unit_progress();
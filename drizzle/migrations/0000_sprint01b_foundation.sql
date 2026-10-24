-- Sprint 01B: auth profiles, user-scoped progress, curriculum hierarchy.

-- 1. Profiles (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Passport entries (rehearsal/retake/reflection records)
CREATE TABLE public.passport_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tactic TEXT NOT NULL,
  intervention TEXT NOT NULL,
  exercise_note TEXT NOT NULL DEFAULT '',
  obstacle TEXT NOT NULL DEFAULT '',
  retake_line TEXT NOT NULL DEFAULT '',
  reflection TEXT NOT NULL
);
CREATE INDEX passport_entries_user_idx ON public.passport_entries (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passport_entries TO authenticated;
GRANT ALL ON public.passport_entries TO service_role;
ALTER TABLE public.passport_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own passport entries" ON public.passport_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own passport entries" ON public.passport_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own passport entries" ON public.passport_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own passport entries" ON public.passport_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Audition prep (one row per user, JSON payload)
CREATE TABLE public.audition_prep (
  user_id UUID PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audition_prep TO authenticated;
GRANT ALL ON public.audition_prep TO service_role;
ALTER TABLE public.audition_prep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own audition prep" ON public.audition_prep FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own audition prep" ON public.audition_prep FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own audition prep" ON public.audition_prep FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own audition prep" ON public.audition_prep FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Curriculum hierarchy: School -> Year -> Term -> Course -> Workshop -> Lesson -> Exercise -> Assessment
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  focus TEXT NOT NULL DEFAULT '',
  years INT NOT NULL,
  terms INT NOT NULL,
  position INT NOT NULL DEFAULT 0
);
CREATE TABLE public.curriculum_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  number INT NOT NULL,
  UNIQUE (school_id, number)
);
CREATE TABLE public.curriculum_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID NOT NULL REFERENCES public.curriculum_years(id) ON DELETE CASCADE,
  number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in-development' CHECK (status IN ('in-development', 'published', 'archived')),
  UNIQUE (year_id, number)
);
CREATE TABLE public.curriculum_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES public.curriculum_terms(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in-development' CHECK (status IN ('in-development', 'published', 'archived')),
  content_version INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (term_id, slug)
);
CREATE TABLE public.curriculum_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.curriculum_courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in-development' CHECK (status IN ('in-development', 'published', 'archived')),
  content_version INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (course_id, slug)
);
CREATE TABLE public.curriculum_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.curriculum_workshops(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in-development' CHECK (status IN ('in-development', 'published', 'archived')),
  content_version INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (workshop_id, slug)
);
CREATE TABLE public.curriculum_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in-development' CHECK (status IN ('in-development', 'published', 'archived')),
  content_version INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (lesson_id, slug)
);
CREATE TABLE public.curriculum_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in-development' CHECK (status IN ('in-development', 'published', 'archived')),
  content_version INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  UNIQUE (lesson_id, slug)
);

-- Curriculum content is public read; writes are service-role only (versioned imports).
GRANT SELECT ON public.schools TO anon, authenticated;
GRANT SELECT ON public.curriculum_years TO anon, authenticated;
GRANT SELECT ON public.curriculum_terms TO anon, authenticated;
GRANT SELECT ON public.curriculum_courses TO anon, authenticated;
GRANT SELECT ON public.curriculum_workshops TO anon, authenticated;
GRANT SELECT ON public.curriculum_lessons TO anon, authenticated;
GRANT SELECT ON public.curriculum_exercises TO anon, authenticated;
GRANT SELECT ON public.curriculum_assessments TO anon, authenticated;
GRANT ALL ON public.schools TO service_role;
GRANT ALL ON public.curriculum_years TO service_role;
GRANT ALL ON public.curriculum_terms TO service_role;
GRANT ALL ON public.curriculum_courses TO service_role;
GRANT ALL ON public.curriculum_workshops TO service_role;
GRANT ALL ON public.curriculum_lessons TO service_role;
GRANT ALL ON public.curriculum_exercises TO service_role;
GRANT ALL ON public.curriculum_assessments TO service_role;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curriculum is publicly readable" ON public.schools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_years FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_terms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_workshops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_exercises FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Curriculum is publicly readable" ON public.curriculum_assessments FOR SELECT TO anon, authenticated USING (true);

-- 5. Versioned import ledger
CREATE TABLE public.curriculum_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version INT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  counts JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.curriculum_imports TO authenticated;
GRANT ALL ON public.curriculum_imports TO service_role;
ALTER TABLE public.curriculum_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read import history" ON public.curriculum_imports FOR SELECT TO authenticated USING (true);

-- 6. Per-unit progress (only for units that actually exist in the hierarchy)
CREATE TABLE public.unit_progress (
  user_id UUID NOT NULL,
  unit_kind TEXT NOT NULL CHECK (unit_kind IN ('course', 'workshop', 'lesson', 'exercise', 'assessment')),
  unit_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, unit_kind, unit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_progress TO authenticated;
GRANT ALL ON public.unit_progress TO service_role;
ALTER TABLE public.unit_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own unit progress" ON public.unit_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own unit progress" ON public.unit_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own unit progress" ON public.unit_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own unit progress" ON public.unit_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed: 8 schools, years and 36 terms (structure only; no course content fabricated)
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('stanislavski', 'Stanislavski', 'Given circumstances, objectives and playable action.', 4, 8, 1);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'stanislavski';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 1;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 2 FROM public.schools WHERE slug = 'stanislavski';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 3 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 4 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 2;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 3 FROM public.schools WHERE slug = 'stanislavski';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 5 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 3;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 6 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 3;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 4 FROM public.schools WHERE slug = 'stanislavski';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 7 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 4;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 8 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'stanislavski' AND y.number = 4;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('meisner', 'Meisner', 'Truthful listening and responding moment to moment.', 2, 4, 2);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'meisner';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'meisner' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'meisner' AND y.number = 1;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 2 FROM public.schools WHERE slug = 'meisner';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 3 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'meisner' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 4 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'meisner' AND y.number = 2;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('adler', 'Stella Adler', 'Imagination, circumstances and the size of the play.', 3, 6, 3);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'adler';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'adler' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'adler' AND y.number = 1;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 2 FROM public.schools WHERE slug = 'adler';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 3 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'adler' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 4 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'adler' AND y.number = 2;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 3 FROM public.schools WHERE slug = 'adler';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 5 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'adler' AND y.number = 3;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 6 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'adler' AND y.number = 3;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('strasberg', 'Lee Strasberg', 'Relaxation, concentration and sensory work.', 2, 6, 4);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'strasberg';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'strasberg' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'strasberg' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 3 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'strasberg' AND y.number = 1;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 2 FROM public.schools WHERE slug = 'strasberg';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 4 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'strasberg' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 5 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'strasberg' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 6 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'strasberg' AND y.number = 2;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('chekhov', 'Michael Chekhov', 'Psychological gesture, atmosphere and imagination.', 2, 4, 5);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'chekhov';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'chekhov' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'chekhov' AND y.number = 1;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 2 FROM public.schools WHERE slug = 'chekhov';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 3 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'chekhov' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 4 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'chekhov' AND y.number = 2;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('laban', 'Laban / Bartenieff', 'Effort qualities, space and body connectivity.', 1, 2, 6);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'laban';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'laban' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'laban' AND y.number = 1;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('practical-aesthetics', 'Practical Aesthetics', 'Scene analysis into a clear, doable action.', 2, 4, 7);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'practical-aesthetics';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'practical-aesthetics' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'practical-aesthetics' AND y.number = 1;
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 2 FROM public.schools WHERE slug = 'practical-aesthetics';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 3 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'practical-aesthetics' AND y.number = 2;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 4 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'practical-aesthetics' AND y.number = 2;
INSERT INTO public.schools (slug, name, focus, years, terms, position) VALUES ('viewpoints', 'Viewpoints', 'Time, space and ensemble awareness.', 1, 2, 8);
INSERT INTO public.curriculum_years (school_id, number) SELECT id, 1 FROM public.schools WHERE slug = 'viewpoints';
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 1 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'viewpoints' AND y.number = 1;
INSERT INTO public.curriculum_terms (year_id, number) SELECT y.id, 2 FROM public.curriculum_years y JOIN public.schools s ON s.id = y.school_id WHERE s.slug = 'viewpoints' AND y.number = 1;
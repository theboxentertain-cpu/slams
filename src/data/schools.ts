// Provisional SLAMS curriculum map — subject to academic review. Not official institutional curricula.
export type Status = "in-development";

export interface Exercise {
  id: string;
  title: string;
  status: Status;
}
export interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
  status: Status;
}
export interface Workshop {
  id: string;
  title: string;
  lessons: Lesson[];
  status: Status;
}
export interface Course {
  id: string;
  title: string;
  workshops: Workshop[];
  status: Status;
}
export interface Term {
  number: number;
  courses: Course[];
  status: Status;
}
export interface Year {
  number: number;
  terms: Term[];
}
export interface School {
  slug: string;
  name: string;
  focus: string;
  years: number;
  terms: number;
  curriculum: Year[];
}

const base: Omit<School, "curriculum">[] = [
  {
    slug: "stanislavski",
    name: "Stanislavski",
    focus: "Given circumstances, objectives and playable action.",
    years: 4,
    terms: 8,
  },
  {
    slug: "meisner",
    name: "Meisner",
    focus: "Truthful listening and responding moment to moment.",
    years: 2,
    terms: 4,
  },
  {
    slug: "adler",
    name: "Stella Adler",
    focus: "Imagination, circumstances and the size of the play.",
    years: 3,
    terms: 6,
  },
  {
    slug: "strasberg",
    name: "Lee Strasberg",
    focus: "Relaxation, concentration and sensory work.",
    years: 2,
    terms: 6,
  },
  {
    slug: "chekhov",
    name: "Michael Chekhov",
    focus: "Psychological gesture, atmosphere and imagination.",
    years: 2,
    terms: 4,
  },
  {
    slug: "laban",
    name: "Laban / Bartenieff",
    focus: "Effort qualities, space and body connectivity.",
    years: 1,
    terms: 2,
  },
  {
    slug: "practical-aesthetics",
    name: "Practical Aesthetics",
    focus: "Scene analysis into a clear, doable action.",
    years: 2,
    terms: 4,
  },
  {
    slug: "viewpoints",
    name: "Viewpoints",
    focus: "Time, space and ensemble awareness.",
    years: 1,
    terms: 2,
  },
];

function buildYears(years: number, terms: number): Year[] {
  // Distribute terms across years as evenly as possible (earlier years first).
  const out: Year[] = [];
  let n = 1;
  for (let y = 1; y <= years; y++) {
    const count = Math.floor(terms / years) + (y <= terms % years ? 1 : 0);
    const ts: Term[] = [];
    for (let i = 0; i < count; i++) ts.push({ number: n++, courses: [], status: "in-development" });
    out.push({ number: y, terms: ts });
  }
  return out;
}

export const SCHOOLS: School[] = base.map((s) => ({
  ...s,
  curriculum: buildYears(s.years, s.terms),
}));

export const getSchool = (slug: string) => SCHOOLS.find((s) => s.slug === slug);
export const totalTerms = (s: School) => s.curriculum.reduce((a, y) => a + y.terms.length, 0);

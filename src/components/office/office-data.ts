import { SCHOOLS } from "@/data/schools";

export const OFFICE_VIEWS = [
  { id: "desk", name: "The Director’s Desk", short: "The desk", number: "01" },
  { id: "wall", name: "The Work Wall", short: "Work wall", number: "02" },
  { id: "corner", name: "The Rehearsal Corner", short: "Rehearsal corner", number: "03" },
] as const;
export type OfficeView = (typeof OFFICE_VIEWS)[number]["id"];

// Actual file routes only. No new navigation paths or curriculum identities.
export const OFFICE_DESTINATIONS = {
  director: {
    to: "/director",
    label: "The Director",
    hint: "Meet your studio guide",
    prop: "director",
  },
  rehearsal: { to: "/scene", label: "Start rehearsal", hint: "The Living Scene", prop: "clapper" },
  stuck: {
    to: "/stuck",
    label: "The Stuck Desk",
    hint: "Find a way into the scene",
    prop: "script",
  },
  work: { to: "/work", label: "Actor at Work", hint: "Prepare your audition", prop: "casting" },
  passport: {
    to: "/passport",
    label: "Passport",
    hint: "Your saved rehearsals",
    prop: "portfolio",
  },
  matrix: { to: "/matrix", label: "Technique Matrix", hint: "In development", prop: "diagram" },
  baseline: { to: "/baseline", label: "Baseline", hint: "In development", prop: "mirror" },
  lab: { to: "/lab", label: "Performance Lab", hint: "In development", prop: "camera" },
  lounge: { to: "/lounge", label: "Rehearsal Lounge", hint: "In development", prop: "chair" },
} as const;
export type OfficeDestination = keyof typeof OFFICE_DESTINATIONS;
export type PropKind = (typeof OFFICE_DESTINATIONS)[OfficeDestination]["prop"];

export const BOOK_DESIGNS = [
  {
    slug: "stanislavski",
    title: "Stanislavski",
    color: "#662b35",
    ink: "#ead5ab",
    motif: "classical",
  },
  { slug: "meisner", title: "Meisner", color: "#254d85", ink: "#e9dfcb", motif: "listening" },
  { slug: "adler", title: "Adler", color: "#205747", ink: "#e4cd91", motif: "architecture" },
  {
    slug: "practical-aesthetics",
    title: "Practical Aesthetics",
    color: "#20201f",
    ink: "#e7b84d",
    motif: "geometry",
  },
  { slug: "chekhov", title: "Chekhov", color: "#634571", ink: "#e8d5bc", motif: "gesture" },
  { slug: "laban", title: "Laban", color: "#a94f2d", ink: "#f1ddaf", motif: "movement" },
  { slug: "strasberg", title: "Strasberg", color: "#7f2632", ink: "#e9c1b3", motif: "inner" },
  { slug: "viewpoints", title: "Viewpoints", color: "#29676b", ink: "#e5d7ac", motif: "space" },
].map((book) => ({ ...book, school: SCHOOLS.find((school) => school.slug === book.slug)! }));

export const DIRECTOR_EXPRESSIONS = [
  "bored",
  "observant",
  "unimpressed",
  "critical",
  "impressed",
  "proud",
  "exhausted",
  "master",
] as const;
export type DirectorExpression = (typeof DIRECTOR_EXPRESSIONS)[number];

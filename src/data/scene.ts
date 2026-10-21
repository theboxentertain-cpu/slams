// ORIGINAL DEMONSTRATION SCENE — fixed scripted responses, no AI judgment.
export const SCENE = {
  title: "Stay",
  setup:
    "Late evening. Your friend Sam has their coat on and keys in hand. They've decided to leave the city tonight. You want Sam to stay.",
  objective: "Get Sam to stay.",
};

export interface Tactic { id: string; verb: string; line: string; response: string }
export const TACTICS: Tactic[] = [
  { id: "plead", verb: "To plead", line: "Please. Just one more night. I'm asking you.", response: "Sam softens, then looks at the door. \"You always ask. You never say why.\"" },
  { id: "tease", verb: "To tease", line: "You're really leaving before finishing my terrible pasta?", response: "Sam half-laughs, then stops. \"Don't make this a joke. Not tonight.\"" },
  { id: "confront", verb: "To confront", line: "You're running. You do this every time it gets hard.", response: "Sam's jaw tightens. \"Maybe I am. Maybe you're the reason.\"" },
];

export interface Intervention {
  id: string;
  school: string;
  label: string;
  principle: string;
  exercisePrompt: string;
  exercisePlaceholder: string;
}
export const INTERVENTIONS: Intervention[] = [
  { id: "meisner", school: "Meisner", label: "Listening", principle: "Stop planning your next line. Respond to what Sam actually just did.", exercisePrompt: "Repetition: write exactly what you observed in Sam's response, as a simple statement (e.g. \"You looked at the door.\"). Then repeat it once, letting your point of view change it.", exercisePlaceholder: "You looked at the door. / I looked at the door?" },
  { id: "stanislavski", school: "Stanislavski", label: "Playable action", principle: "Choose a transitive verb you can do to Sam, not a feeling you hope to show.", exercisePrompt: "Write one new action verb (\"to ___ Sam\") and the single change you want to see in Sam if it works.", exercisePlaceholder: "To disarm Sam — I want them to put the keys down." },
  { id: "adler", school: "Stella Adler", label: "Given circumstances & imagination", principle: "Make the world specific. What is at stake if Sam walks out tonight?", exercisePrompt: "Imagine and write one specific circumstance: what happened in this room last week that makes tonight matter?", exercisePlaceholder: "Last week Sam stayed up with me after the hospital call..." },
];

// The retake obstacle depends on BOTH the tactic and the intervention chosen.
const OBSTACLES: Record<string, Record<string, string>> = {
  plead: {
    meisner: "Sam stops answering and just watches you. You have only their silence to respond to.",
    stanislavski: "Sam says: \"Give me one reason, not a feeling.\" Your new action must land in a single line.",
    adler: "Sam's phone buzzes — a taxi is outside. The circumstance just got urgent.",
  },
  tease: {
    meisner: "Sam turns away from you. Respond to their back, not their face.",
    stanislavski: "Sam sets the keys down but says: \"Ten seconds.\" Your action has a hard limit.",
    adler: "Sam picks up a photo from the shelf — one from a trip you both remember. Use it.",
  },
  confront: {
    meisner: "Sam's voice drops to a whisper. Match what you actually hear.",
    stanislavski: "Sam accuses you back: \"You never ask what I need.\" Change your verb in response.",
    adler: "Sam reveals they already gave up their apartment. The stakes are now final.",
  },
};

export const getObstacle = (tactic: string, intervention: string) =>
  OBSTACLES[tactic]?.[intervention] ?? "Sam hesitates at the door.";

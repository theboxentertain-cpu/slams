/** Navigation and page contracts for the existing SLAMS application. */
export const PRIMARY_NAVIGATION = [
  { label: "Office", to: "/", icon: "office" },
  { label: "Schools", to: "/conservatory", icon: "schools" },
  { label: "Rehearse", to: "/rehearsal", icon: "rehearse" },
  { label: "Work", to: "/work", icon: "work" },
  { label: "Stuck Desk", to: "/stuck", icon: "stuck" },
] as const;

export function primarySection(path: string) {
  if (path === "/") return "/";
  if (/^\/(conservatory|matrix)(?:\/|$)/.test(path)) return "/conservatory";
  if (/^\/(rehearsal|scene|baseline|lab|lounge)(?:\/|$)/.test(path)) return "/rehearsal";
  if (/^\/work(?:\/|$)/.test(path)) return "/work";
  if (/^\/stuck(?:\/|$)/.test(path)) return "/stuck";
  return null;
}

// Includes legacy query values for bookmarked URLs. Fully unavailable support
// pages validate these values but no longer render empty tab controls.
export const PAGE_TABS = {
  conservatory: ["All Schools", "In Progress", "Completed"],
  school: ["Overview", "Curriculum", "Practice", "Assessments", "Progress"],
  rehearsal: ["My Scenes", "New Scene", "Sessions"],
  work: ["Auditions", "Projects", "Characters", "Self-Tapes"],
  audition: ["Brief", "Script", "Character", "Preparation"],
  character: ["Biography", "Relationships", "Objectives", "Behavior", "Notes"],
  breakdown: ["Beats", "Objectives", "Obstacles", "Tactics"],
  selfTape: ["Setup", "Takes", "Review", "Export"],
  journal: ["Scenes", "Notes", "History"],
  stuck: ["Describe", "Scene", "Identify"],
  diagnosis: ["Observations", "Possible Causes"],
  retry: ["First Attempt", "New Attempt", "Compare"],
  fixes: ["History", "Useful Exercises"],
  baseline: ["Prepare", "Perform", "Reflect", "Next Steps"],
  lab: ["Takes", "Compare", "Notes"],
  lounge: ["Sessions", "Partners", "Shared Scenes"],
  matrix: ["Compare", "Apply", "Cautions"],
  passport: ["Journey", "Evidence", "Portfolio", "Badges"],
  progress: ["By School", "By Skill", "History"],
  settings: ["Account", "Privacy", "Language", "Accessibility"],
} as const;
export type PageId = keyof typeof PAGE_TABS;
export const tabId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export function validateTab(page: PageId, input: Record<string, unknown>) {
  const tabs: readonly string[] = PAGE_TABS[page];
  return {
    tab: tabs.some((label) => tabId(label) === input["tab"])
      ? String(input["tab"])
      : tabId(tabs[0]!),
  };
}

export const SUPPORT_PAGES = {
  selfTape: {
    to: "/work/self-tape",
    title: "Self-Tape Studio",
    parent: "/work",
    message:
      "Camera capture, playback and export are not implemented. SLAMS does not request recording permission or record you.",
    action: "/scene",
    label: "Run a text-only take",
  },
  journal: {
    to: "/work/journal",
    title: "Project Journal",
    parent: "/work",
    message:
      "Project records and revision history are in development. Existing saved rehearsal reflections are available in Passport.",
    action: "/passport",
    label: "Open saved reflections",
  },
  diagnosis: {
    to: "/stuck/diagnosis",
    title: "Stuck Desk · Diagnosis",
    parent: "/stuck",
    message:
      "Automated observation and diagnosis are not available. The current draft interventions are suggestions, not an analysis of your performance.",
    action: "/stuck",
    label: "Explore existing draft interventions",
  },
  retry: {
    to: "/stuck/retry",
    title: "Stuck Desk · Retry",
    parent: "/stuck",
    message:
      "Linked first/new-attempt comparisons are in development. You can run the existing scripted demonstration and save your own reflection.",
    action: "/scene",
    label: "Try the Living Scene",
  },
  fixes: {
    to: "/stuck/saved",
    title: "Saved Fixes",
    parent: "/stuck",
    message:
      "Saved problem and intervention histories are in development. No fixes have been inferred from your rehearsal records.",
    action: "/passport",
    label: "Open rehearsal records",
  },
  baseline: {
    to: "/baseline",
    title: "Actor’s Baseline",
    parent: "/",
    message:
      "Guided baseline tasks are in development. This introduction is optional; there is no talent score or personality diagnosis.",
    action: "/scene",
    label: "Skip to a first rehearsal",
  },
  lab: {
    to: "/lab",
    title: "Performance Lab",
    parent: "/rehearsal",
    message:
      "Recorded takes, playback and side-by-side comparison are in development. No recording is made by the text-only Living Scene.",
    action: "/scene",
    label: "Run a text-only take",
  },
  lounge: {
    to: "/lounge",
    title: "Rehearsal Lounge",
    parent: "/rehearsal",
    message:
      "Partner matching, shared scenes and live sessions are in development. Rehearse solo with the existing demonstration.",
    action: "/scene",
    label: "Rehearse solo",
  },
  matrix: {
    to: "/matrix",
    title: "Technique Matrix",
    parent: "/conservatory",
    message:
      "Reviewed technique comparisons, use cases and cautions are in development. The eight schools retain their existing provisional focus descriptions.",
    action: "/conservatory",
    label: "Explore the schools",
  },
} as const;
export type SupportPageId = keyof typeof SUPPORT_PAGES;

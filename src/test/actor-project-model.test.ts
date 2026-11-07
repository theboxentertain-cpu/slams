import { describe, expect, it } from "vitest";
import {
  blankProjectDraft,
  parseProjectNotes,
  validateProjectDraft,
  PROJECT_NOTE_FIELDS,
} from "@/lib/actor-project-model";

describe("Actor at Work file model", () => {
  it("has unique character and breakdown note fields without touching audition prep", () => {
    expect(PROJECT_NOTE_FIELDS).toHaveLength(8);
    expect(new Set(PROJECT_NOTE_FIELDS.map((field) => field.key)).size).toBe(8);
    expect(PROJECT_NOTE_FIELDS.some((field) => field.key === "beats")).toBe(true);
    expect(PROJECT_NOTE_FIELDS.some((field) => field.key === "relationships")).toBe(true);
    expect(Object.values(blankProjectDraft().notes).every((value) => value === "")).toBe(true);
  });
  it("preserves valid actor prose and rejects malformed extra properties from cloud", () => {
    const parsed = parseProjectNotes({
      objective: "  Convince Sam to stay\nwithout shouting",
      beats: "Beat one",
      unexpected: "<script>not a supported field</script>",
      tactics: 99,
    });
    expect(parsed.objective).toBe("  Convince Sam to stay\nwithout shouting");
    expect(parsed.beats).toBe("Beat one");
    expect(parsed.tactics).toBe("");
    expect(Object.keys(parsed)).toHaveLength(8);
  });
  it("fails closed on empty titles, oversized notes and oversized UTF-8 payloads", () => {
    const draft = blankProjectDraft();
    expect(validateProjectDraft(draft)).toMatch(/title/i);
    draft.title = "Hamlet";
    expect(validateProjectDraft(draft)).toBeNull();
    draft.notes.beats = "b".repeat(901);
    expect(validateProjectDraft(draft)).toMatch(/900/);
    draft.notes.beats = "";
    for (const key of PROJECT_NOTE_FIELDS) draft.notes[key.key] = "م".repeat(900);
    expect(validateProjectDraft(draft)).toMatch(/too long/i);
  });
});

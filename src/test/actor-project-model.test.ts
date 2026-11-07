import { describe, expect, it } from "vitest";
import {
  ACTOR_PROJECTS_KEY,
  draftEquals,
  emptyProjectDraft,
  isActorProject,
  isValidProjectId,
  localProjectFile,
  projectDraft,
  serializeProjectDraft,
  sortProjects,
  validateProject,
} from "@/lib/actor-project-model";

const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";
describe("Actor at Work project model", () => {
  it("has a separate guest storage namespace, never the existing audition prep key", () => {
    expect(ACTOR_PROJECTS_KEY).not.toBe("slams.audition.v1");
    expect(ACTOR_PROJECTS_KEY).toContain("guest");
  });
  it("requires meaningful, bounded project names and server-compatible values", () => {
    const draft = emptyProjectDraft();
    expect(validateProject(draft)).toBe("Project title is required.");
    draft.title = "Audition A";
    expect(validateProject(draft)).toBeNull();
    expect(validateProject({ ...draft, due_date: "2026-02-30" })).toBe("Use a valid project deadline.");
    expect(validateProject({ ...draft, kind: "other" as never })).toBe("Select a valid project type.");
    expect(validateProject({ ...draft, title: "a".repeat(121) })).toContain("exceeds");
    expect(validateProject({ ...draft, rehearsal_notes: "a".repeat(6001) })).toContain("exceeds");
  });
  it("keeps full structured actor notes and archive states with copy-safe drafts", () => {
    const draft = { ...emptyProjectDraft(), title: " Work file ", role_name: "  Alice  ",
      given_circumstances: "At the train station", playable_action: "Reassure", status: "archived" as const };
    const file = localProjectFile(ID1, draft, "2026-11-07T00:00:00Z");
    expect(file.title).toBe("Work file");
    expect(file.role_name).toBe("Alice");
    expect(file.status).toBe("archived");
    expect(file.playable_action).toBe("Reassure");
    expect(isActorProject(file)).toBe(true);
    expect(draftEquals(projectDraft(file), serializeProjectDraft(draft))).toBe(true);
    expect(draftEquals(projectDraft(file), emptyProjectDraft())).toBe(false);
    expect(isActorProject({ ...file, title: "" })).toBe(false);
    expect(isActorProject({ ...file, id: "not-uuid" })).toBe(false);
    expect(isValidProjectId(ID1)).toBe(true);
  });
  it("sorts by recent actual updates, without reusing other users' identifiers", () => {
    const a = localProjectFile(ID1, { ...emptyProjectDraft(), title: "Early" }, "2026-01-01T00:00:00Z");
    const b = localProjectFile(ID2, { ...emptyProjectDraft(), title: "Later" }, "2026-01-02T00:00:00Z");
    expect(sortProjects([a,b]).map((item) => item.title)).toEqual(["Later","Early"]);
  });
});

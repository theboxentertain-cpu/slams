import { describe, expect, it } from "vitest";
import { blankProjectDraft } from "@/lib/actor-project-model";
import {
  auditionCopyCandidates,
  copyAuditionFields,
  projectSelectionSearch,
} from "@/lib/actor-audition-copy";

const source = {
  role: "A play — two characters",
  circumstances: "An afternoon at the station",
  objective: "Convince Sam",
  obstacle: "Sam refuses",
  action: "To reassure",
  moment: "Arrived late",
};

describe("Legacy audition → project staging", () => {
  it("does not infer project name or character from a combined legacy role field", () => {
    const target = blankProjectDraft();
    target.title = "The Station";
    target.roleName = "Maya";
    const original = structuredClone(source);
    const result = copyAuditionFields(source, target, ["objective", "moment"]);
    expect(result.draft?.title).toBe("The Station");
    expect(result.draft?.roleName).toBe("Maya");
    expect(result.draft?.notes.objective).toBe("Convince Sam");
    expect(result.draft?.notes.moment).toBe("Arrived late");
    expect(result.draft?.notes.obstacle).toBe("");
    expect(source).toEqual(original);
    expect(target.notes.objective).toBe("");
  });

  it("refuses filled destinations without any partial copy", () => {
    const target = blankProjectDraft();
    target.notes.objective = "Existing objective";
    const result = copyAuditionFields(source, target, ["obstacle", "objective"]);
    expect(result.error).toMatch(/already filled/);
    expect(target.notes.obstacle).toBe("");
    expect(target.notes.objective).toBe("Existing objective");
    const candidates = auditionCopyCandidates(source, target);
    expect(candidates.find((f) => f.key === "objective")).toMatchObject({
      eligible: false,
      occupied: true,
    });
  });

  it("refuses unselected/unknown fields and missing source without guessing content", () => {
    const target = blankProjectDraft();
    expect(copyAuditionFields(source, target, []).error).toMatch(/Select/);
    expect(copyAuditionFields({}, target, ["moment"]).error).toMatch(/missing/);
    expect(copyAuditionFields(source, target, ["beats" as never]).error).toMatch(/missing/);
    expect(target.notes).toEqual(blankProjectDraft().notes);
  });

  it("copies Arabic prose exactly, deduplicates selected keys, and never persists anything", () => {
    const target = blankProjectDraft();
    const arabic = { objective: "أقنعه\nمن غير انفعال" };
    const result = copyAuditionFields(arabic, target, ["objective", "objective"]);
    expect(result.copied).toBe(1);
    expect(result.draft?.notes.objective).toBe("أقنعه\nمن غير انفعال");
    expect(arabic.objective).toBe("أقنعه\nمن غير انفعال");
  });
});

describe("Canonical project selection", () => {
  it("accepts UUID links and normalizes case while preserving legacy tabs", () => {
    const raw = "A12BC345-67D8-4C9B-A123-ABCDEF456789";
    expect(projectSelectionSearch({ projectId: raw }, "beats")).toEqual({
      tab: "beats",
      projectId: raw.toLowerCase(),
    });
  });

  it.each(["not-a-uuid", "../passport", "", "a".repeat(500), 13])(
    "rejects malformed selectors without treating them as authenticated ownership",
    (invalid) => {
      expect(projectSelectionSearch({ projectId: invalid }, "biography")).toEqual({
        tab: "biography",
        projectId: undefined,
      });
    },
  );
});

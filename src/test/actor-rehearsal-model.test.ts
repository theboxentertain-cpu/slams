import { describe, expect, it } from "vitest";
import {
  parseRehearsalContext,
  parseRehearsalTakes,
  validateRehearsalDraft,
  validateRehearsalSearch,
  type RehearsalContext,
} from "@/lib/actor-rehearsal-model";
const projectId = "51594f9d-5da4-4c05-883e-6ed0d29542f2";
const id = "be82ca4f-3744-4d7c-9c02-9ced5638ee80";
const otherId = "670d214a-b53a-47bd-903b-d6eb2d88ee7e";
export const context: RehearsalContext = {
  project_id: projectId,
  audition_id: null,
  source_version: 2,
  source_title: "Scene source",
  source_kind: "docx",
  scene_title: "The return",
  objective: "أقنعه يفضل",
  circumstances: "The train has left.",
  return_to: "breakdown",
};
describe("Contextual manual rehearsal contracts", () => {
  it("preserves legacy hub tabs while dropping malformed context IDs and open redirects", () => {
    expect(
      validateRehearsalSearch({
        tab: "sessions",
        projectId,
        sideId: "javascript:bad",
        sceneId: [id],
        returnTo: "https://evil.example",
      }),
    ).toMatchObject({
      tab: "sessions",
      projectId,
      sideId: undefined,
      sceneId: undefined,
      returnTo: undefined,
    });
    expect(validateRehearsalSearch({ tab: "invalid", sessionId: id })).toMatchObject({
      tab: "my-scenes",
      sessionId: id,
    });
  });
  it("requires an origin and a valid pinned source version and reconstructs stable context from unordered JSONB", () => {
    const reordered = Object.fromEntries(Object.entries(context).reverse());
    expect(JSON.stringify(parseRehearsalContext(reordered))).toBe(JSON.stringify(context));
    expect(parseRehearsalContext({ ...context, project_id: null })).toBeNull();
    expect(parseRehearsalContext({ ...context, source_version: 0 })).toBeNull();
    expect(parseRehearsalContext({ ...context, source_kind: "html" })).toBeNull();
    expect(parseRehearsalContext({ ...context, audition_id: "another-user" })).toBeNull();
    expect(parseRehearsalContext(context)?.objective).toBe("أقنعه يفضل");
  });
  it("allows incomplete cloud drafts but requires two authored observations and reflection to complete", () => {
    const first = {
      id,
      action: "To reassure",
      observation: "I stopped pushing the last line.",
      direction: "Let the pause land.",
    };
    const second = {
      id: otherId,
      action: "To challenge",
      observation: "I heard a different need.",
      direction: "",
    };
    expect(validateRehearsalDraft({ phase: "prepare", takes: [], reflection: "" })).toBeNull();
    expect(
      validateRehearsalDraft(
        { phase: "reflect", takes: [first], reflection: "Changed action" },
        true,
      ),
    ).toMatch(/at least two/);
    expect(
      validateRehearsalDraft({ phase: "reflect", takes: [first, second], reflection: "" }, true),
    ).toMatch(/reflection/);
    expect(
      validateRehearsalDraft(
        {
          phase: "reflect",
          takes: [first, { ...second, observation: " " }],
          reflection: "Changed action",
        },
        true,
      ),
    ).toMatch(/observed/);
    expect(
      validateRehearsalDraft(
        { phase: "reflect", takes: [first, second], reflection: "The second action made space." },
        true,
      ),
    ).toBeNull();
  });
  it("rejects malformed, duplicated and oversized user notes rather than silently stripping evidence", () => {
    const take = { id, action: "To persuade", observation: "A pause", direction: "" };
    expect(parseRehearsalTakes([{ ...take, observation: 4 }])).toBeNull();
    expect(parseRehearsalTakes([take, take])).toBeNull();
    expect(parseRehearsalTakes([{ ...take, action: "A".repeat(1501) }])).toBeNull();
    expect(
      validateRehearsalDraft({ phase: "take", takes: [take], reflection: "A".repeat(3001) }),
    ).toMatch(/3,000/);
  });
});

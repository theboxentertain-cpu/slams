import { describe, expect, it } from "vitest";
import {
  anchoredExcerpt,
  blankSideDraft,
  parseSideAnnotations,
  sideLines,
  validateSideAnnotations,
  validateSideDraft,
  MAX_SIDE_LINES,
  type SideAnnotation,
} from "@/lib/actor-sides-model";

const owner = "9e18a3fd-0749-4657-945d-f60872c88faa";
const other = "bd38c4e5-73a0-4eb5-ab6f-e41001d50840";
const note: SideAnnotation = {
  id: "a823216a-e0af-42b9-9028-c67b94ebf940",
  fromLine: 2,
  toLine: 3,
  beat: "The tactic shifts",
  objective: "To restore trust",
  tactic: "To reassure",
};

describe("Script-side snapshots and exact line anchors", () => {
  it("does not mutate original Arabic/English source text or line endings", () => {
    const text = "INT. ROOM\r\nليلى: مش هينفع\r\nADAM: Stay";
    expect(sideLines(text)).toEqual(["INT. ROOM", "ليلى: مش هينفع", "ADAM: Stay"]);
    expect(anchoredExcerpt(text, 2, 3)).toBe("ليلى: مش هينفع\nADAM: Stay");
    expect(text).toBe("INT. ROOM\r\nليلى: مش هينفع\r\nADAM: Stay");
  });
  it("requires one signed-in owner's existing parent selector", () => {
    const draft = blankSideDraft();
    expect(validateSideDraft(draft, [owner], [])).toMatch(/title/);
    draft.title = "Side 1";
    draft.content = "Line one\nLine two";
    expect(validateSideDraft(draft, [owner], [])).toMatch(/Choose/);
    draft.target = { kind: "audition", id: other };
    expect(validateSideDraft(draft, [owner], [])).toMatch(/unavailable/);
    draft.target = { kind: "project", id: owner };
    expect(validateSideDraft(draft, [owner], [])).toBeNull();
    draft.target = { kind: "project", id: other };
    expect(validateSideDraft(draft, [owner], [])).toMatch(/unavailable/);
  });
  it("rejects source longer than a single side or containing excessive lines", () => {
    const draft = {
      title: "Long",
      target: { kind: "project" as const, id: owner },
      content: "L\n".repeat(MAX_SIDE_LINES + 1),
    };
    expect(validateSideDraft(draft, [owner], [])).toMatch(/lines/);
    draft.content = "A".repeat(25001);
    expect(validateSideDraft(draft, [owner], [])).toMatch(/too long/);
  });
  it("accepts first and last line anchors and rejects out of bounds and reversals", () => {
    const text = "A\nB\nC";
    expect(validateSideAnnotations([note], text)).toBeNull();
    expect(validateSideAnnotations([{ ...note, fromLine: 3, toLine: 2 }], text)).toMatch(
      /Line range/,
    );
    expect(validateSideAnnotations([{ ...note, toLine: 4 }], text)).toMatch(/Line range/);
    expect(validateSideAnnotations([{ ...note, fromLine: 0 }], text)).toMatch(/Line range/);
    expect(validateSideAnnotations([{ ...note, toLine: 2.5 }], text)).toMatch(/Line range/);
  });
  it("requires distinct beat identities and limits user-authored annotations", () => {
    expect(validateSideAnnotations([note, note], "A\nB\nC")).toMatch(/unique/);
    expect(validateSideAnnotations([{ ...note, beat: "  " }], "A\nB\nC")).toMatch(/beat label/);
    expect(validateSideAnnotations([{ ...note, objective: "x".repeat(501) }], "A\nB\nC")).toMatch(
      /500/,
    );
  });
  it("rejects malformed cloud beat annotations without executing supplied text", () => {
    const notes = parseSideAnnotations(
      [
        { ...note, beat: "<script>not executed</script>" },
        { ...note, id: "not a uuid" },
        { ...note, toLine: 99 },
        { ...note, fromLine: "2" },
      ],
      "A\nB\nC",
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]?.beat).toBe("<script>not executed</script>");
    expect(parseSideAnnotations([note, note], "A\nB\nC")).toHaveLength(1);
  });
});

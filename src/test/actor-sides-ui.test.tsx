import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActorSidesPage } from "@/components/foundation/ActorSidesPage";

const owner = "9e18a3fd-0749-4657-945d-f60872c88faa";
const mocks = vi.hoisted(() => ({
  sides: {} as Record<string, unknown>,
  projects: {} as Record<string, unknown>,
  auditions: {} as Record<string, unknown>,
  create: vi.fn(),
  annotate: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/use-actor-sides", () => ({ useActorSides: () => mocks.sides }));
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mocks.projects }));
vi.mock("@/lib/use-actor-auditions", () => ({ useActorAuditions: () => mocks.auditions }));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: "en" }) }));
vi.mock("@/components/slams", () => ({
  Page: ({ children, title }: { children: ReactNode; title: string }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
const saved = {
  id: "9d4b12b1-cccb-45c4-9bee-b7fd71943440",
  userId: "actor-A",
  title: "The Balcony",
  content: "THE ROOM\nمريم: ما تمشيش\nSAM: I have to go",
  target: { kind: "project" as const, id: owner },
  annotations: [],
  revision: 1,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("crypto", {
    randomUUID: () => "a823216a-e0af-42b9-9028-c67b94ebf940",
    subtle: webcrypto.subtle,
  });
  mocks.sides = {
    userId: "actor-A",
    signedIn: true,
    loaded: true,
    sides: [saved],
    error: null,
    create: mocks.create,
    annotate: mocks.annotate,
    reload: mocks.reload,
  };
  mocks.projects = {
    loaded: true,
    error: null,
    projects: [{ id: owner, title: "The Balcony" }],
  };
  mocks.auditions = { loaded: true, error: null, records: [] };
  mocks.create.mockResolvedValue({ value: saved });
  mocks.annotate.mockResolvedValue({
    value: {
      ...saved,
      annotations: [
        {
          id: "a823216a-e0af-42b9-9028-c67b94ebf940",
          fromLine: 2,
          toLine: 3,
          beat: "New tactic",
          objective: "To stop them",
          tactic: "To reassure",
        },
      ],
      revision: 2,
    },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Script sides UI", () => {
  it("imports pasted multilingual text only after user confirms save and parent", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: "New side" }));
    const save = screen.getByRole("button", { name: "Save side" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Side title"), { target: { value: "Side 2" } });
    fireEvent.change(screen.getByLabelText("Attach to one of your projects or auditions"), {
      target: { value: "project:" + owner },
    });
    fireEvent.change(screen.getByLabelText("Paste original side text"), {
      target: { value: "INT. ROOM\r\nمريم: صدقني" },
    });
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(save);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      {
        title: "Side 2",
        content: "INT. ROOM\nمريم: صدقني",
        target: { kind: "project", id: owner },
      },
      [owner],
      [],
    );
  });
  it("reads UTF-8 .txt locally and retains CRLF source until explicit save", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: "New side" }));
    const file = new File(["A\r\nليلى: ابقى"], "my-side.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", { value: async () => "A\r\nليلى: ابقى" });
    fireEvent.change(screen.getByLabelText(/Or load a UTF-8/), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(
        (screen.getByLabelText("Paste original side text") as HTMLTextAreaElement).value,
      ).toContain("ليلى: ابقى"),
    );
    fireEvent.change(screen.getByLabelText("Attach to one of your projects or auditions"), {
      target: { value: "project:" + owner },
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save side" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed this text preview/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save side" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "my-side",
        content: "A\r\nليلى: ابقى",
      }),
      [owner],
      [],
      {
        source: expect.objectContaining({
          file,
          kind: "txt",
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      },
    );
  });
  it("rejects a malformed PDF while retaining the draft without uploading", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: "New side" }));
    const file = new File(["PDF data"], "sides.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Or load a UTF-8/), {
      target: { files: [file] },
    });
    await waitFor(() => expect(screen.getByText(/valid PDF header/)).toBeInTheDocument());
    expect(screen.getByLabelText("Paste original side text")).toHaveValue("");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("selects a valid excerpt from a larger source while retaining the full original", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: "New side" }));
    const text = Array.from({ length: 500 }, (_, index) => `${index + 1}: ${"a".repeat(95)}`).join(
      "\n",
    );
    const file = new File([text], "whole-script.txt");
    fireEvent.change(screen.getByLabelText(/Or load a UTF-8/), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByLabelText("First source line")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Attach to one of your projects or auditions"), {
      target: { value: "project:" + owner },
    });
    expect(screen.getByRole("button", { name: "Save side" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("First source line"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Last source line"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Use these source lines" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed this text preview/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save side" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: text.split("\n").slice(9, 12).join("\n") }),
      [owner],
      [],
      { source: expect.objectContaining({ file, content: text }) },
    );
  });

  it("creates a new source version on the same parent only after explicit review", async () => {
    const existing = {
      ...saved,
      annotations: [
        {
          id: "a823216a-e0af-42b9-9028-c67b94ebf940",
          fromLine: 1,
          toLine: 1,
          beat: "Old beat",
          objective: "",
          tactic: "",
        },
      ],
      sourceVersion: 1,
      sourceGroupId: saved.id,
    };
    mocks.sides = { ...mocks.sides, sides: [existing] };
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: /The Balcony/ }));
    fireEvent.click(screen.getByRole("button", { name: "New source version" }));
    expect(screen.getByLabelText("Attach to one of your projects or auditions")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Paste original side text"), {
      target: { value: "A revised script\nNew second line" },
    });
    expect(screen.getByRole("button", { name: "Save side" })).toBeDisabled();
    expect(screen.getByText(/no beat notes/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed this text preview/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save side" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "A revised script\nNew second line",
        target: existing.target,
      }),
      [owner],
      [],
      { previous: existing },
    );
    expect(existing.content).toBe(saved.content);
    expect(existing.annotations).toHaveLength(1);
  });

  it("displays script evidence separately from interpretation and saves line-anchored beat", async () => {
    render(<ActorSidesPage />);
    fireEvent.click(screen.getByRole("button", { name: /The Balcony/ }));
    expect(
      screen.getByRole("list", { name: "Original script — immutable snapshot" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("From line"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("To line"), { target: { value: "3" } });
    expect(screen.getAllByText(/مريم: ما تمشيش/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Beat / change"), { target: { value: "New tactic" } });
    fireEvent.change(screen.getByLabelText("Actor's playable objective (interpretation)"), {
      target: { value: "To stop them" },
    });
    fireEvent.change(screen.getByLabelText("Tactic / action (interpretation)"), {
      target: { value: "To reassure" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stage beat" }));
    expect(mocks.annotate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save beat annotations" }));
    await waitFor(() => expect(mocks.annotate).toHaveBeenCalledOnce());
    expect(mocks.annotate).toHaveBeenCalledWith(
      expect.objectContaining({ id: saved.id, content: saved.content, revision: 1 }),
      [expect.objectContaining({ fromLine: 2, toLine: 3, beat: "New tactic" })],
    );
  });
  it("requires sign-in and does not provide guest cloud import", () => {
    mocks.sides = { ...mocks.sides, userId: undefined, signedIn: false, sides: [] };
    render(<ActorSidesPage />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.queryByRole("button", { name: "New side" })).toBeNull();
  });
  it("shows real failure instead of fake import when schema is not installed", () => {
    mocks.sides = { ...mocks.sides, sides: [], error: "table missing" };
    render(<ActorSidesPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("not available");
    expect(screen.queryByRole("button", { name: "New side" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
});

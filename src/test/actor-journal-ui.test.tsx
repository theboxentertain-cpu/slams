import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActorJournal } from "@/components/foundation/ActorJournal";
import { journalSelectionSearch, validateJournalDraft } from "@/lib/actor-journal-model";
const mock = vi.hoisted(() => ({
  journal: {} as Record<string, unknown>,
  projects: {} as Record<string, unknown>,
  locale: "en",
  create: vi.fn(),
  update: vi.fn(),
  history: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("@/lib/use-actor-projects", () => ({ useActorProjects: () => mock.projects }));
vi.mock("@/lib/use-actor-journal", () => ({ useActorJournal: () => mock.journal }));
vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ locale: mock.locale }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
  }: {
    to: string;
    search?: Record<string, unknown>;
    children: ReactNode;
  }) => (
    <a href={to} data-search={JSON.stringify(search)}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/slams", () => ({
  Page: ({ children }: { children: ReactNode }) => <main>{children}</main>,
  btnPrimary: "primary",
  btnSecondary: "secondary",
}));
const entry = {
  id: "entry-a",
  userId: "actor-a",
  projectId: "project-a",
  auditionId: "audition-a",
  rehearsalId: "rehearsal-a",
  title: "First rehearsal",
  body: "Keep the silence",
  status: "active",
  revision: 3,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  mock.locale = "en";
  mock.projects = {
    loaded: true,
    signedIn: true,
    projects: [{ id: "project-a", title: "Hamlet", status: "active" }],
    error: null,
  };
  mock.journal = {
    userId: "actor-a",
    loaded: true,
    signedIn: true,
    entries: [entry],
    error: null,
    create: mock.create,
    update: mock.update,
    loadHistory: mock.history,
    reload: mock.reload,
  };
  mock.create.mockResolvedValue({ value: { ...entry, title: "New entry", body: "New notes" } });
  mock.update.mockResolvedValue({ value: { ...entry, revision: 4, body: "New notes" } });
  mock.history.mockResolvedValue({
    value: [
      {
        revision: 1,
        title: "Original rehearsal",
        body: "Old notes",
        status: "active",
        createdAt: entry.createdAt,
      },
    ],
  });
});
afterEach(cleanup);
describe("Project journal workspace", () => {
  it("offers a project chooser and requires authentication without pretending to persist guest notes", () => {
    const mounted = render(<ActorJournal />);
    expect(screen.getByRole("link", { name: "Hamlet" })).toHaveAttribute(
      "data-search",
      JSON.stringify({ tab: "notes", projectId: "project-a" }),
    );
    mock.projects = { loaded: true, signedIn: false, projects: [] };
    mounted.rerender(<ActorJournal />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("creates a journal entry only on explicit create and carries audition/rehearsal context", async () => {
    render(
      <ActorJournal projectId="project-a" auditionId="audition-a" rehearsalId="rehearsal-a" />,
    );
    fireEvent.change(screen.getByLabelText("Entry title"), { target: { value: "New entry" } });
    fireEvent.change(screen.getByLabelText("Journal notes"), { target: { value: "New notes" } });
    expect(mock.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Create entry" }));
    await waitFor(() =>
      expect(mock.create).toHaveBeenCalledWith(
        { title: "New entry", body: "New notes" },
        { auditionId: "audition-a", rehearsalId: "rehearsal-a" },
        expect.any(String),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("saved as a new revision");
  });
  it("preserves the draft after a save conflict and requires an explicit action to archive", async () => {
    mock.update.mockResolvedValue({ error: "Conflict" });
    render(<ActorJournal projectId="project-a" />);
    fireEvent.click(screen.getByRole("button", { name: "First rehearsal" }));
    fireEvent.change(screen.getByLabelText("Journal notes"), {
      target: { value: "My unsaved work" },
    });
    expect(screen.getByRole("button", { name: "Archive entry" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your draft is still here");
    expect(screen.getByLabelText("Journal notes")).toHaveValue("My unsaved work");
    fireEvent.click(screen.getByRole("button", { name: "Discard unsaved changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive entry" }));
    await waitFor(() =>
      expect(mock.update).toHaveBeenLastCalledWith(
        entry,
        { title: entry.title, body: entry.body },
        "archived",
      ),
    );
  });
  it("loads version history without a write, then stages a version as an unsaved draft", async () => {
    render(<ActorJournal projectId="project-a" />);
    fireEvent.click(screen.getByRole("button", { name: "First rehearsal" }));
    fireEvent.click(screen.getByRole("button", { name: "View version history" }));
    const load = await screen.findByRole("button", {
      name: "Load this version into the editor (not saved)",
    });
    fireEvent.click(load);
    expect(screen.getByLabelText("Entry title")).toHaveValue("Original rehearsal");
    expect(screen.getByLabelText("Journal notes")).toHaveValue("Old notes");
    expect(mock.update).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Save it to create a new revision");
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    await waitFor(() =>
      expect(mock.update).toHaveBeenCalledWith(
        entry,
        { title: "Original rehearsal", body: "Old notes" },
        "active",
      ),
    );
  });
  it("authors Arabic controls while keeping user text unchanged and clears editor state for another identity", () => {
    mock.locale = "ar";
    const mounted = render(<ActorJournal projectId="project-a" />);
    fireEvent.click(screen.getByRole("button", { name: "First rehearsal" }));
    expect(screen.getByLabelText("ملاحظات الدفتر")).toHaveValue("Keep the silence");
    expect(screen.getByRole("button", { name: "احفظ الملاحظة" })).toBeInTheDocument();
    mock.journal = { ...mock.journal, userId: "actor-b", entries: [] };
    mounted.rerender(<ActorJournal projectId="project-a" />);
    expect(screen.getByLabelText("ملاحظات الدفتر")).toHaveValue("");
    expect(screen.queryByText("First rehearsal")).not.toBeInTheDocument();
  });
  it("retains contextual links to the exact audition, rehearsal and project script sides", () => {
    render(<ActorJournal projectId="project-a" tab="scenes" />);
    fireEvent.click(screen.getByRole("button", { name: "First rehearsal" }));
    expect(screen.getByRole("link", { name: "Open linked audition" })).toHaveAttribute(
      "data-search",
      JSON.stringify({ tab: "auditions", auditionId: "audition-a" }),
    );
    expect(screen.getByRole("link", { name: "Open linked rehearsal" })).toHaveAttribute(
      "data-search",
      JSON.stringify({ sessionId: "rehearsal-a" }),
    );
    expect(screen.getByRole("link", { name: "Open script sides" })).toHaveAttribute(
      "data-search",
      JSON.stringify({ projectId: "project-a" }),
    );
  });
});
describe("Journal boundaries", () => {
  it("validates title/body size and filters malformed route context without translating IDs", () => {
    expect(validateJournalDraft({ title: " ", body: "" })).toBeTruthy();
    expect(validateJournalDraft({ title: "A", body: "م".repeat(20001) })).toBeTruthy();
    expect(validateJournalDraft({ title: "مشهد", body: "Mixed text" })).toBeNull();
    expect(
      journalSelectionSearch(
        {
          projectId: "AAAAAAAA-1111-2222-3333-444444444444",
          auditionId: "untrusted",
          rehearsalId: ["bad"],
        },
        "history",
      ),
    ).toEqual({
      tab: "history",
      projectId: "aaaaaaaa-1111-2222-3333-444444444444",
      auditionId: undefined,
      rehearsalId: undefined,
    });
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/components/slams", () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DirectorNote: () => null,
  DirectorToggle: () => (
    <fieldset>
      <legend>Director mode</legend>
    </fieldset>
  ),
  btnPrimary: "",
  btnSecondary: "",
}));
vi.mock("@/lib/store", () => ({
  usePassport: () => ({ add: mocks.add, signedIn: true, sessionLoading: false }),
}));
import { Route } from "@/routes/scene";
import { TACTICS, INTERVENTIONS, getObstacle } from "@/data/scene";
afterEach(cleanup);
beforeEach(() => {
  mocks.add.mockReset();
});
it("preserves branching, retake, reflection and shows success only after a confirmed save", async () => {
  mocks.add.mockResolvedValueOnce({ error: "Network failed" }).mockResolvedValueOnce({});
  const Component = (Route as unknown as { component: React.ComponentType }).component;
  render(<Component />);
  fireEvent.click(screen.getByText("Begin take"));
  fireEvent.click(screen.getByText("To plead"));
  expect(screen.getByText(/Sam softens/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Cut — call an intervention"));
  fireEvent.click(screen.getByText("Meisner — Listening"));
  expect(screen.getByText("Go to retake")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Your exercise"), {
    target: { value: "I observed the door" },
  });
  fireEvent.click(screen.getByText("Go to retake"));
  expect(screen.getByText(/You have only their silence/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Your new line or action"), {
    target: { value: "Stay here with me" },
  });
  fireEvent.click(screen.getByText("Cut — end take"));
  fireEvent.click(screen.getByText("Save to Passport"));
  expect(screen.getByRole("alert")).toHaveTextContent("Write a short reflection");
  fireEvent.change(screen.getByLabelText("Reflection"), {
    target: { value: "Listening changed the action" },
  });
  fireEvent.click(screen.getByText("Save to Passport"));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Network failed"));
  expect(screen.queryByText("Saved to your Passport")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Save to Passport"));
  await waitFor(() => expect(screen.getByText("Saved to your Passport")).toBeInTheDocument());
  expect(mocks.add).toHaveBeenLastCalledWith(
    expect.objectContaining({
      tactic: "To plead",
      retakeLine: "Stay here with me",
      reflection: "Listening changed the action",
    }),
  );
});

it("offers unsaved continuation, but not while an explicit save is pending", async () => {
const combinations = TACTICS.flatMap((tactic) =>
  INTERVENTIONS.map((intervention) => ({ tactic, intervention })),
);
it.each(combinations)(
  "preserves choices and review through $tactic.id / $intervention.id repeat navigation",
  ({ tactic, intervention }) => {
    const Component = (Route as unknown as { component: React.ComponentType }).component;
    render(<Component />);
    fireEvent.click(screen.getByRole("button", { name: "Begin take" }));
    fireEvent.click(screen.getByText(tactic.verb));
    expect(screen.getByText(tactic.response)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cut — call an intervention" }));
    fireEvent.click(screen.getByText(`${intervention.school} — ${intervention.label}`));
    fireEvent.change(screen.getByLabelText("Your exercise"), {
      target: { value: "My observation stays in the exercise" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go to retake" }));
    expect(screen.getByText(getObstacle(tactic.id, intervention.id))).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your new line or action"), {
      target: { value: "I wait by the door" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Back to exercise" }));
    expect(screen.getByLabelText("Your exercise")).toHaveValue(
      "My observation stays in the exercise",
    );
    fireEvent.click(screen.getByRole("button", { name: "Go to retake" }));
    expect(screen.getByLabelText("Your new line or action")).toHaveValue("I wait by the door");
    fireEvent.click(screen.getByRole("button", { name: "Cut — end take" }));
    expect(screen.getByRole("region", { name: "Rehearsal summary" })).toHaveTextContent(
      tactic.response,
    );
    expect(screen.getByRole("region", { name: "Rehearsal summary" })).toHaveTextContent(
      "I wait by the door",
    );
    fireEvent.change(screen.getByLabelText("Reflection"), {
      target: { value: "The silence changed my choice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
    expect(screen.getByLabelText("Your new line or action")).toHaveValue("I wait by the door");
    fireEvent.click(screen.getByRole("button", { name: "Cut — end take" }));
    expect(screen.getByLabelText("Reflection")).toHaveValue("The silence changed my choice");
    expect(
      screen.getByRole("link", { name: "Return to rehearsal without saving" }),
    ).toHaveAttribute("href", "/rehearsal");
    expect(mocks.add).not.toHaveBeenCalled();
  },
);
it("hides unsaved/retry actions while a confirmed save is pending", async () => {
  let complete: (result: { error?: string }) => void = () => undefined;
  mocks.add.mockImplementation(
    () =>
      new Promise<{ error?: string }>((resolve) => {
        complete = resolve;
      }),
  );
  const Component = (Route as unknown as { component: React.ComponentType }).component;
  render(<Component />);
  fireEvent.click(screen.getByText("Begin take"));
  fireEvent.click(screen.getByText("To plead"));
  fireEvent.click(screen.getByText("Cut — call an intervention"));
  fireEvent.click(screen.getByText("Meisner — Listening"));
  fireEvent.change(screen.getByLabelText("Your exercise"), {
    target: { value: "I observed the door" },
  });
  fireEvent.click(screen.getByText("Go to retake"));
  fireEvent.change(screen.getByLabelText("Your new line or action"), {
    target: { value: "Stay here with me" },
  });
  fireEvent.click(screen.getByText("Cut — end take"));
  expect(
    screen.getByRole("link", { name: "Continue to the Office without saving" }),
  ).toHaveAttribute("href", "/");
  expect(screen.getByText(/Leaving without saving discards/)).toBeInTheDocument();
  expect(mocks.add).not.toHaveBeenCalled();
  expect(screen.queryByText("Saved to your Passport")).not.toBeInTheDocument();
  let complete: (result: { error?: string }) => void = () => undefined;
  mocks.add.mockImplementationOnce(
    () =>
      new Promise<{ error?: string }>((resolve) => {
        complete = resolve;
      }),
  );
  fireEvent.change(screen.getByLabelText("Reflection"), {
    target: { value: "Listening changed my action" },
  });
  fireEvent.click(screen.getByText("Save to Passport"));
  expect(
    screen.queryByRole("link", { name: "Continue to the Office without saving" }),
  ).not.toBeInTheDocument();
  complete({});
  await waitFor(() => expect(screen.getByText("Saved to your Passport")).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("Reflection"), {
    target: { value: "Listening changed the action" },
  });
  fireEvent.click(screen.getByText("Save to Passport"));
  expect(
    screen.queryByRole("link", { name: "Return to rehearsal without saving" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Practice again" })).not.toBeInTheDocument();
  expect(screen.queryByText("Saved to your Passport")).not.toBeInTheDocument();
  complete({});
  await waitFor(() => expect(screen.getByText("Saved to your Passport")).toBeInTheDocument());
  expect(screen.getByRole("link", { name: "Return to the rehearsal studio" })).toHaveAttribute(
    "href",
    "/rehearsal",
  );
});

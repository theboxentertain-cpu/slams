import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DirectorNote } from "@/components/slams";

const state = vi.hoisted(() => ({ mode: "on" }));
vi.mock("@/lib/store", () => ({ useDirectorMode: () => [state.mode, vi.fn()] }));
afterEach(cleanup);
describe("Director presence during rehearsal", () => {
  it("renders the same illustrated identity with existing scripted notes", () => {
    state.mode = "on";
    const { container } = render(
      <DirectorNote short="Brief note">Full scripted note</DirectorNote>,
    );
    expect(screen.getByText("Full scripted note")).toBeInTheDocument();
    expect(container.querySelector(".director-portrait")).toBeInTheDocument();
  });
  it("keeps quiet mode short", () => {
    state.mode = "quiet";
    render(<DirectorNote short="Brief note">Full scripted note</DirectorNote>);
    expect(screen.getByText("Brief note")).toBeInTheDocument();
    expect(screen.queryByText("Full scripted note")).toBeNull();
  });
  it.each(["on", "quiet", "off"])("never renders the Director during a take in %s mode", (mode) => {
    state.mode = mode;
    render(<DirectorNote performing>Do not interrupt</DirectorNote>);
    expect(screen.queryByRole("complementary")).toBeNull();
  });
  it("removes the portrait and note in off mode", () => {
    state.mode = "off";
    const { container } = render(<DirectorNote>Hidden note</DirectorNote>);
    expect(container).toBeEmptyDOMElement();
  });
});

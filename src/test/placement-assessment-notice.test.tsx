import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlacementAssessmentNotice } from "@/components/foundation/PlacementAssessmentNotice";
import { SCHOOLS } from "@/data/schools";

afterEach(cleanup);
describe("academic assessment pathway is present, but cannot grant credit", () => {
  for (const school of SCHOOLS) {
    it(school.name + " exposes a truthful assessed placement pathway", () => {
      render(<PlacementAssessmentNotice school={school.slug} />);
      expect(screen.getByRole("heading", { name: "Already trained? Prove your starting level." }))
        .toBeInTheDocument();
      expect(screen.getByText("Assessment unavailable")).toBeInTheDocument();
      expect(screen.getByText(/verified server-side unlock/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /skip|unlock|approve/i })).toBeNull();
      cleanup();
    });
  }
});

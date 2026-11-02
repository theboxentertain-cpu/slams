import { Link } from "@tanstack/react-router";
import { ChartNoAxesCombined, ChevronRight } from "lucide-react";

/** Loaded record counts only: there is no reviewed whole-course completion denominator. */
export function OfficeJourney({
  rehearsals,
  milestones,
  signedIn,
}: {
  rehearsals: number | null;
  milestones: number | null;
  signedIn: boolean;
}) {
  return (
    <Link to="/progress" className="office-journey" aria-label="Your progress — view saved work">
      <ChartNoAxesCombined aria-hidden="true" />
      <span className="journey-title">
        <strong>Your journey</strong>
        <small>{signedIn ? "Your account records" : "Rehearsals on this device"}</small>
      </span>
      <dl>
        <div>
          <dd>{rehearsals ?? "—"}</dd>
          <dt>Rehearsals</dt>
        </div>
        <div>
          <dd>{milestones ?? "—"}</dd>
          <dt>Curriculum units completed</dt>
        </div>
      </dl>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

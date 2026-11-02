import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

/** The reference's wall is navigation to existing help, not a user assessment. */
export function BadActingWall() {
  return (
    <Link
      className="bad-acting-wall"
      to="/stuck"
      aria-label="The Wall of Bad Acting — Fix it here, open scene help"
    >
      <span className="wall-clip" aria-hidden="true" />
      <strong>
        The Wall of
        <br />
        Bad Acting
      </strong>
      <span className="wall-rule" aria-hidden="true" />
      <span className="wall-topics">
        <span>Fake emotion</span>
        <span>Crying on cue</span>
        <span>Exposition dumps</span>
        <span>Acting at people</span>
        <span>No objective</span>
        <span>Pretty performance</span>
        <span>Playing a mood</span>
      </span>
      <em>
        FIX IT
        <br />
        HERE <ArrowUpRight size={22} aria-hidden="true" />
      </em>
    </Link>
  );
}

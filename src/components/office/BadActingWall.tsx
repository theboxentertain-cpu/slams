import { T } from "@/lib/i18n";
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
        <T>The Wall of</T>
        <br />
        <T>Bad Acting</T>
      </strong>
      <span className="wall-rule" aria-hidden="true" />
      <span className="wall-topics">
        <span>
          <T>Fake emotion</T>
        </span>
        <span>
          <T>Crying on cue</T>
        </span>
        <span>
          <T>Exposition dumps</T>
        </span>
        <span>
          <T>Acting at people</T>
        </span>
        <span>
          <T>No objective</T>
        </span>
        <span>
          <T>Pretty performance</T>
        </span>
        <span>
          <T>Playing a mood</T>
        </span>
      </span>
      <em>
        <T>FIX IT</T>
        <br />
        <T>HERE </T>
        <ArrowUpRight size={22} aria-hidden="true" />
      </em>
    </Link>
  );
}

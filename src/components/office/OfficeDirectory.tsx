import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { OfficeArt } from "./OfficeArt";
import { CoverDrawing } from "./SchoolBooks";
/** Four useful entrances into three worlds and their shared rehearsal engine. */
export function OfficeDirectory({
  includeRehearsal = false,
  onStuckIntent,
}: {
  includeRehearsal?: boolean;
  onStuckIntent?: () => void;
}) {
  return (
    <nav
      className="office-portals"
      aria-label={includeRehearsal ? "Choose your studio task" : "The three SLAMS worlds"}
    >
      <Link to="/conservatory" data-task="train">
        <span className="portal-art portal-architecture" aria-hidden="true">
          <CoverDrawing motif="architecture" />
        </span>
        <strong>{includeRehearsal ? "Train" : "The Conservatory"}</strong>
        <span>The Conservatory</span>
        <small>Eight acting schools</small>
        <ArrowUpRight className="portal-arrow" aria-hidden="true" />
      </Link>
      {includeRehearsal && (
        <Link to="/rehearsal" data-task="rehearse">
          <span className="portal-art" aria-hidden="true">
            <OfficeArt kind="clapper" />
          </span>
          <strong>Rehearse</strong>
          <span>The Living Scene</span>
          <small>Perform · Retake · Reflect</small>
          <ArrowUpRight className="portal-arrow" aria-hidden="true" />
        </Link>
      )}
      <Link to="/work" data-task="work">
        <span className="portal-art" aria-hidden="true">
          <OfficeArt kind="casting" />
        </span>
        <strong>{includeRehearsal ? "Work" : "Actor at Work"}</strong>
        <span>Actor at Work</span>
        <small>Audition preparation</small>
        <ArrowUpRight className="portal-arrow" aria-hidden="true" />
      </Link>
      <Link to="/stuck" data-task="stuck" onFocus={onStuckIntent} onPointerEnter={onStuckIntent}>
        <span className="portal-art" aria-hidden="true">
          <OfficeArt kind="script" />
        </span>
        <strong>{includeRehearsal ? "Get Unstuck" : "The Stuck Desk"}</strong>
        <span>The Stuck Desk</span>
        <small>Change one thing. Try again.</small>
        <ArrowUpRight className="portal-arrow" aria-hidden="true" />
      </Link>
    </nav>
  );
}

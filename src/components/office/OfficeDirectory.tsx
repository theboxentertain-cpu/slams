import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { OfficeArt } from "./OfficeArt";
import { CoverDrawing } from "./SchoolBooks";
/** The three equal worlds; supporting systems live in the room and profile menu. */
export function OfficeDirectory() {
  return (
    <nav className="office-portals" aria-label="The three SLAMS worlds">
      <Link to="/conservatory">
        <span className="portal-art portal-architecture" aria-hidden="true">
          <CoverDrawing motif="architecture" />
        </span>
        <strong>The Conservatory</strong>
        <span>Learn the craft</span>
        <ArrowUpRight className="portal-arrow" aria-hidden="true" />
      </Link>
      <Link to="/work">
        <span className="portal-art" aria-hidden="true">
          <OfficeArt kind="casting" />
        </span>
        <strong>Actor at Work</strong>
        <span>Do the work</span>
        <ArrowUpRight className="portal-arrow" aria-hidden="true" />
      </Link>
      <Link to="/stuck">
        <span className="portal-art" aria-hidden="true">
          <OfficeArt kind="script" />
        </span>
        <strong>The Stuck Desk</strong>
        <span>Fix what isn’t working</span>
        <ArrowUpRight className="portal-arrow" aria-hidden="true" />
      </Link>
    </nav>
  );
}

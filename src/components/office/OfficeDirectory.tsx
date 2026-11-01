import { Link } from "@tanstack/react-router";
import { BookOpen, Spotlight, ScrollText } from "lucide-react";
/** The three equal worlds; supporting systems live in the room and profile menu. */
export function OfficeDirectory() {
  return (
    <nav className="office-portals" aria-label="The three SLAMS worlds">
      <Link to="/conservatory">
        <BookOpen aria-hidden="true" />
        <strong>The Conservatory</strong>
        <span>Learn the craft</span>
      </Link>
      <Link to="/work">
        <Spotlight aria-hidden="true" />
        <strong>Actor at Work</strong>
        <span>Do the work</span>
      </Link>
      <Link to="/stuck">
        <ScrollText aria-hidden="true" />
        <strong>The Stuck Desk</strong>
        <span>Fix what isn’t working</span>
      </Link>
    </nav>
  );
}

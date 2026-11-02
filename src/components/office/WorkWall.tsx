import { OfficeObject } from "./OfficeObject";
import { Link } from "@tanstack/react-router";
import { BadActingWall } from "./BadActingWall";
import { OFFICE_CONTROLS } from "./office-data";

export default function WorkWall({ savedCount }: { savedCount: number | null }) {
  return (
    <>
      <div className="room-heading">
        <span className="office-kicker">02 / THE WORK WALL</span>
        <h2>
          The work
          <br />
          <em>before the room.</em>
        </h2>
        <p>
          Gather the circumstances.
          <br />
          Leave the pretending at the door.
        </p>
      </div>
      <OfficeObject destination="work" />
      <OfficeObject
        destination="passport"
        detail={
          savedCount === null
            ? "Your rehearsal records"
            : `${savedCount} ${savedCount === 1 ? "rehearsal" : "rehearsals"} saved`
        }
      />
      <OfficeObject destination="matrix" />
      <BadActingWall />
      <Link className="wall-progress-sheet" to={OFFICE_CONTROLS.progress.to}>
        <strong>Progress, on record</strong>
        <span>
          {savedCount === null ? "Records unavailable" : `${savedCount} rehearsals saved`}
        </span>
      </Link>
      <Link className="wall-scene-notes" to="/work">
        Scene & character notes · Actor at Work
      </Link>
      <div className="wall-pin-note" aria-hidden="true">
        The part is yours.
        <br />
        The work is also yours.
      </div>
    </>
  );
}

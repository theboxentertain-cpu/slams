import { T } from "@/lib/i18n";
import { OfficeObject } from "./OfficeObject";
import { Link } from "@tanstack/react-router";
import { BadActingWall } from "./BadActingWall";
import { OFFICE_CONTROLS } from "./office-data";

export default function WorkWall({ savedCount }: { savedCount: number | null }) {
  return (
    <>
      <div className="room-heading">
        <span className="office-kicker">
          <T>02 / THE WORK WALL</T>
        </span>
        <h2>
          <T>The Work Wall</T>
        </h2>
        <p>
          <T>Plan. Practice. Track. Grow.</T>
        </p>
      </div>
      <div className="work-wall-cork" aria-hidden="true" />
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
      <OfficeObject destination="stuck" />
      <BadActingWall />
      <Link className="wall-progress-sheet" to={OFFICE_CONTROLS.progress.to}>
        <strong>
          <T>Progress, on record</T>
        </strong>
        <span>
          {savedCount === null ? "Records unavailable" : `${savedCount} rehearsals saved`}
        </span>
      </Link>
      <Link className="wall-scene-notes" to="/work">
        <T>Scene & character notes · Actor at Work</T>
      </Link>
    </>
  );
}

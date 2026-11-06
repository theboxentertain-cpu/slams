import { T } from "@/lib/i18n";
import { OfficeObject } from "./OfficeObject";
import { Link } from "@tanstack/react-router";

export default function RehearsalCorner() {
  return (
    <>
      <div className="room-heading">
        <span className="office-kicker"><T>03 / THE REHEARSAL CORNER</T></span>
        <h2><T>
          Less showing.
          </T><br />
          <em><T>More doing.</T></em>
        </h2>
        <p><T>
          A little space.
          </T><br /><T>A different way into the work.
        </T></p>
      </div>
      <div className="rehearsal-spotlight" aria-hidden="true" />
      <OfficeObject destination="baseline" />
      <OfficeObject destination="lab" />
      <OfficeObject destination="lounge" />
      <Link to="/scene" className="corner-stage-link"><T>
        Step onto the stage </T><span><T>Start the Living Scene</T></span>
      </Link>
      <p className="corner-development"><T>
        These studio systems are in development.
        </T><br /><T>
        The Living Scene is ready when you are.
      </T></p>
    </>
  );
}

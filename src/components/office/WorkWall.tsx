import { OfficeObject } from "./OfficeObject";

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
      <div className="wall-pin-note" aria-hidden="true">
        The part is yours.
        <br />
        The work is also yours.
      </div>
    </>
  );
}

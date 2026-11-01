import { OfficeObject } from "./OfficeObject";

export default function RehearsalCorner() {
  return (
    <>
      <div className="room-heading">
        <span className="office-kicker">03 / THE REHEARSAL CORNER</span>
        <h2>
          Less showing.
          <br />
          <em>More doing.</em>
        </h2>
        <p>
          A little space.
          <br />A different way into the work.
        </p>
      </div>
      <div className="rehearsal-spotlight" aria-hidden="true" />
      <OfficeObject destination="baseline" />
      <OfficeObject destination="lab" />
      <OfficeObject destination="lounge" />
      <p className="corner-development">
        These studio systems are in development.
        <br />
        The Living Scene is ready when you are.
      </p>
    </>
  );
}

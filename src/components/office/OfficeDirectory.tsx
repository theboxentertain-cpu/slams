import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Clapperboard,
  Drama,
  FlaskConical,
  House,
  IdCard,
  Network,
  ScrollText,
  Spotlight,
} from "lucide-react";
import { OFFICE_DESTINATIONS } from "./office-data";

type Props = {
  onBooks: (trigger: HTMLElement) => void;
  onProgress: (trigger: HTMLElement) => void;
  onOffice: () => void;
};

export function OfficeDirectory({ onProgress }: Pick<Props, "onProgress">) {
  return (
    <nav className="office-directory" aria-label="Studio directory">
      <Link to={OFFICE_DESTINATIONS.work.to} aria-label="Actor at Work — open audition preparation">
        <Spotlight aria-hidden="true" />
        <span>
          Actor
          <br />
          at Work
        </span>
      </Link>
      <Link to={OFFICE_DESTINATIONS.stuck.to} aria-label="The Stuck Desk — open scene help">
        <ScrollText aria-hidden="true" />
        <span>
          The
          <br />
          Stuck Desk
        </span>
      </Link>
      <Link
        to={OFFICE_DESTINATIONS.matrix.to}
        aria-label="Technique Matrix — open the technique diagram section"
      >
        <Network aria-hidden="true" />
        <span>
          Technique
          <br />
          Matrix
        </span>
      </Link>
      <Link
        to={OFFICE_DESTINATIONS.lab.to}
        aria-label="Performance Lab — open the performance tools section"
      >
        <FlaskConical aria-hidden="true" />
        <span>
          Performance
          <br />
          Lab
        </span>
      </Link>
      <Link
        to={OFFICE_DESTINATIONS.passport.to}
        aria-label="Passport — open saved rehearsal records"
      >
        <IdCard aria-hidden="true" />
        <span>Passport</span>
      </Link>
      <button
        type="button"
        onClick={(event) => onProgress(event.currentTarget)}
        aria-label="Progress — view verified progress"
      >
        <ChartNoAxesColumnIncreasing aria-hidden="true" />
        <span>Progress</span>
      </button>
    </nav>
  );
}

export function OfficeBottomNav({ onBooks, onProgress, onOffice }: Props) {
  return (
    <nav className="office-bottom-nav" aria-label="Main studio navigation">
      <button type="button" onClick={onOffice} aria-label="Office — return to the desk view">
        <House aria-hidden="true" />
        <span>Office</span>
      </button>
      <button
        type="button"
        onClick={(event) => onBooks(event.currentTarget)}
        aria-label="Conservatory — open the acting-school library"
      >
        <BookOpen aria-hidden="true" />
        <span>Conservatory</span>
      </button>
      <Link to={OFFICE_DESTINATIONS.rehearsal.to} aria-label="Rehearsal — open the Living Scene">
        <Clapperboard aria-hidden="true" />
        <span>Rehearsal</span>
      </Link>
      <Link
        to={OFFICE_DESTINATIONS.work.to}
        aria-label="Actor at Work — open audition preparation from navigation"
      >
        <Drama aria-hidden="true" />
        <span>Actor at Work</span>
      </Link>
      <button
        type="button"
        onClick={(event) => onProgress(event.currentTarget)}
        aria-label="Progress — open your progress summary"
      >
        <ChartNoAxesColumnIncreasing aria-hidden="true" />
        <span>Progress</span>
      </button>
      <Link to={OFFICE_DESTINATIONS.passport.to} aria-label="Passport — open your saved records">
        <IdCard aria-hidden="true" />
        <span>Passport</span>
      </Link>
    </nav>
  );
}

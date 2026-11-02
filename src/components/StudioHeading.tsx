import type { ReactNode } from "react";
import { Drama } from "lucide-react";
import { SectionCoach } from "./office/SectionCoach";
import { BOOK_DESIGNS } from "./office/office-data";
import { BookCover } from "./office/SchoolBooks";
import { OfficeArt } from "./office/OfficeArt";

export type StudioWorld =
  | "studio"
  | "school"
  | "conservatory"
  | "work"
  | "stuck"
  | "rehearsal"
  | "scene"
  | "passport"
  | "progress";

/** Illustration is separate from actual titles, content and account state. */
export function StudioHeading({
  title,
  eyebrow,
  school,
  world,
  performing = false,
}: {
  title: ReactNode;
  eyebrow?: string | undefined;
  school?: string | undefined;
  world: StudioWorld;
  performing?: boolean;
}) {
  const book = BOOK_DESIGNS.find((item) => item.slug === school);
  const hasDirector = !performing;
  return (
    <header
      className="studio-heading"
      data-illustrated={
        hasDirector || world === "rehearsal" || world === "scene" ? "true" : "false"
      }
    >
      <div className="studio-heading-copy">
        {eyebrow && <p className="studio-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <span className="studio-title-stroke" aria-hidden="true" />
      </div>
      {hasDirector && (
        <SectionCoach key={world} section={world} />
      )}
      {book && (
        <span className="studio-heading-book" aria-hidden="true">
          <BookCover book={book} mini />
        </span>
      )}
      {(world === "rehearsal" || world === "scene") && performing && (
        <span className="studio-heading-prop" aria-hidden="true">
          <OfficeArt kind="clapper" />
        </span>
      )}
      {world === "passport" && (
        <span className="studio-passport-cover" aria-hidden="true">
          <Drama />
          <strong>SLAMS</strong>
          <small>ACTOR’S PASSPORT</small>
        </span>
      )}
    </header>
  );
}

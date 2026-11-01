import type { ReactNode } from "react";
import { Drama } from "lucide-react";
import readingDirector from "@/assets/office/director-reading.webp";
import pointingDirector from "@/assets/office/director-work-wall.webp";
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
}: {
  title: ReactNode;
  eyebrow?: string | undefined;
  school?: string | undefined;
  world: StudioWorld;
}) {
  const book = BOOK_DESIGNS.find((item) => item.slug === school);
  const director = world === "stuck" ? pointingDirector : readingDirector;
  const hasDirector = !!book || ["conservatory", "work", "stuck", "passport"].includes(world);
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
        <img
          className="studio-heading-director"
          src={director}
          alt=""
          width={world === "stuck" ? 1536 : 1086}
          height={world === "stuck" ? 1024 : 1448}
          decoding="async"
        />
      )}
      {book && (
        <span className="studio-heading-book" aria-hidden="true">
          <BookCover book={book} mini />
        </span>
      )}
      {(world === "rehearsal" || world === "scene") && (
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

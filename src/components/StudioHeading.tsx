import type { ReactNode } from "react";
import { Drama } from "lucide-react";
import { SectionCoach } from "./office/SectionCoach";
import { BOOK_DESIGNS } from "./office/office-data";
import { BookCover } from "./office/SchoolBooks";
import { OfficeArt } from "./office/OfficeArt";
import { SchoolPortrait } from "./foundation/SchoolPortrait";
import studio from "@/assets/premium/director-studio.webp";
import baseline from "@/assets/premium/baseline-director.webp";

export type StudioWorld =
  | "studio"
  | "school"
  | "conservatory"
  | "baseline"
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
  const scenic = world === "conservatory" || world === "baseline" || (world === "school" && !!book);
  const description =
    book?.school.focus ??
    (world === "conservatory"
      ? "Eight schools. Eight ways into the work."
      : world === "baseline"
        ? "Before we train, set your starting point."
        : undefined);
  return (
    <header
      className={`studio-heading${scenic ? " training-heading" : ""}`}
      data-scene={scenic ? world : undefined}
      data-illustrated={
        hasDirector || world === "rehearsal" || world === "scene" ? "true" : "false"
      }
    >
      {scenic && (
        <span className="training-heading-art" aria-hidden="true">
          {book ? (
            <SchoolPortrait school={book.slug} />
          ) : (
            <img
              src={world === "baseline" ? baseline : studio}
              alt=""
              width={1536}
              height={1024}
              fetchPriority="high"
            />
          )}
        </span>
      )}
      <div className="studio-heading-copy">
        {eyebrow && <p className="studio-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <span className="studio-title-stroke" aria-hidden="true" />
        {scenic && description && <p className="training-heading-description">{description}</p>}
      </div>
      {hasDirector && <SectionCoach key={world} section={world} compact={scenic} />}
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

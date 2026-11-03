import atlas from "@/assets/premium/director-school-worlds.webp";
import { BOOK_DESIGNS } from "@/components/office/office-data";

/** Decorative school scenes, in the same canonical order as the eight books. */
export function SchoolPortrait({ school, className = "" }: { school: string; className?: string }) {
  const cell = BOOK_DESIGNS.findIndex((book) => book.slug === school);
  if (cell < 0) return null;
  return (
    <span
      aria-hidden="true"
      data-school-pose={school}
      className={`school-portrait ${className}`}
      style={{
        backgroundImage: `url(${atlas})`,
        backgroundPosition: `${((cell % 4) * 100) / 3}% ${cell < 4 ? 0 : 100}%`,
      }}
    />
  );
}

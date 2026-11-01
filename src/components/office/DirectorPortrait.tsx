import type { CSSProperties } from "react";
import atlas from "@/assets/office/director-atlas.webp";
import { DIRECTOR_EXPRESSIONS, type DirectorExpression } from "./office-data";

/** One consistent illustrated character; seven expressions and a full-body master. */
export function DirectorPortrait({
  expression = "observant",
  className = "",
}: {
  expression?: DirectorExpression;
  className?: string;
}) {
  const cell = DIRECTOR_EXPRESSIONS.indexOf(expression);
  return (
    <span
      aria-hidden="true"
      className={`director-portrait ${className}`}
      data-expression={expression}
      style={
        {
          backgroundImage: `url(${atlas})`,
          backgroundPosition: `${((cell % 4) * 100) / 3}% ${cell < 4 ? 0 : 100}%`,
        } as CSSProperties
      }
    />
  );
}

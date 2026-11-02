import type { CSSProperties } from "react";
import atlas from "@/assets/office/director-reference-atlas.webp";
import referenceHero from "@/assets/office/director-reference.webp";
import { DIRECTOR_EXPRESSIONS, type DirectorExpression } from "./office-data";

/** One consistent illustrated character; seven expressions and a full-body master. */
export function DirectorPortrait({
  expression = "observant",
  className = "",
  hero = false,
}: {
  expression?: DirectorExpression;
  className?: string;
  hero?: boolean;
}) {
  const cell = DIRECTOR_EXPRESSIONS.indexOf(expression);
  const useHero = hero && (expression === "observant" || expression === "bored");
  return (
    <span
      aria-hidden="true"
      className={`director-portrait ${useHero ? "director-reference-hero" : ""} ${className}`}
      data-expression={expression}
      style={
        {
          backgroundImage: `url(${useHero ? referenceHero : atlas})`,
          backgroundPosition: useHero
            ? "center 10%"
            : `${((cell % 4) * 100) / 3}% ${cell < 4 ? 0 : 100}%`,
        } as CSSProperties
      }
    />
  );
}

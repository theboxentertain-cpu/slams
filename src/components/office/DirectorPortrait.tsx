import type { CSSProperties } from "react";
import atlas from "@/assets/premium/director-expressions.webp";
import referenceHero from "@/assets/premium/director-studio.webp";
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
          backgroundSize: useHero ? "250% auto" : "400% 200%",
          backgroundPosition: useHero
            ? "43% 35%"
            : `${((cell % 4) * 100) / 3}% ${cell < 4 ? 0 : 100}%`,
        } as CSSProperties
      }
    />
  );
}

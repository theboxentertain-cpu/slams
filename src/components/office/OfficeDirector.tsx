import reclining from "@/assets/welcome/director-reclining.webp";
import portrait from "@/assets/welcome/director-portrait.webp";
import type { DirectorExpression } from "./office-data";

/** Keep the master silhouette consistent; the coach panel carries expression close-ups. */
export function OfficeDirector({ expression }: { expression: DirectorExpression }) {
  return (
    <picture className="office-director-master" data-expression={expression}>
      <source media="(max-width:699px)" srcSet={portrait} />
      <img src={reclining} alt="" width={1536} height={1024} fetchPriority="high" />
    </picture>
  );
}

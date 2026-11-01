import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { OFFICE_DESTINATIONS, type OfficeDestination } from "./office-data";
import { OfficeArt } from "./OfficeArt";

export function OfficeObject({
  destination,
  detail,
  onIntent,
}: {
  destination: Exclude<OfficeDestination, "director">;
  detail?: string;
  onIntent?: () => void;
}) {
  const object = OFFICE_DESTINATIONS[destination];
  return (
    <Link
      to={object.to}
      className={`office-object prop-${object.prop}`}
      onFocus={onIntent}
      onPointerEnter={onIntent}
      aria-label={`${object.label} — ${detail ?? object.hint}`}
    >
      <span className="prop-illustration">
        <OfficeArt kind={object.prop} />
      </span>
      <span className="object-label">
        <strong>
          {object.label} <ArrowUpRight aria-hidden="true" size={12} />
        </strong>
        <span>{detail ?? object.hint}</span>
      </span>
    </Link>
  );
}

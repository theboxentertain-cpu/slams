import { createFileRoute, notFound } from "@tanstack/react-router";
import { UNIT_KINDS } from "@/lib/training";
import { UnitPage } from "@/components/foundation/SchoolPages";
export const Route = createFileRoute("/conservatory/$school/units/$kind/$unitId")({
  beforeLoad: ({ params }) => {
    if (
      !(UNIT_KINDS as readonly string[]).includes(params.kind) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.unitId)
    )
      throw notFound();
  },
  component: Screen,
});
function Screen() {
  return <UnitPage {...Route.useParams()} />;
}

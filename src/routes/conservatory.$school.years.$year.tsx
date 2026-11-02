import { createFileRoute, notFound } from "@tanstack/react-router";
import { getSchool } from "@/data/schools";
import { YearPage } from "@/components/foundation/SchoolPages";
export const Route = createFileRoute("/conservatory/$school/years/$year")({
  beforeLoad: ({ params }) => {
    if (!getSchool(params.school)?.curriculum.some((y) => String(y.number) === params.year))
      throw notFound();
  },
  component: Screen,
});
function Screen() {
  return <YearPage {...Route.useParams()} />;
}

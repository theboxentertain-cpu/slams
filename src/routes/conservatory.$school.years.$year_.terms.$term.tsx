import { createFileRoute, notFound } from "@tanstack/react-router";
import { getSchool } from "@/data/schools";
import { TermPage } from "@/components/foundation/SchoolPages";
export const Route = createFileRoute("/conservatory/$school/years/$year_/terms/$term")({
  beforeLoad: ({ params }) => {
    if (
      !getSchool(params.school)
        ?.curriculum.find((y) => String(y.number) === params.year)
        ?.terms.some((t) => String(t.number) === params.term)
    )
      throw notFound();
  },
  component: Screen,
});
function Screen() {
  return <TermPage {...Route.useParams()} />;
}

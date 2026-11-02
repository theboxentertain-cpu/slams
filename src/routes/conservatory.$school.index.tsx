import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SchoolPage } from "@/components/foundation/SchoolPages";
export const Route = createFileRoute("/conservatory/$school/")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("school", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { school } = Route.useParams();
  return (
    <SchoolPage
      school={school}
      tab={tab}
      onTabChange={(tab) => void navigate({ search: { tab } })}
    />
  );
}

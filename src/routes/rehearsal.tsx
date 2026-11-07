import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateRehearsalSearch } from "@/lib/actor-rehearsal-model";
import { RehearsalHub } from "@/components/foundation/WorkspacePages";
export const Route = createFileRoute("/rehearsal")({
  validateSearch: (input: Record<string, unknown> & SearchSchemaInput) =>
    validateRehearsalSearch(input),
  component: Screen,
});
function Screen() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RehearsalHub
      tab={search.tab}
      search={search}
      onContextChange={(next) => void navigate({ search: { tab: search.tab, ...next } })}
      onTabChange={(tab) => void navigate({ search: { tab } })}
    />
  );
}

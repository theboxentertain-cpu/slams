import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { journalSelectionSearch } from "@/lib/actor-journal-model";
import { ActorJournal } from "@/components/foundation/ActorJournal";
export const Route = createFileRoute("/work/journal")({
  validateSearch: (
    input: {
      tab?: unknown;
      projectId?: unknown;
      auditionId?: unknown;
      rehearsalId?: unknown;
    } & SearchSchemaInput,
  ) => journalSelectionSearch(input, validateTab("journal", input).tab),
  component: Screen,
});
function Screen() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ActorJournal
      {...search}
      onTabChange={(tab) => void navigate({ search: { ...search, tab } })}
    />
  );
}

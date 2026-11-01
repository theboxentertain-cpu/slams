import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { StuckIntervention } from "@/components/foundation/WorkspacePages";
export const Route = createFileRoute("/stuck/intervention")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) =>
    validateTab("intervention", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <StuckIntervention tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

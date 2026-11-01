import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { StuckIntake } from "@/components/foundation/WorkspacePages";
export const Route = createFileRoute("/stuck/")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("stuck", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <StuckIntake tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

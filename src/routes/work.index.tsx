import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { WorkHub } from "@/components/foundation/WorkspacePages";
export const Route = createFileRoute("/work/")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("work", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <WorkHub tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

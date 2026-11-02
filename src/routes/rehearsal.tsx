import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { RehearsalHub } from "@/components/foundation/WorkspacePages";
export const Route = createFileRoute("/rehearsal")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("rehearsal", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <RehearsalHub tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

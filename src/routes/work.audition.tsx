import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { AuditionFile } from "@/components/foundation/WorkspacePages";
export const Route = createFileRoute("/work/audition")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("audition", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <AuditionFile tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

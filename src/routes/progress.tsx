import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { ProgressPage } from "@/components/foundation/ProgressPage";
export const Route = createFileRoute("/progress")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("progress", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <ProgressPage tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

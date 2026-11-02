import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/work/journal")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("journal", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SupportPage id="journal" tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />
  );
}

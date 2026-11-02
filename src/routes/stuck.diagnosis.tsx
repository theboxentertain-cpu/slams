import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/stuck/diagnosis")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("diagnosis", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SupportPage
      id="diagnosis"
      tab={tab}
      onTabChange={(tab) => void navigate({ search: { tab } })}
    />
  );
}

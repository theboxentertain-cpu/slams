import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SettingsPage } from "@/components/foundation/SettingsPage";
export const Route = createFileRoute("/settings")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("settings", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <SettingsPage tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}

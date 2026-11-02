import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/stuck/saved")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("fixes", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="fixes" />;
}

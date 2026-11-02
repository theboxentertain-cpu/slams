import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/stuck/diagnosis")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("diagnosis", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="diagnosis" />;
}

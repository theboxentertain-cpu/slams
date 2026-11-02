import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/stuck/retry")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("retry", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="retry" />;
}

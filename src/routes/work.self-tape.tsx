import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/work/self-tape")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("selfTape", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="selfTape" />;
}

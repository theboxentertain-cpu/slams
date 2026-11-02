import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/work/character")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("character", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="character" />;
}

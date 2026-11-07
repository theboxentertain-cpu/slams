import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { projectSelectionSearch } from "@/lib/actor-audition-copy";
import { ActorProjectDetail } from "@/components/foundation/ActorProjectDetail";

export const Route = createFileRoute("/work/breakdown")({
  validateSearch: (input: { tab?: unknown; projectId?: unknown } & SearchSchemaInput) =>
    projectSelectionSearch(input, validateTab("breakdown", input).tab),
  component: Screen,
});

function Screen() {
  const { projectId } = Route.useSearch();
  return <ActorProjectDetail kind="breakdown" projectId={projectId} />;
}

import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { projectSelectionSearch } from "@/lib/actor-audition-copy";
import { ActorProjectDetail } from "@/components/foundation/ActorProjectDetail";

export const Route = createFileRoute("/work/character")({
  validateSearch: (input: { tab?: unknown; projectId?: unknown } & SearchSchemaInput) =>
    projectSelectionSearch(input, validateTab("character", input).tab),
  component: Screen,
});

function Screen() {
  const { projectId } = Route.useSearch();
  return <ActorProjectDetail kind="character" projectId={projectId} />;
}

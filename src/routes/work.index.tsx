import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { WorkHub } from "@/components/foundation/WorkspacePages";
import { isWorkId } from "@/lib/actor-rehearsal-model";
export const Route = createFileRoute("/work/")({
  validateSearch: (
    input: { tab?: unknown; projectId?: unknown; auditionId?: unknown } & SearchSchemaInput,
  ) => ({
    ...validateTab("work", input),
    projectId: isWorkId(input.projectId) ? input.projectId : undefined,
    auditionId: isWorkId(input.auditionId) ? input.auditionId : undefined,
  }),
  component: Screen,
});
function Screen() {
  const { tab, projectId, auditionId } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <WorkHub
      tab={tab}
      projectId={projectId}
      auditionId={auditionId}
      onTabChange={(tab) => void navigate({ search: { tab } })}
    />
  );
}

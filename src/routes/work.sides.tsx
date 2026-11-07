import { createFileRoute } from "@tanstack/react-router";
import { ActorSidesPage } from "@/components/foundation/ActorSidesPage";

export const Route = createFileRoute("/work/sides")({
  component: ActorSidesPage,
});

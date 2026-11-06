import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy bookmarks lead to working, learner-led practice without claiming automated analysis. */
export const Route = createFileRoute("/stuck/retry")({
  beforeLoad: () => {
    throw redirect({ to: "/stuck", search: { tab: "describe" }, replace: true });
  },
});

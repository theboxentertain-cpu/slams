import { createFileRoute, redirect } from "@tanstack/react-router";

/** Both old intervention tabs repeated the same authored list. Keep bookmarks. */
export const Route = createFileRoute("/stuck/intervention")({
  beforeLoad: () => {
    throw redirect({ to: "/stuck", search: { tab: "describe" }, replace: true });
  },
});

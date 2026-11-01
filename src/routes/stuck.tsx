import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/stuck")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "The Stuck Desk — SLAMS" },
      { name: "description", content: "Quick technique interventions for common scene problems." },
      { property: "og:title", content: "The Stuck Desk — SLAMS" },
      {
        property: "og:description",
        content: "Quick technique interventions for common scene problems.",
      },
    ],
  }),
  component: Outlet,
});

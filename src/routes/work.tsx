import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Actor at Work — SLAMS" },
      { name: "description", content: "Prepare an audition step by step." },
      { property: "og:title", content: "Actor at Work — SLAMS" },
      { property: "og:description", content: "Prepare an audition step by step." },
    ],
  }),
  component: Outlet,
});
